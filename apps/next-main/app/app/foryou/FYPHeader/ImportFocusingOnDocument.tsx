 // This component should show a button that allows the user to import a document to focus on.
  // Once the button is clicked, a modal should appear with a text field.

import {useState} from "react";

import {useMutation} from "@apollo/client";
import {UploadFile} from "@mui/icons-material";
import {
  Button,
  IconButton,
  Modal,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
import {
  createRsnPageFlatMutDoc,
  RsnPage,
} from "@reasonote/lib-sdk-apollo-client";

// Once the user clicks "Go", the modal should disappear and the callback provided to this button should be called with the text field's value.
export function ImportFocusingDocumentButton({
    onImport,
}: {
    onImport: (doc: RsnPage) => void;
}) {
    const [modalOpen, setModalOpen] = useState(false);
    const [documentName, setDocumentName] = useState("");
    const [documentDescription, setDocumentDescription] = useState("");
    const [documentContent, setDocumentContent] = useState("");
    const [createRsnPage] = useMutation(createRsnPageFlatMutDoc);

    return (
        <>
            <Tooltip title="Import a document to focus on">
                <IconButton
                    onClick={() => {
                    setModalOpen(true);
                    }}
                >
                    <UploadFile />
                </IconButton>
            </Tooltip>
            <Modal
                open={modalOpen}
                onClose={() => {
                setModalOpen(false);
                }}
            >
                <Stack
                    direction="column"
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "400px",
                        bgcolor: "background.paper",
                        border: "2px solid #000",
                        boxShadow: 24,
                        p: 4,
                    }}
                >
                <TextField
                    label={'Document Name'}
                    value={documentName}
                    onChange={(ev) => setDocumentName(ev.target.value)}
                />
                <TextField
                    label={'Document Description'}
                    value={documentDescription}
                    onChange={(ev) => setDocumentDescription(ev.target.value)}
                />
                <TextField
                    label={'Document Content'}
                    value={documentContent}
                    onChange={(ev) => setDocumentContent(ev.target.value)}
                />
                <Button
                    onClick={async () => {
                        setModalOpen(false);

                        const createResult = await createRsnPage({
                            variables: {
                                objects: [
                                    {
                                        name: documentName,
                                        description: documentDescription,
                                        body: documentContent,
                                    }
                                ]
                            }
                        })

                        if (createResult.errors) {
                            console.error(createResult.errors);
                            return;
                        }

                        const doc = createResult.data?.insertIntoRsnPageCollection?.records[0];

                        if (!doc) {
                            console.error("No doc");
                            return;
                        }

                        onImport({...doc, nodeId: doc.id})
                    }}
                >
                    Go
                </Button>
                </Stack>
            </Modal>
        </>
    );
}