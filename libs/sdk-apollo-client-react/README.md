# `@reasonote/lib-sdk-apollo-client-react`

The reasonote REACT SDK for the apollo client.

This SDK is used to interact with the reasonote GraphQL API. It is built on top of the
`@apollo/client` library.

This SDK will be embedded in the top level `@reasonote/sdk` package, but can be used directly if desired.

## Codegen

This library has a codegen script that will generate types for the GraphQL API, using [Graphql Codegen](https://graphql-code-generator.com/).

The default configuration is to target reasonote DEV API, but this can be changed by setting the `reasonote_GRAPHQL_ENDPOINT` environment variable.

This can be run manually with `yarn gql-codegen`.

### Watching Changes

In addition to running the codegen script manually, you can also watch for changes and automatically run the codegen script. This can be done with `yarn gql-codegen:watch`.
