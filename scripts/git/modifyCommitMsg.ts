import fs from 'fs';
import {
  Configuration,
  OpenAIApi,
} from 'openai';
// modifyCommitMsg.ts
import * as readline from 'readline';

async function generateAICommit(): Promise<string | undefined> {
    // Run git diff --cached --name-only and put that in the return string
    const gitDiffResults = await new Promise<string>((resolve, reject) => {
        const child = require('child_process').exec('git diff --cached', (err: any, stdout: any, stderr: any) => {
            if (err) {
                reject(err);
            } else {
                resolve(stdout);
            }
        });
    })

    const openai = new OpenAIApi(new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
    }))

    const aiResults = await openai.createChatCompletion({
        model: "gpt-3.5-turbo-16k",
        messages: [
            {
                role: 'system',
                content: `
                You are the best git commit author in the world.
                You are responsible for writing a succinct commit message for a git diff that the user provides you.

                Do not provide any commentary, just write an excellent commit message.
                The first line of your commit message should be a short description of the change.
                The rest of the commit message should be a more detailed description of the change, in bullet points.
                `
            },
            {
                role: 'user',
                content: `
                GIT DIFF RESULTS:

                ${gitDiffResults}
                `
            }
        ],
        // Low temperature, so that we are more consistent.
        temperature: 0.1,
    })

    // Get the first choice
    const aiResult = aiResults.data.choices[0].message?.content;

    console.log(`🤖 GENERATED COMMIT MESSAGE:\n\`\`\`\n${aiResult}\n\`\`\`\n`);

    return aiResult;
}

async function checkForBugs(): Promise<string | undefined> {
    // Run git diff --cached --name-only and put that in the return string
    const gitDiffResults = await new Promise<string>((resolve, reject) => {
        const child = require('child_process').exec('git diff --cached', (err: any, stdout: any, stderr: any) => {
            if (err) {
                reject(err);
            } else {
                resolve(stdout);
            }
        });
    })

    const openai = new OpenAIApi(new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
    }))

    const aiResults = await openai.createChatCompletion({
        model: "gpt-3.5-turbo-16k",
        messages: [
            {
                role: 'system',
                content: `
                You are the best programmer in the world.

                Your job is to read the git diff below and find any bugs in the code.

                REMEMBER: you're only seeing the git diff, not the full code -- limit your analysis to what you can see.

                If you find any bugs, Write a comment explaining the bug. If you know how to fix it, write a comment explaining how to fix it.

                If you don't find any bugs, that's okay. Don't say anything in that case.
                `
            },
            {
                role: 'user',
                content: `
                GIT DIFF RESULTS:

                ${gitDiffResults}
                `
            }
        ],
        // Low temperature, so that we are more consistent.
        temperature: 0.1,
    })

    // Get the first choice
    const aiResult = aiResults.data.choices[0].message?.content;

    return aiResult;
}



const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
  
const questionAsync = (query: string) => {
    return new Promise<string>((resolve) => {
        rl.question(query, (answer) => {
            resolve(answer);
        });
    });
};

const main = async () => {
    const commitMsgPath = process.argv[2];

    if (!commitMsgPath || commitMsgPath.trim().length === 0) {
        console.error('No commit message path provided!');
        process.exit(1);
    }

    const answer = await questionAsync('Choose Commit Message Type: \n1. Manual\n2. AI\n');

    if (answer === '1') {
        // Manual: Do nothing, proceed with the standard git flow.
        process.exit(0);
    } else if (answer === '2') {
        console.log('Checking for bugs...');
        const bugMsg = await checkForBugs();
        console.log('🐞 BUG ANALYSIS RESULTS:\n', bugMsg);

        const shouldCommit = await questionAsync('Do you still want to commit this? (y/n)');

        if (shouldCommit !== 'y') {
            console.log('Aborting commit.');
            process.exit(1);
        }

        // AI: Generate the AI-based commit message.
        console.log('Generating AI commit message...');
        const aiMsg = await generateAICommit();

        if (!aiMsg) {
            console.error('No AI commit message generated!');
            process.exit(1);
        }
        else {
            console.log('AI commit message generated!');
            fs.writeFileSync(commitMsgPath, aiMsg);
        }
    }

    rl.close();
    process.exit(0); // This line should exit the process either way.
};

main()
    .then(() => {
        console.log('modifyCommitMsg done.')
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });