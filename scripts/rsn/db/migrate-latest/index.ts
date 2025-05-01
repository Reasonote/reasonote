import { exec as originalExec } from 'child_process';
import { promises as fs } from 'fs';
import * as _ from 'lodash';
import path from 'path';
import { promisify } from 'util';

import { Command } from '@commander-js/extra-typings';

import { REPO_ROOT_DIR_PATH } from '../../../_utils/paths';
import { CommandAction } from '../../_utils/commander';

const exec = promisify(originalExec);

const dbMigrateLatestCommand = new Command("migrate-latest")
    .description("Run the most recent migration in the supabase migrations folder.")

export const dbMigrateLatestAction: CommandAction<typeof dbMigrateLatestCommand> = async (opts: Parameters<Parameters<typeof dbMigrateLatestCommand.action>[0]>[0]): Promise<{code: number, allStdout: string, allStderr: string}> => {
    const migrationsDir = path.join(REPO_ROOT_DIR_PATH, 'supabase', 'migrations');
    
    let allStdout = '';
    let allStderr = '';
    
    try {
        // Check if migrations directory exists
        try {
            await fs.access(migrationsDir);
        } catch (err) {
            const errorMsg = `Migrations directory not found: ${migrationsDir}`;
            console.error(`❌ ${errorMsg}`);
            return {
                code: 1,
                allStdout: '',
                allStderr: errorMsg,
            };
        }
        
        console.log(`📁 Reading migrations from: ${migrationsDir}`);
        
        // Get all migration files
        const files = await fs.readdir(migrationsDir);
        const sqlFiles = files.filter(f => f.endsWith('.sql'));
        
        if (sqlFiles.length === 0) {
            const msg = 'No migration files found.';
            console.log(`ℹ️ ${msg}`);
            return {
                code: 0,
                allStdout: msg,
                allStderr: '',
            };
        }
        
        console.log(`🔍 Found ${sqlFiles.length} migration files`);

        // Sort files by name (timestamp) in descending order and get the latest
        const latestMigration = sqlFiles.sort().reverse()[0];
        const migrationPath = path.join(migrationsDir, latestMigration);

        console.log(`🔄 Running latest migration: ${latestMigration}`);

        // Read and execute the migration file
        let migrationContent;
        try {
            migrationContent = await fs.readFile(migrationPath, 'utf8');
            console.log(`📄 Successfully read migration file (${migrationContent.length} chars)`);
            
            // Log a preview of the migration content (first 300 chars)
            if (migrationContent.length > 0) {
                const preview = migrationContent.substring(0, 300) + (migrationContent.length > 300 ? '...' : '');
                console.log(`📝 Migration preview:\n${preview}`);
            }
        } catch (err) {
            const errorMsg = `Failed to read migration file: ${err instanceof Error ? err.message : String(err)}`;
            console.error(`❌ ${errorMsg}`);
            return {
                code: 1,
                allStdout: '',
                allStderr: errorMsg,
            };
        }
        
        // Execute the migration using psql
        console.log(`🚀 Executing migration using psql...`);
        
        try {
            const result = await exec(
                `psql -h localhost -p 65433 -U postgres -d postgres -f "${migrationPath}"`,
                {
                    env: {
                        ...process.env,
                        PGPASSWORD: 'postgres'
                    }
                }
            );
            
            allStdout = result.stdout;
            allStderr = result.stderr;
            
            // Log the complete output
            if (allStdout) {
                console.log(`📊 psql stdout:\n${allStdout}`);
            }
            
            if (allStderr) {
                console.log(`⚠️ psql stderr:\n${allStderr}`);
            }
            
            // Check if there was stderr output even though the command technically succeeded
            if (allStderr && allStderr.trim().length > 0) {
                console.log(`⚠️ Migration completed with warnings`);
            } else {
                console.log('✅ Migration completed successfully');
            }
        } catch (err) {
            const execError = err as { code?: number; stderr?: string; stdout?: string };
            allStdout = execError.stdout || '';
            allStderr = execError.stderr || '';
            
            // Log the complete output even in case of error
            if (allStdout) {
                console.log(`📊 psql stdout:\n${allStdout}`);
            }
            
            if (allStderr) {
                console.log(`❌ psql stderr:\n${allStderr}`);
            }
            
            throw new Error(`psql execution failed: ${err instanceof Error ? err.message : String(err)}`);
        }

        return {
            code: 0,
            allStdout,
            allStderr,
        };

    } catch (error) {
        console.error(`❌ Error running migration:`, error);
        return {
            code: 1,
            allStdout,
            allStderr: error instanceof Error ? error.message : String(error),
        };
    }
}

dbMigrateLatestCommand.action(dbMigrateLatestAction)

export default dbMigrateLatestCommand;
