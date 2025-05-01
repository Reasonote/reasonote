# Json Schema to Zod

This package is forked from [json-schema-to-zod](https://github.com/StefanTerdell/json-schema-to-zod)

Removing the following dependencies:

- Prettier
- @apidevtools/json-schema-ref-parser

The reason for this is that we want to use this package in a browser environment, and these dependencies are not compatible with that.

In the future, we may have to fork this package for real, to maintain it ourselves.

But this should suffice for now.

# Disadvantages
The main disadvantages:
- Cannot parse jsonschema with references
- We do not prettify output javascript, which could lead to odd situations.
