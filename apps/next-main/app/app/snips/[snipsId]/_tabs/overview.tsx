import React from "react";

import {RSNMDXEditor} from "@/components/markdown/mdxeditor/MDXEditor";
import {useMutation} from "@apollo/client";
import {MDXEditorMethods} from "@mdxeditor/editor";
import {
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import {updateSnipFlatMutDoc} from "@reasonote/lib-sdk-apollo-client";
import {useSnipFlatFragLoader} from "@reasonote/lib-sdk-apollo-client-react";

export interface SnipsIdTabOverviewProps {
    snipId: string;
}

export function SnipsIdTabOverview({snipId}: SnipsIdTabOverviewProps) {
    const {data: snip, error, loading, refetch} = useSnipFlatFragLoader(snipId);
    const [updateSnip] = useMutation(updateSnipFlatMutDoc);
    const ref = React.useRef<MDXEditorMethods>(null)

    // TODO: Use a PAGE to do any editing. Directly editing the text_content shouldn't be allowed....

    return error ? (
            <Typography>Error Loading Snip.</Typography>
        )
        : loading ? (
            <Skeleton />
        )
        : (
            <Stack gap={1}>                
                {/* <button onClick={() => ref.current?.insertMarkdown('new markdown to insert')}>Insert new markdown</button>
                <button onClick={() => console.log(ref.current?.getMarkdown())}>Get markdown</button>
                */}
                {
                    (snip?.type === 'url' && snip?.extractionState === 'success') || snip?.extractionState === 'unnecessary' || snip?.type === 'text' ?
                        <>
                            <RSNMDXEditor
                                ref={ref}
                                readOnly={false}
                                markdown={
                                    snip?.textContent && snip.textContent.trim() !== '' ? snip.textContent : ''
                                }
                                onChange={(newContent) => {
                                    updateSnip({
                                        variables: {
                                        set: {
                                            textContent: newContent ?? '',
                                        },
                                        filter: {
                                            id: { eq: snipId },
                                        },
                                        atMost: 1,
                                        },
                                    }).then(() => {
                                        console.log('updated snip')
                                    });
                                }}
                            />
                        </>
                        :
                        <Skeleton />
                }
            </Stack>
    );
}