import { spawn } from 'child_process';
import * as _ from 'lodash';

import { Command } from '@commander-js/extra-typings';

import { CommandAction } from '../../_utils/commander';

const dbLogsCommand = new Command("logs")
    .description("Tail the logs of the database container.")
    .option("-n, --lines <number>", "Number of lines to show from the log history", "100")

export const dbLogsAction: CommandAction<typeof dbLogsCommand> = async (opts: Parameters<Parameters<typeof dbLogsCommand.action>[0]>[0]): Promise<{code: number, allStdout: string, allStderr: string}> => {
    return new Promise((resolve) => {
        console.log('🔄 Tailing database logs...');
        
        const dockerProcess = spawn('docker', ['logs', '-f', '--tail', opts.lines, 'supabase_db_reasonote'], {
            stdio: ['inherit', 'pipe', 'pipe']
        });

        // Handle process output
        dockerProcess.stdout.on('data', (data) => {
            process.stdout.write(data);
        });

        dockerProcess.stderr.on('data', (data) => {
            process.stderr.write(data);
        });

        // Handle process exit
        dockerProcess.on('close', (code) => {
            resolve({
                code: code || 0,
                allStdout: '',
                allStderr: '',
            });
        });

        // Handle interrupt signal (Ctrl+C)
        process.on('SIGINT', () => {
            dockerProcess.kill();
            resolve({
                code: 0,
                allStdout: '',
                allStderr: '',
            });
        });
    });
}

dbLogsCommand.action(dbLogsAction);

export default dbLogsCommand; 