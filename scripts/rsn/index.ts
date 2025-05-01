import _ from 'lodash';

import { Command } from '@commander-js/extra-typings';

import dbCommand from './db';
import lmnrUpCommand from './lmnr/up';
import upCommand from './up';

if (require.main === module) {
    const program = new Command();

    program
        .name('rsn')
        .description('The reasonote CLI.')
        .version('0.0.0')
        .addCommand(dbCommand)
        .addCommand(upCommand)
        .addCommand(lmnrUpCommand)

    program.parse(process.argv);
}
