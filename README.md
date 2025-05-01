# Reasonote

## What Is Reasonote? 🚀

Reasonote is your personal AI learning assistant - a hub for mastering the information you value most. It's an intelligent knowledge management platform that helps you capture, organize, and deeply understand complex information.

Key features:
- 📄 **Document Processing**: Upload PDFs or text files and Reasonote automatically extracts the knowledge
- 🧠 **Knowledge Graph**: Build connections between concepts with automatically generated knowledge graphs
- 📚 **Interactive Lessons**: Learn with bite-sized (10-20 minute) interactive lessons that fit into your schedule
- ✏️ **AI-Generated Practice Activities**: Master material with AI-generated practice activities with citations to source material
- 🌐 **Open Source**: Built on open-source foundations, so you can see under the hood and make it your own



## 👉 Getting Started 👈

> **System Compatibility:** For the optimal experience, we recommend using macOS or Linux-derived systems. If you're on Windows, please use WSL (Windows Subsystem for Linux) as Reasonote has limited testing on native Windows environments.

### STEP 1: ⚙️ Setup
1. Install Prerequisites
    - [Node.js](https://nodejs.org/en/)
    - [Yarn](https://classic.yarnpkg.com/en/docs/install/#mac-stable)
    - [Bun](https://bun.sh/docs/installation)
    - [Docker](https://docs.docker.com/get-docker/)
    - [Docker Compose](https://docs.docker.com/compose/install/)
2. `git clone` this repository
3. `cd [DIRECTORY_YOU_CLONED_TO]`
  
### STEP 2: 🔄 Run
Reasonote is a Full-Stack application with the following components:
- Postgres (Supabase) DB for persistence (includes auto-generated Rest/GraphQL APIs, Real-Time change detection, and Auth)
- Next.js Frontend

To Get Started:
1. Populate your `.env` file with the correct values. You can use the `.env.example` file as a template. Any `REQUIRED` values should be filled out for basic functionality. `OPTIONAL` values are not required, but may be needed for certain features.
2. `yarn install` -- install dependencies
3. `yarn dev` to run (or `yarn dev:log` to run with logfile output) This will start the following process groups:
    - DB + DB API (Supabase): The local supabase set of Docker containers.
    - Next.js: The Next.js server, which will automatically reload on changes.
    - Graphql-Codegen: The graphql-codegen server. This will listen to the DB API and generate typescript types for the graphql schema.


That's it! You should be fully running.

You should be able to access the Next.js app at this point by going to http://localhost:3456

The default credentials are:
- Email: `system@reasonote.com`
- Password: `rootchangeme`

(You should save these to your password manager so you don't have to type them often!)


# Development Tools

## Type Checking
`yarn type-check` -- Runs the typescript checker for the entire monorepo. Useful for catching errors before trying to perform a build.

## Tests
NOTE: some test commands will be changing in the near future.
### Frontend Unit Tests
`yarn test:fe:vitest`

### Unit Tests
`yarn test:vitest` -- Runs unit tests at the top level of the monorepo.

## Installing New Dependencies In The Monorepo

Usually, you should install new dependencies in a specific app or package, rather than in the root.

You can do this by running `yarn workspace @reasonote/[app-or-package] add [dependency]`
