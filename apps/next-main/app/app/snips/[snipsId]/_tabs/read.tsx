import React from "react";

import {RSNMDXEditor} from "@/components/markdown/mdxeditor/MDXEditor";
import * as styles from "@/styles/semiglobal.module.css";
import {useMutation} from "@apollo/client";
import {MDXEditorMethods} from "@mdxeditor/editor";
import {
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import {updateSnipFlatMutDoc} from "@reasonote/lib-sdk-apollo-client";
import {useSnipFlatFragLoader} from "@reasonote/lib-sdk-apollo-client-react";

export interface SnipsIdTabReadProps {
    snipId: string;
}

export function SnipsIdTabRead({snipId}: SnipsIdTabReadProps) {
    const {data: snip, error, loading, refetch} = useSnipFlatFragLoader(snipId);
    const [updateSnip] = useMutation(updateSnipFlatMutDoc);
    const ref = React.useRef<MDXEditorMethods>(null)

    return error ? (
            <Typography>Error Loading Snip.</Typography>
        )
        : loading ? (
            <Skeleton />
        )
        : (
            <Stack gap={1}>                
                {
                    (snip?.type === 'url' && snip?.extractionState === 'success') || snip?.extractionState === 'unnecessary' || snip?.type === 'text' ?
                        <>
                            <RSNMDXEditor
                                ref={ref}
                                readOnly={true}
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
                                contentEditableClassName={styles['mdxeditor-root-contenteditable-readonly']}
                            />
                        </>
                        :
                        <Skeleton />
                }
            </Stack>
    );
}