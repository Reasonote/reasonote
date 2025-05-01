import { exec as originalExec } from 'child_process';
import * as _ from 'lodash';
import { promisify } from 'util';

import { Command } from '@commander-js/extra-typings';

import {
  RegenSchemaCommand,
  supabaseReset,
} from '../../../supabase/db/regen-schema';
import { CommandAction } from '../../_utils/commander';
import { dbBackupAction } from '../backup';
import { dbSeedAction } from '../seed';

const exec = promisify(originalExec);


const dbResetCommand = new Command("reset")
    .description("Reset the local database.")
    .option("-s, --seed", "Seed the local database after resetting it.")
    .option("-r, --regen-schema", "Regenerate the schema reflection.")
    .option("-c, --codegen", "Rerun the codegen.")
    .option("-n, --no-backup", "Don't backup the database before resetting it.")

export const dbResetAction: CommandAction<typeof dbResetCommand> = async (opts: Parameters<Parameters<typeof dbResetCommand.action>[0]>[0]): Promise<{code: number, allStdout: string, allStderr: string}> => {
    // 0. Backup existing data.
    if (opts.backup){
        await dbBackupAction({});
    }
    
    // 1. Reset the supabase database.
    console.log('🔄 Resetting supabase ...')
    await supabaseReset();
    console.log('✅ Reset supabase.')

    if (opts.regenSchema){
        console.log('🔄 Regenerating schema reflection ...')
        await RegenSchemaCommand.runCommand({ 
            resetDatabaseFirst: false,
        })
        console.log('✅ Regenerated schema reflection.')
    }

    if (opts.codegen){
        console.log('🔄 Rerunning codegen ...')
        // TODO: Run this command at root: `yarn gql-codegen:run && yarn sdk:gen:types:rest`
        const result = await exec('yarn gql-codegen:run && yarn sdk:gen:types:rest');
        // Get stderr and stdout from the result
        const allStdout = result.stdout;
        const allStderr = result.stderr;
        
        console.log('✅ Reran codegen.')
    }

    // 2. Seed the supabase database.
    if (opts.seed) {
        console.log('🔄 Seeding supabase with local ...')
        const result = await dbSeedAction(opts);
        console.log('✅ Seeded supabase with local.')

        return {
            code: result.code,
            allStdout: result.allStdout,
            allStderr: result.allStderr,
        };
    }
    else {
        return {
            code: 0,
            allStdout: '',
            allStderr: '',
        };
    }
}


dbResetCommand.action(dbResetAction)

export default dbResetCommand;
