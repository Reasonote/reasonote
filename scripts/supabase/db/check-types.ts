import { Command } from "commander";
import _ from "lodash";
import { resolve } from "path";
import { psqlCommandString, runCommandSingle, runMultipleDatabaseCommands } from "../../dbUtils";


if (require.main === module) {
    const program = new Command();

    program
        .name('supabase:db:check-types')
        .description('CLI to check types on the supabase database.')
        .version('0.0.0')
        // .option('-s --selectedSchemas <selectedSchemas>', "comma separated, space-less schemas (i.e. 'public,auth')");

    program.parse(process.argv);

    console.log(program.opts());

    const {
        selectedSchemas
    } = program.opts();


    Promise.resolve().then(async () => {
        await runCommandSingle("CREATE EXTENSION IF NOT EXISTS plpgsql_check;")
        const result = await runCommandSingle(`
            SELECT p.oid, p.proname, plpgsql_check_function(p.oid) FROM pg_catalog.pg_namespace n
            JOIN pg_catalog.pg_proc p ON pronamespace = n.oid
            JOIN pg_catalog.pg_language l ON p.prolang = l.oid
            WHERE l.lanname = 'plpgsql' AND p.prorettype <> 2279 AND n.nspname = 'public';
        `);

        // console.log(result.rows);
        const grouped = _.groupBy(result.rows, (r) => r.oid);

        _.keys(grouped).map((k) => {
            const lines = grouped[k];

            const texts = lines.map((l) => l.plpgsql_check_function);
            const isWarning = !!_.find(texts, (l)=>_.startsWith(l, "warning"));
            const str = ["", ...texts].join("\n\t");

            if (isWarning){
                console.log(`WARNING in function '${lines[0].proname}' (oid: ${k})`)
                console.warn(str)
            }
            else{
                console.log(`ERROR in function '${lines[0].proname}' (oid: ${k})`)
                console.error(str)
            }

            console.log("\n")
        })
    })


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

export {};