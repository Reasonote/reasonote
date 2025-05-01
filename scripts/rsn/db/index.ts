import * as _ from 'lodash';

import { Command } from '@commander-js/extra-typings';

import dbAuthCommand from './auth/cli-generate-auth';
import dbBackupCommand from './backup';
import dbLogsCommand from './logs';
import dbMigrateLatestCommand from './migrate-latest';
import dbResetCommand from './reset';
import dbSeedCommand from './seed';

const dbCommand = new Command("db")
    .description("Commands related to the database.")
    .addCommand(dbSeedCommand)
    .addCommand(dbResetCommand)
    .addCommand(dbBackupCommand)
    .addCommand(dbAuthCommand)
    .addCommand(dbMigrateLatestCommand)
    .addCommand(dbLogsCommand)

export default dbCommand;
