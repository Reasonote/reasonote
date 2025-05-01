import * as _lodash from "lodash";
import seedrandom from "seedrandom";

export const seedLodash = (seed: string) => {
    const orig = Math.random;
    seedrandom(seed, { global: true });
    const lodash = _lodash.runInContext();
    Math.random = orig;
    return lodash;
};