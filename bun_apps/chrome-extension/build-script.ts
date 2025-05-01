import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

//@ts-ignore
import * as Bun from 'bun';

// Function to execute shell commands
function executeCommand(command: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
        console.log(`Running: ${command} ${args.join(' ')}`);
        const process = spawn(command, args, { stdio: 'inherit', shell: true });
        
        process.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Command failed with exit code ${code}`));
            }
        });
        
        process.on('error', (err) => {
            reject(err);
        });
    });
}

// Build Tailwind CSS
async function buildCss(watch = false): Promise<void> {
    const args = [
        '-i', './src/styles.css', 
        '-o', './static/build/styles.css'
    ];
    
    if (watch) {
        args.push('--watch');
    }
    
    return executeCommand('tailwindcss', args);
}

// Copy static assets
async function copyStaticAssets(): Promise<void> {
    // Make sure the destination directory exists
    if (!fs.existsSync('./static/build')) {
        fs.mkdirSync('./static/build', { recursive: true });
    }
    
    return executeCommand('cp', ['-r', 'static/images', 'static/build/']);
}

// Build JS/TS files with Bun
async function buildBun(watch = false) {
    const entrypoints = [
        './src/index.tsx',
        './src/contentScript.ts',
        './src/contentMain.ts',
        './src/config.ts',
        './src/youtubeContentScript.ts',
        './src/youtubeContentMain.ts',
        './src/background.ts'
    ];
    
    const buildOptions = {
        entrypoints,
        outdir: './static/build',
        target: 'browser',
        minify: false,
        sourcemap: 'external',
        env: 'inline',
    };
    
    console.log(`Building JS/TS files ${watch ? 'with watch mode' : 'once'}...`);
    return Bun.build(buildOptions);
}

// Check if watch flag is passed
const args = process.argv.slice(2);
const watchMode = args.includes('--watch');

// Main build function that orchestrates all build steps
async function runBuild() {
    try {
        // Always ensure static assets are copied
        await copyStaticAssets();
        
        // Run the Bun build
        const result = await buildBun(watchMode);
        console.log(`Build ${result.success ? 'succeeded' : 'failed'} at ${new Date().toLocaleTimeString()}`);
        
        if (!result.success) {
            console.error(result.logs);
            if (!watchMode) {
                process.exit(1);
            }
        }
    } catch (error) {
        console.error('Build failed:', error);
        if (!watchMode) {
            process.exit(1);
        }
    }
}

// Start the build process
console.log('Starting full build process...');

// Initial build
runBuild();

// Set up tailwind CSS in watch mode if needed
if (watchMode) {
    // Start Tailwind in watch mode (this will run as a separate process)
    buildCss(true).catch(err => {
        console.error('Tailwind CSS watch error:', err);
    });
    
    // Set up file watching for JS/TS files
    const srcDir = path.resolve('./src');
    console.log(`Watching ${srcDir} for JS/TS changes...`);
    
    fs.watch(srcDir, { recursive: true }, (eventType, filename) => {
        // Filter out CSS files as they're handled by Tailwind
        if (filename && !filename.endsWith('.css')) {
            console.log(`File changed: ${filename}, rebuilding...`);
            runBuild();
        }
    });
} else {
    // In non-watch mode, run Tailwind once and exit when done
    buildCss(false).then(() => {
        console.log('Tailwind CSS build completed');
    }).catch(err => {
        console.error('Tailwind CSS build error:', err);
        process.exit(1);
    });
}