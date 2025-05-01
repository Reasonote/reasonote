import babelParser from 'prettier/parser-babel';
import prettier from 'prettier/standalone';

export const format = (source: string): string =>
  prettier.format(source, {
    parser: "babel",
    plugins: [babelParser],
  });
