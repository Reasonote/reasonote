import { Command } from 'commander';
import fs from 'fs';
import _ from 'lodash';

import { DEFAULT_PERSONA_LIST } from './personas';

if (require.main === module) {
    const program = new Command();

    program
        .name('supabase:db:format-json-to-tuples')
        .description('CLI to format persona json format to tuples that can be used in sql.')
        .version('0.0.0')
    // .option('-f --filePath <filePath>', 'file to read from');

    program.parse(process.argv);

    console.log(program.opts());

    const {
    } = program.opts();

    // Load the file from filePath into JSON
    const json = DEFAULT_PERSONA_LIST;

    // Print the keys in this order: name, description, prompt, avatarUrl
    const keys = ['name', 'description', 'prompt', 'avatarUrl'];
    const res = json.map((obj: any) => {
        const values = keys.map((k) => obj[k]);
        const str = `('${values.join("','")}')`;
        return str;
    }).join('\n')

    fs.writeFileSync('./personas.sql', res);

    console.log(res)

    // Promise.resolve().then(async () => {
    //     const list
    // })


    // runMultipleDatabaseCommands([psqlCommandString(`CREATE EXTENSION IF NOT EXISTS plpgsql_check; ${stuff}`)])
    //     .then((objs) => {
    //         console.log(objs);
    //     })

    // RegenSchemaCommand.runCommand({selectedSchemas: selectedSchemas ? selectedSchemas.split(",") : undefined})
    //     .then(()=>{console.log("✅ All done!")})
    //     .catch((err)=>{
    //         console.error("❌ There were issues while running this job.");
    //         console.error(`ERR RETURNED: ${err}`);
    //     })
}
