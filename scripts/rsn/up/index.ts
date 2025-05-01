import { spawn } from 'child_process';

import { Command } from '@commander-js/extra-typings';

const upCommand = new Command('up')
  .description('Start the development environment')
  .action(async () => {
    try {
        // Helper function to spawn a process and handle stdout/stderr
        const runScript = (name: string, command: string, args: string[]) => {
            return new Promise<void>((resolve, reject) => {
            const proc = spawn(command, args, { stdio: 'pipe' });

            proc.stdout.setEncoding('utf8');
            proc.stderr.setEncoding('utf8');

            proc.stdout.on('data', (data) => {
                console.log(`[${name}/stdout]: ${data}`);
            });

            proc.stderr.on('data', (data) => {
                console.error(`[${name}/stderr]: ${data}`);
            });

            proc.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`${name} exited with code ${code}`));
                } else {
                    resolve();
                    }
                });
            });
        };

        // Run sb:restart and wait for completion
        console.log('🔄 Starting sb:restart...');
        await runScript('sb', 'yarn', ['sb:restart']);
        console.log('✅ sb:restart completed.');

        // Run next:dev and gen:watch concurrently
        console.log('🔄 Starting next:dev and gen:watch...');
        const nextDev = runScript('next', 'yarn', ['next:dev']);
        const genWatch = runScript('gen', 'yarn', ['gen:watch']);

        await Promise.all([nextDev, genWatch]);
        console.log('✅ next:dev and gen:watch are running.');
    } catch (error) {
        console.error('Error starting development environment:', error);
        process.exit(1);
    }
});

export default upCommand;