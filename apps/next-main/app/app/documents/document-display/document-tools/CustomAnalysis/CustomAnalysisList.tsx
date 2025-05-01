import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";

import {
  Button,
  Fade,
  LinearProgress,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import {getAnalyzerFlatQueryDoc} from "@reasonote/lib-sdk-apollo-client";
import {
  ApolloClientInfiniteScroll,
} from "@reasonote/lib-sdk-apollo-client-react";

export interface CustomAnalysisListProps {
    onAnalyzerSelect?: (analyzerId: string) => void;
}

export function CustomAnalysisList({onAnalyzerSelect}: CustomAnalysisListProps) {
    const theme = useTheme();
    const userId = useRsnUserId();

    return userId ? <ApolloClientInfiniteScroll
        wrapperElId="custom-analysis-infinite-scroll-component-id"
        overrideWrapperElProps={{
            className: "overflow-scroll scroll firefox-scroll",
        }}
        overrideInfiniteScrollProps={{
            loader: <Stack width={'fit-content'} alignSelf={'center'}>
                <Typography color={theme.palette.text.primary}>Loading</Typography>
                <LinearProgress/>
            </Stack>,
            style: {
                display: "flex",
                flexDirection: "column",
                // maxHeight: "50vh",
                // overflow: "auto",
                paddingBottom: '10px'
            }
        }}
        queryOpts={{
            query: getAnalyzerFlatQueryDoc,
            variables: {
                filter: {
                    createdBy: {
                        eq: userId
                    }
                },
                first: 6,
            },
        }}
        fetchMoreOptions={(qResult) => ({
            variables: {
                filter: {
                    createdBy: {
                        eq: userId
                    }
                },
                first: 6,
                after: qResult.data?.analyzerCollection?.pageInfo.endCursor || undefined,
            },
        })}
        getChildren={(latestQueryResult) => {
            const analyzers = latestQueryResult.data?.analyzerCollection?.edges.map(
                (edge) => edge.node
            );

            return <Stack gap={1}>
                {analyzers
                    ? analyzers.map((analyzer) => 
                        <Fade in={true} timeout={theme.transitions.duration.standard}>
                            <div>
                                <Button 
                                    onClick={() => {
                                        onAnalyzerSelect && onAnalyzerSelect?.(analyzer.id);
                                    }}
                                >
                                    {analyzer.name}
                                </Button>
                            </div>
                        </Fade>
                    )
                    : null
                }
            </Stack>
        }}
        hasMore={(latestQueryResult) => {
        const ret =
            latestQueryResult.loading ||
            latestQueryResult.data?.analyzerCollection?.pageInfo.hasNextPage;
        return !!ret;
        }}
    /> : null;
}