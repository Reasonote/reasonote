import { generate } from '@graphql-codegen/cli';
import { requireEnvVar } from '@reasonote/lib-utils-backend';

import config from './rsn-codegen-config';

const REASONOTE_GRAPHQL_ENDPOINT = requireEnvVar("REASONOTE_GRAPHQL_ENDPOINT");
const REASONOTE_SUPABASE_ANON_KEY = requireEnvVar("REASONOTE_SUPABASE_ANON_KEY");

async function doSomething() {
    const out = await generate(
        config,
        true
    );
}

doSomething().then(() => {
    console.log('Generated files');
  })
  .catch((error) => {
    console.error(error);
  });