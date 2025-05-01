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

export interface AnkiCard {
    id: string;
    front: string;
    back: string;
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



                // Query to get the cards and associate them with decks

                db.all(
                    `SELECT cards.id, cards.did, notes.sfld, notes.flds

                    FROM cards

                    JOIN notes ON cards.nid = notes.id`,
                    (err, rows) => {

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

        fs.writeFileSync(apkgPath, buffer);



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