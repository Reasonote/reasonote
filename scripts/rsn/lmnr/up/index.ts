import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

import { Command } from '@commander-js/extra-typings';

const lmnrUpCommand = new Command('lmnr:up')
  .description('Start the LMNR development environment using Docker')
  .action(async () => {
    try {
        // Helper function to spawn a process and handle stdout/stderr
        const runScript = (name: string, command: string, args: string[], options: any = {}) => {
            return new Promise<void>((resolve, reject) => {
                console.log(`🔄 Running ${command} ${args.join(' ')}...`);
                const proc = spawn(command, args, { 
                    stdio: 'pipe',
                    ...options
                });

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

        // Define the path to the lmnr directory
        const gitignorePath = join(process.cwd(), '.gitignored');
        const lmnrPath = join(gitignorePath, 'lmnr');

        // Check if the lmnr directory exists
        if (!existsSync(lmnrPath)) {
            console.log('🔍 LMNR directory not found. Cloning repository...');
            
            // Create .gitignored directory if it doesn't exist
            if (!existsSync(gitignorePath)) {
                console.log('📁 Creating .gitignored directory...');
                await runScript('mkdir', 'mkdir', ['-p', gitignorePath]);
                console.log('✅ Created .gitignored directory.');
            }
            
            // Clone the repository
            await runScript(
                'git', 
                'git', 
                ['clone', 'https://github.com/lmnr-ai/lmnr', lmnrPath]
            );
            console.log('✅ Repository cloned successfully.');
        } else {
            console.log('✅ LMNR directory already exists.');
        }

        // Run docker-compose up
        console.log('🐳 Starting Docker containers...');
        await runScript(
            'docker', 
            'docker-compose', 
            ['up', '-d'], 
            { cwd: lmnrPath }
        );
        
        console.log('🎉 LMNR environment started successfully!');
        console.log('💡 You can access the LMNR application through the configured endpoints.');

    } catch (error) {
        console.error('❌ Error starting LMNR environment:', error);
        process.exit(1);
    }
});

export default lmnrUpCommand;
