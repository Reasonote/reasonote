import AdmZip from "adm-zip";
import * as fs from "fs";
import {
  NextRequest,
  NextResponse,
} from "next/server";
import * as path from "path";
import * as sqlite3 from "sqlite3";

// Helper function to clean up temporary files and directories

function cleanup(paths: string[]): void {
    for (const filePath of paths) {
        if (fs.existsSync(filePath)) {
            fs.rmSync(filePath, { recursive: true, force: true });
        }
    }
}


// Function to safely extract the APKG file and ensure it is not malicious
async function extractApkg(apkgPath: string, outputDir: string): Promise<void> {

    return new Promise((resolve, reject) => {
        try {
            // Perform a basic safety check for file size (e.g., avoid extracting extremely large files)
            const stats = fs.statSync(apkgPath);

            const LARGEST_MB_ALLOWED = 500

            if (stats.size > 500 * 1024 * 1024) { // Example: 100 MB limit
                reject(new Error(`File is too large to process safely. Maximum size allowed is ${LARGEST_MB_ALLOWED} MB.`));

                return;
            }

            const zip = new AdmZip(apkgPath);
            const zipEntries = zip.getEntries();


            // Check for potential zip bomb by verifying number of files and total uncompressed size
            const totalUncompressedSize = zipEntries.reduce((total, entry) => total + entry.header.size, 0);

            if (totalUncompressedSize > 2000 * 1024 * 1024 || zipEntries.length > 10000) { // Example limits
                reject(new Error("Uncompressed size is too large or too many files."));
                return;

            }

            console.log('Extracting APKG file to:', outputDir);

            zip.extractAllTo(outputDir, true);
            resolve();
        } catch (error) {

            reject(error);

        }

    });

}



// Interface definitions for Anki Cards and Decks

/**
 * Represents an Anki flashcard with all available metadata and scheduling information
 */
export interface AnkiCard {
    /** Unique identifier for the card */
    id: string;
    /** Front side content of the card (question) */
    front: string;
    /** Back side content of the card (answer) */
    back: string;
    /** 
     * Next review time (format depends on queue type):
     * - New cards: note id or random int (not a time)
     * - Review cards: integer day count (days since collection creation, not unix timestamp)
     * - Learning cards: unix timestamp in seconds
     */
    due?: number;
    /** Interval in days (used in spaced repetition algorithm) */
    ivl?: number;
    /** Ease factor (typically 2500 = 250%, used in SRS algorithm) */
    factor?: number;
    /** Number of reviews the card has had */
    reps?: number;
    /** Number of times the card went from "answered correctly" to "answered incorrectly" */
    lapses?: number;
    /** 
     * Card type:
     * - 0 = new: Card has never been studied
     * - 1 = learning: Card is currently being learned (in learning steps)
     * - 2 = due/review: Card is a mature card due for review
     */
    type?: number;
    /** 
     * Card queue status:
     * - -3 = scheduled buried: Card is temporarily hidden by Anki's algorithm to avoid interference
     * - -2 = user buried: Card was manually buried by the user until next day
     * - -1 = suspended: Card is suspended and won't appear in reviews until unsuspended
     * - 0 = new: Card is new and ready to be studied for the first time
     * - 1 = learning: Card is in learning mode (going through learning steps)
     * - 2 = review: Card is a mature card ready for review
     * - 3 = relearning: Card failed and is going through relearning steps
     */
    queue?: number;
    /** Last modified timestamp (unix timestamp in seconds since epoch) */
    mod?: number;
    /** 
     * Flag color for manual organization:
     * - 0 = no flag: Card has no flag assigned
     * - 1 = red: Card is flagged red (often used for difficult cards)
     * - 2 = orange: Card is flagged orange (often used for cards needing attention)
     * - 3 = green: Card is flagged green (often used for easy/mastered cards)
     * - 4 = blue: Card is flagged blue (often used for cards needing review)
     */
    flags?: number;
    /** Steps left until graduation (for learning cards) */
    left?: number;
    /** 
     * Original due date (only used when card is in filtered deck):
     * - Same format as 'due' field - varies by original queue type
     * - Review cards: integer day count (days since collection creation)
     * - Learning cards: unix timestamp in seconds
     */
    odue?: number;
    /** Original deck id (only used when card is in filtered deck) */
    odid?: number;
}



export interface AnkiDeck {
    id: string;
    name: string;
    cards: AnkiCard[];
}



// Function to load Anki cards from an APKG file

async function loadAnkiCards(outputDir: string, apkgPath: string): Promise<AnkiDeck[]> {
    await extractApkg(apkgPath, outputDir);


    return new Promise((resolve, reject) => {

        const dbPath = path.join(outputDir, 'collection.anki2');

        const db = new sqlite3.Database(dbPath);

        const decks: AnkiDeck[] = [];

        const deckMap: { [key: string]: AnkiDeck } = {};



        db.serialize(() => {

            // Query to get the decks

            db.get(`SELECT decks FROM col`, (err, row: any) => {

                if (err) {

                    reject(err);

                    return;

                }



                const deckData = JSON.parse(row.decks);

                for (const deckId in deckData) {

                    if (deckData.hasOwnProperty(deckId)) {

                        const deckInfo = deckData[deckId];

                        const deck: AnkiDeck = {

                            id: deckId,

                            name: deckInfo.name,

                            cards: [],

                        };

                        decks.push(deck);

                        deckMap[deckId] = deck;

                    }

                }

                // First, check what columns exist in the cards table
                db.all(`PRAGMA table_info(cards)`, (err, columns: any[]) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    // Build list of available columns
                    const availableColumns = columns.map(col => col.name);
                    const requiredColumns = ['id', 'did', 'nid'];
                    const optionalColumns = ['due', 'ivl', 'factor', 'reps', 'lapses', 'type', 'queue', 'mod', 'flags', 'left', 'odue', 'odid'];
                    
                    // Check that required columns exist
                    const missingRequired = requiredColumns.filter(col => !availableColumns.includes(col));
                    if (missingRequired.length > 0) {
                        reject(new Error(`Missing required columns in cards table: ${missingRequired.join(', ')}`));
                        return;
                    }

                    // Build SELECT clause with only available columns
                    const selectColumns = ['cards.id', 'cards.did', 'notes.sfld', 'notes.flds'];
                    optionalColumns.forEach(col => {
                        if (availableColumns.includes(col)) {
                            selectColumns.push(`cards.${col}`);
                        }
                    });

                    const sql = `SELECT ${selectColumns.join(', ')}
                        FROM cards
                        JOIN notes ON cards.nid = notes.id`;

                    // Query to get the cards and associate them with decks
                    db.all(sql, (err, rows) => {

                        if (err) {

                            reject(err);

                            return;

                        }

                        // DEDUPLICATE CARDS
                        const cardMap: { [key: string]: AnkiCard } = {};


                        rows.forEach((row: any) => {

                            const cardId = row.id;

                            const cardDeckId = row.did;

                            const cardQuestion = row.sfld;

                            const cardAnswer = row.flds.split('\x1f')[1]; // Assuming first field is question and second is answer

                            const card: AnkiCard = {

                                id: cardId,

                                front: cardQuestion,

                                back: cardAnswer,

                                // Only include optional fields if they exist in the database
                                ...(row.due !== undefined && { due: row.due }),
                                ...(row.ivl !== undefined && { ivl: row.ivl }),
                                ...(row.factor !== undefined && { factor: row.factor }),
                                ...(row.reps !== undefined && { reps: row.reps }),
                                ...(row.lapses !== undefined && { lapses: row.lapses }),
                                ...(row.type !== undefined && { type: row.type }),
                                ...(row.queue !== undefined && { queue: row.queue }),
                                ...(row.mod !== undefined && { mod: row.mod }),
                                ...(row.flags !== undefined && { flags: row.flags }),
                                ...(row.left !== undefined && { left: row.left }),
                                ...(row.odue !== undefined && { odue: row.odue }),
                                ...(row.odid !== undefined && { odid: row.odid }),

                            };

                            // DEDUPLICATE CARDS
                            const qaId = `${cardQuestion}${cardAnswer}`;
                            if (!cardMap[qaId]) {
                                cardMap[qaId] = card;
                                if (deckMap[cardDeckId]) {
                                    deckMap[cardDeckId].cards.push(card);
                                }
                            }
                        });



                        db.close((err) => {

                            if (err) {

                                reject(err);

                                return;

                            }

                            resolve(decks);

                        });

                    });
                });

            });

        });

    });

}



// Next.js API route configuration

// export const config = {

//     api: {

//         bodyParser: false,

//     },

// };

const tempDir = '/tmp/reasonote/anki';

// POST handler to process APKG file upload

export const POST = async (req: NextRequest) => {

    fs.mkdirSync(tempDir, { recursive: true });

    // const tempDir = path.join(process.cwd(), 'temp');

    const extractedDir = path.join(tempDir, 'public', 'extracted');

    console.log('tempDir:', tempDir);
    console.log('extractedDir:', extractedDir);

    const cleanupPaths = [tempDir, extractedDir];

    try {

        const formData = await req.formData();

        const file = formData.get('apkgFile') as File;



        if (!file) {

            return NextResponse.json({ error: "No file uploaded." }, { status: 400 });

        }



        // Save the uploaded file to the server

        if (!fs.existsSync(tempDir)) {

            fs.mkdirSync(tempDir);

        }

        const apkgPath = path.join(tempDir, file.name);

        console.log('apkgPath:', apkgPath);

        const buffer = Buffer.from(await file.arrayBuffer());

        fs.writeFileSync(apkgPath, new Uint8Array(buffer));



        // Process the uploaded file

        const decks = await loadAnkiCards(extractedDir, apkgPath);


        // Clean up the temporary and extracted files

        cleanup(cleanupPaths);



        return NextResponse.json({ decks });

    } catch (error) {

        console.error(error);

        cleanup(cleanupPaths);

        return NextResponse.json({ error: "Error processing the request." }, { status: 500 });

    }

};