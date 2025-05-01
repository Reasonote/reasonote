# bun-chrome-ext

First, install Bun:

```bash
npm install -g bun
```

NOTE: we use a special wrapper around `bun` -- `buncli`.

You use it via `./buncli`.

To install dependencies:

```bash
./buncli install
```

To Build the Extension and Watch for changes:

```bash
./buncli run build-script.ts --watch
```

To Install the extension in Chrome:

1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable "Developer mode" if it is not already enabled.
3. Click on "Load unpacked" and select the `static/build` directory of this project.
4. The extension should now be loaded and ready to use.

# Environment Configuration

The extension requires several environment variables to be configured properly. Check the `.env.example` file for all the required variables:

- `SUPABASE_URL`: The URL of your Supabase project
- `SUPABASE_ANON_KEY`: The anonymous/public key for your Supabase project
- `REASONOTE_BACKEND_API_ROOT`: The root URL of the Reasonote backend API

You can copy the `.env.example` file to create your own environment files.

# Building against another environment
By default, the environment variables will be injected from the monorepo root.

If you want to build against another environment (say, dev) You can do the following:

```bash
# Use the --env-file parameter to specify a different environment file
./buncli --env-file=".dev.env" run build-script.ts --watch
```

This will use the environment variables from the `.dev.env` file instead of the default `../../.env` file. You can specify any path to an environment file:

```bash
# Using a specific environment file from another location
./buncli --env-file="../configs/my-env.env" run build-script.ts
```

This approach allows you to easily switch between different environments for development, testing, or production builds without modifying the script.