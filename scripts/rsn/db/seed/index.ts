import fs from 'fs/promises';
import * as _ from 'lodash';
import path from 'path';
import { Client } from 'pg';

import { Command } from '@commander-js/extra-typings';

import { LOCAL_SEED_DIR_PATH } from '../../../_utils/paths';
import { CommandAction } from '../../_utils/commander';

const dbSeedCommand = new Command("seed")
    .description("Seed the local database.")

export const dbSeedAction: CommandAction<typeof dbSeedCommand> = async (opts: Parameters<Parameters<typeof dbSeedCommand.action>[0]>[0]): Promise<{code: number, allStdout: string, allStderr: string}> => {
    // Connection parameters for your PostgreSQL database
    const client = new Client({
        host: "localhost",
        port: 65433,
        user: "postgres",
        password: "postgres",
        database: "postgres",
    });
    await client.connect();

    async function executeSQLFiles(files: string[]) {
        try {
            for (const file of files) {
                console.log(`Executing SQL file: ${file}`);
                
                // Read SQL file
                const sql = await fs.readFile(file, 'utf8');

                if (sql.trim() === '') {
                    console.log(`Skipping empty file: ${file}`);
                    continue;
                }
                
                // Execute SQL file
                await client.query(sql);
                
                console.log(`Executed SQL file: ${file}`);
            }
            
            console.log('All SQL files have been executed successfully.')
        } catch (error) {
            console.error(`Error executing SQL files: ${error}`);
        } finally {
        }
    }

    console.log('🔄 Seeding supabase with local ...')
    const files = await fs.readdir(LOCAL_SEED_DIR_PATH);
    const filesWithFullPath = files.map((f) => path.join(LOCAL_SEED_DIR_PATH, f));
    const sqlFiles = filesWithFullPath.filter((f) => f.endsWith('.sql'));

    try {
        await executeSQLFiles(sqlFiles);
        console.log('✅ Seeded supabase with local.')

        return {
            code: 0,
            allStdout: '',
            allStderr: '',
        };
    }
    catch (error) {
        console.error(`Error seeding supabase with local: ${error}`);

        return {
            code: 1,
            allStdout: '',
            allStderr: '',
        };
    }
    finally {
        await client.end();
    }
}


dbSeedCommand.action(dbSeedAction)

export default dbSeedCommand;
