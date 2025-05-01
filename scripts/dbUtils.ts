import { exec } from 'child_process';
import _, { isString } from 'lodash';
import { Client } from 'pg';
import * as util from 'util';

import { notEmpty } from './utils';

export async function runMultipleDatabaseCommandsObj(commandsObj: { [key: string]: string }): Promise<{ [key: string]: { stdout: string, stderr: string } }> {
    // Map the objects from the commands
    const metadataEntries = _.entries(commandsObj).map(([k, v]) => {
        return { key: k, data: v }
    });

    // Create an array that is a flattened version of all the entries.
    const constructedArr = metadataEntries.map(({ data }) => data)

    // Run the commands.
    const result = await runMultipleDatabaseCommands(constructedArr);

    // Create the return object.
    return Object.fromEntries(_.zip(metadataEntries.map((m) => m.key), result));
}


export async function getPostgresClient(){
    const client = new Client({
        host: "localhost",
        port: 65432,
        user: "postgres",
        password: "postgres",
        database: "postgres",
    });
    await client.connect();

    return client;
}

export async function runCommandSingle(s: string, host = "localhost", password = "postgres", port = 65432) {
    const client = new Client({
        host: host,
        port: port,
        user: "postgres",
        password: password,
        database: "postgres",
    });
    await client.connect();
    const res = await client.query(s);
    await client.end();

    return res;
}


export async function runMultipleDatabaseCommands(commands: string[]): Promise<{ stdout: string, stderr: string }[]> {
    const separator = "___RMDBCSEP___";
    const commandsStr = commands.join(` ; echo '${separator}' | tee /dev/stderr ; `);

    // if (commandsStr.includes('"')){
    //     throw Error("runMultipleDatabaseCommands: Commands cannot contain the double quote character: \"")
    // }

    commandsStr.replaceAll('"', '\"');

    const command = `docker exec supabase_db_reasonote sh -c "${commandsStr}"`

    let stderr, stdout = '';
    try {
        const result = await util.promisify(exec)(command);

        stderr = result.stderr;
        stdout = result.stdout;
    }
    catch (err: any) {
        // If it fails, that's okay. We still want to report those cases that succeeded.
        stderr = err.stderr;
        stdout = err.stdout;
    }

    const stderrEntries: string[] = stderr.split(`${separator}\n`).filter(isString);
    const stdoutEntries: string[] = stdout.split(`${separator}\n`).filter(isString);

    return _.zip(stdoutEntries, stderrEntries)
        .map(([out, err]) => {
            // If either is not defined, throw.
            if (out !== undefined && err !== undefined) {
                return { stdout: out, stderr: err }
            }
            else {
                throw new Error("runMultipleDatabaseCommands: Did not receive same number of stderr and stdout entries from pipe.")
            }
        });
}


export async function getTableNamesFromPostgres(schemaName: string) {
    const command = `docker exec supabase_db_reasonote psql -h localhost -p 5432 -U postgres -d postgres -c '\\dt ${schemaName}.*'`;
    const result = await util.promisify(exec)(command);

    // Output should look like:
    // stdout:                       List of relations
    // Schema |               Name               | Type  |  Owner   
    // --------+----------------------------------+-------+----------
    // public | access_level_permission          | table | postgres
    // ...
    // Get the relation
    const lines = result.stdout.split("\n");

    const table_names = _.flatten(lines.slice(3).map((line) => {
        const table_name_re = /^[^\|]+\|([^\|]+)/;

        const results = table_name_re.exec(line);
        const group = results ? _.trim(results[1]) : null;

        return group;
    }))

    return table_names.filter(notEmpty);
}

export async function getViewNamesFromPostgres(schemaName: string) {
    const command = `docker exec supabase_db_reasonote psql -h localhost -p 5432 -U postgres -d postgres -c '\\dv ${schemaName}.*'`;
    const result = await util.promisify(exec)(command);

    const lines = result.stdout.split("\n");

    const view_names = _.flatten(lines.slice(3).map((line) => {
        const view_name_re = /^[^\|]+\|([^\|]+)/;

        const results = view_name_re.exec(line);
        const group = results ? _.trim(results[1]) : null;

        return group;
    }))

    return view_names.filter(notEmpty);
}

export async function getFunctionNamesFromPostgres(schemaName: string) {
    const command = `docker exec supabase_db_reasonote psql -h localhost -p 5432 -U postgres -d postgres -c '\\df ${schemaName}.*'`;
    const result = await util.promisify(exec)(command);

    // Output should look like:
    // stdout:                       List of relations
    // Schema |               Name               | Type  |  Owner   
    // --------+----------------------------------+-------+----------
    // public | access_level_permission          | func | postgres
    // ...
    // Get the relation
    const lines = result.stdout.split("\n");

    const function_names = _.flatten(lines.slice(3).map((line) => {
        const function_name_re = /^[^\|]+\|([^\|]+)/;

        const results = function_name_re.exec(line);
        const group = results ? _.trim(results[1]) : null;

        return group;
    }))

    return function_names.filter(notEmpty);
}

export async function psqlBasicGetter(psqlCommand: string) {
    const command = `docker exec supabase_db_reasonote psql -h localhost -p 5432 -U postgres -d postgres -c '${psqlCommand}'`;
    const result = await util.promisify(exec)(command);


    const lines = result.stdout.split("\n");
    const colStrings = lines[1].split("|");

    console.log(colStrings);

    const rows = lines.slice(3, lines.length).map((line) => {
        let colPadding = 0;
        return Object.fromEntries(colStrings.map((s, i) => {
            const colLength = s.length;
            const colName = _.trim(s);
            const data = line.slice(colPadding, colLength);

            colPadding += colLength + 1;

            return [colName, data];
        }))
    })

    return rows;
}

export function psqlCommandString(commandString: string) {
    return `psql -h localhost -p 5432 -U postgres -d postgres -c '${commandString}'`;
}

export function getTableDescriptionCommandString(schemaName: string, tableName: string) {
    return `psql -h localhost -p 5432 -U postgres -d postgres -c '\\dS ${schemaName}.${tableName}'`
}

export async function getTableDescription(schemaName: string, tableName: string) {
    const command = `docker exec supabase_db_reasonote ${getTableDescriptionCommandString(schemaName, tableName)}`;
    const result = await util.promisify(exec)(command);

    return result.stdout;
}


export function dumpTableBySchemaAndNameCommandString(schemaName: string, tableName: string) {
    return `pg_dump -s -t '${schemaName}.${tableName}' 'postgresql://postgres:postgres@localhost:5432/postgres'`;
}

export async function dumpTableBySchemaAndName(schemaName: string, tableName: string) {
    const command = `docker exec supabase_db_reasonote ${dumpTableBySchemaAndNameCommandString(schemaName, tableName)}`;
    const result = await util.promisify(exec)(command);

    return result;
}

export async function pgDumpDb() {
    // This was giving permission error.. using supabase's db dump instead
    // const command = `docker exec supabase_db_reasonote pg_dump -s 'postgresql://postgres:postgres@localhost:5432/postgres'`;
    const command = `yarn supabase db dump --db-url postgresql://postgres:postgres@localhost:65433/postgres`
    const result = await util.promisify(exec)(command);

    return result;
}

export function dumpFunctionBySchemaAndNameCommandString(schemaName: string, functionName: string) {
    return `psql -h localhost -p 5432 -U postgres -d postgres -c '\\sf ${schemaName}.${functionName}'`;
}

export async function dumpFunctionBySchemaAndName(schemaName: string, functionName: string) {
    const command = `docker exec supabase_db_reasonote ${dumpFunctionBySchemaAndNameCommandString(schemaName, functionName)}`
    const result = await util.promisify(exec)(command);

    return result;
}

export function dumpViewBySchemaAndNameCommandString(schemaName: string, viewName: string) {
    return `pg_dump -s -t '${schemaName}.${viewName}' 'postgresql://postgres:postgres@localhost:5432/postgres'`;
}

export async function dumpViewBySchemaAndName(schemaName: string, viewName: string) {
    const command = `docker exec supabase_db_reasonote ${dumpViewBySchemaAndNameCommandString(schemaName, viewName)}`;
    const result = await util.promisify(exec)(command);

    return result;
}

export function dumpTableDataCmdStr(tables: {name: string}[]){
    return `pg_dump -h localhost -p 5432 -U postgres -d postgres ${tables.map((t) => `-t ${t.name} `)}`
}


export async function runPgDumpCommand(commandStr: string){
    const command = `docker exec supabase_db_reasonote pg_dump -h localhost -p 5432 -U postgres -d postgres ${commandStr}`
    const result = await util.promisify(exec)(command);

    return result;
}


export async function dumpTableData(tables: {name: string}[]){
    return runPgDumpCommand(`--on-conflict-do-nothing --rows-per-insert=1 --data-only ${tables.map((t) => `-t ${t.name}`).join(' ')}`)
}