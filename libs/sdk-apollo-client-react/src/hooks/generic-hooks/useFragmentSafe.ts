import { useMemo } from 'react';

import _ from 'lodash';

import {
  useFragment,
  UseFragmentOptions,
} from '@apollo/client';
import { MissingTree } from '@apollo/client/cache';
import { uuidv4 } from '@reasonote/lib-utils';

export function useFragmentSafe<TFragData, TFragVars>(
    opts: UseFragmentOptions<TFragData, TFragVars> & { from: { id: string | undefined | null } },
) {
    const _opts = useMemo(() => {
        const theId = opts.from.id;
        return _.merge(
            { ...opts },
            // TODO: normally, we could directly use `useFragOptions` here.
            // This is due to a bug with how apollo client handles undefined ids.
            // When the id is undefined, it will simply return an empty object, and set the `complete` flag.
            // To get around this, we set the id to a special string.
            // Because this string contains a uuid, it should never be used as an actual id in practice.
            // This will force useFragment to refresh the fragment every time the id changes.
            { from: { id: theId ? theId : `<USEFRAG_UNDEFINED-${uuidv4()}>` } },
        );
    }, [opts]);

    let fragmentResult: { data?: TFragData | null; complete: boolean; missing?: MissingTree, errorLoading?: any } = {
        data: null,
        complete: false,
    };

    try {
        // Check if the fragment is an empty object
        if (_.isEmpty(_opts.fragment)) {
            throw new Error('Fragment arguments were empty');
        }

        //@ts-ignore
        fragmentResult = useFragment(_opts);
    } catch (error) {
        fragmentResult.errorLoading = error;
    }

    const { data, complete, missing, errorLoading } = fragmentResult;

    // TODO: useFragmentSafe is messing up sysdata somehow. This should be debugged.
    // if (opts.from.id === 'rsnusrsys_01010101-0101-0101-0101-010134501073'){
    //     console.log('useFragmentSafe', JSON.stringify({data, complete, missing}));
    // }

    return {
        // TODO if data is falsy, this will return undefined.
        data: data ? data : undefined,
        complete: complete && !!data,
        missing,
        errorLoading,
    };
}