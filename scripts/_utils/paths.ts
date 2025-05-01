import path from 'path';

/**
 * The root directory of the repo.
 */
export const REPO_ROOT_DIR_PATH=path.resolve(path.join(__dirname, "..", ".."));

/**
 * The path to the directory containing the local-only seeds.
 */
export const LOCAL_SEED_DIR_PATH=path.join(REPO_ROOT_DIR_PATH, "supabase", ".seeds-local");

