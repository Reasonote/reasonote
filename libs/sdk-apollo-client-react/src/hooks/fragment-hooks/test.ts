import {
  getOperationLogFlatQueryDoc,
  OperationLogFlatFrag,
} from '@reasonote/lib-sdk-apollo-client';

import {
  createFragmentDataLoaders,
} from '../generic-hooks/fragmentDataLoader/createFragmentDataLoaders';

export const { FragLoader: OperationLogFlatFragLoader, useFragLoader: useOperationLogFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "OperationLog",
        fragmentDoc: OperationLogFlatFrag,
        fragmentName: "OperationLogFlatFrag",
        batchQuery: getOperationLogFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.operationLogCollection?.pageInfo,
        },
    });