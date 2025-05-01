# Reasonote Graphql Codegen Plugin

This is a plugin which can be used to generate reaseonote-specific code from our graphql endpoint.

## Notes

-   The `preset.ts` file will setup plugins, one per output file.
-   The `plugin.ts` file is the entry point for the plugin. It is responsible for generating the code which will be written to a SINGLE output file.

## Developing

Running `yarn gql-codegen:_rsn:dev` in the `sdk-apollo-client` root will start:

1. A `tsc` watcher which will recompile the plugin on changes.
2. The codegen for the reasonote codegen.

NOTE: As of right now, typescript isn't super happy with our node-modules files for some reason. It doesn't seem to produce bad output, so I'm ignoring it for the time being.

## TODO

-   [ ] Improve typescript packaging. Possibly make this its own package?
