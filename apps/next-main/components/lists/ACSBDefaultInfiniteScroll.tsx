import {QueryOptions} from "@apollo/client";
import {notEmpty} from "@lukebechtel/lab-ts-utils";
import {
  List,
  Stack,
} from "@mui/material";
import {
  ApolloClientInfiniteScroll,
} from "@reasonote/lib-sdk-apollo-client-react";

export type ACSBQueryDataCollection<TNode> = { 
    edges: {
        node: TNode;
    }[],
    pageInfo: {
        hasNextPage: boolean,
        startCursor?: string | null,
        endCursor?: string | null
    }
}

export type ACSBQueryData<TCollectionName extends string, TNode> = {
    [rootCollectionName in TCollectionName]: ACSBQueryDataCollection<TNode>
}

export type ACSBVariables = {
    after?: string | null
} & Record<string, any>;

export type NodeOf<TCollectionName extends string, TData extends ACSBQueryData<TCollectionName, any>> = TData[TCollectionName]['edges'][number]['node'];

interface ACSBDefaultInfiniteScrollProps<TCollectionName extends string, TCollection extends ACSBQueryDataCollection<TNode>, TVariables extends ACSBVariables, TNode, TData> {
    queryOpts: QueryOptions<TVariables, TData>;
    getCollection: (data: TData) => TCollection | undefined | null;
    getNodes: (collection: TCollection) => TNode[];
    getChild: (node: TNode) => React.ReactNode;
    loader?: React.ReactNode;
    listProps?: Partial<React.ComponentProps<typeof List>>;
    overrideWrapperElProps?: React.HTMLProps<HTMLDivElement>;
    infScrollStyle?: React.CSSProperties;
    emptyListComponent?: React.ReactNode;
}

export function ACSBDefaultInfiniteScroll<TCollectionName extends string,TCollection extends ACSBQueryDataCollection<TNode>, TVariables extends ACSBVariables, TNode, TData>({
    queryOpts,
    getChild,
    loader,
    getCollection,
    getNodes,
    listProps,
    overrideWrapperElProps,
    infScrollStyle,
    emptyListComponent
}: ACSBDefaultInfiniteScrollProps<TCollectionName, TCollection, TVariables, TNode, TData>) {
    return (
        <Stack maxHeight={"700px"}>
          <List {...listProps} style={{overflowY: 'auto', height: '100%', ...listProps?.style}}>
            <ApolloClientInfiniteScroll
              wrapperElId={"list-container"}
              inverse={false}
              overrideWrapperElProps={{
                ...overrideWrapperElProps as any,
                style: {
                  display: "flex",
                  flexDirection: "column",
                  overflowY: "auto",
                  flexGrow: 1,
                  height: "100%",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  ...overrideWrapperElProps?.style
                },
              }}
              overrideInfiniteScrollProps={{
                //@ts-ignore
                loader,
                style: {
                  overflow: "visible",
                  display: "flex",
                  flexDirection: "column",
                  ...infScrollStyle
                },
                // className: "gap-y-4",
              }}
              queryOpts={queryOpts}
              fetchMoreOptions={(qResult: any) => {
                const collection = getCollection(qResult.data);

                const after = collection?.pageInfo.endCursor ?? undefined;
    
                const ret = {
                  variables: {
                    after: after && after.trim().length > 0 ? after : undefined,
                  },
                };

                // TODO Fixme..
                return ret as any;
              }}
              //@ts-ignore
              getChildren={(latestQueryResult: any) => {
                if (latestQueryResult.loading || !latestQueryResult.data) {
                  return loader
                }

                const collection = getCollection(latestQueryResult.data);

                const nodes = collection?.edges.map((edge) => {
                  return edge?.node;
                }).filter(notEmpty);

                if (nodes === undefined || nodes.length === 0) {
                  return emptyListComponent ? emptyListComponent : 'No items found.'
                }
    
                return nodes.map((node) => {
                    return getChild(node);
                })
              }}
              hasMore={(latestQueryResult: any) => {
                

                const collection = latestQueryResult.data ? getCollection(latestQueryResult.data) : undefined;

                const ret =
                  latestQueryResult.loading ||
                  collection?.pageInfo.hasNextPage;
    
                return !!ret;
              }}
            />
          </List>
        </Stack>
    );
}