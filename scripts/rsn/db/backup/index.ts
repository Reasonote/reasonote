import { exec as originalExec } from 'child_process';
import { promises as fs } from 'fs';
import * as _ from 'lodash';
import path from 'path';
import { promisify } from 'util';

import { Command } from '@commander-js/extra-typings';

import { REPO_ROOT_DIR_PATH } from '../../../_utils/paths';
import { dumpTableData } from '../../../dbUtils';
import { CommandAction } from '../../_utils/commander';

const exec = promisify(originalExec);


const dbBackupCommand = new Command("backup")
    .description("Backup the local database.")

export const dbBackupAction: CommandAction<typeof dbBackupCommand> = async (opts: Parameters<Parameters<typeof dbBackupCommand.action>[0]>[0]): Promise<{code: number, allStdout: string, allStderr: string}> => {
    const backedUpTables = ['rsn_page', 'goal', 'chat']
    
    
    console.log(`🔄 Backing up supabase (tables: ${backedUpTables.join(', ')})...`)
    
    const stuff = await dumpTableData(backedUpTables.map(t => ({name: t})))
    
    // Create a new timestamped file and write out the contents of stuff.stdout to it.
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `rsn-dump-${timestamp}.sql`;
    const filepath = path.join(REPO_ROOT_DIR_PATH, 'supabase', '.backups', filename);

    // Write the file, and any intermediate directories if they don't exist.
    await fs.mkdir(path.dirname(filepath), { recursive: true });
    await fs.writeFile(filepath, stuff.stdout);

    console.log('✅ Backed up supabase (see file at ' + filepath + ')')
    
    return {
        code: 0,
        allStdout: stuff.stdout,
        allStderr: stuff.stderr,
    }
}


dbBackupCommand.action(dbBackupAction)

export default dbBackupCommand;
