import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {
  Create,
  ImportExport,
} from "@mui/icons-material";
import {
  Button,
  Card,
  Stack,
  Typography,
} from "@mui/material";

export interface InitialActionCardsProps {
    onSelectCreate: () => void;
    onSelectImport: () => void;
}

export function InitialActionCards({ onSelectCreate, onSelectImport }: InitialActionCardsProps) {
    const isSmallDevice = useIsSmallDevice();

    return (
        <Stack direction={isSmallDevice ? "column" : "row"} gap={2}>
            <Card onClick={onSelectCreate} style={{ cursor: "pointer", padding: "16px", flex: 1 }}>
                <Stack alignItems="center" gap={2}>
                    <Create fontSize="large" />
                    <Typography variant="h6">Create Activities</Typography>
                    <Typography>Create new activities using your own text snippets.</Typography>
                    <Button variant="contained" onClick={onSelectCreate}>Create</Button>
                </Stack>
            </Card>
            <Card onClick={onSelectImport} style={{ cursor: "pointer", padding: "16px", flex: 1 }}>
                <Stack alignItems="center" gap={2}>
                    <ImportExport fontSize="large" />
                    <Typography variant="h6">Import Activities</Typography>
                    <Typography>Import activities from external sources like Anki decks.</Typography>
                    <Button variant="contained" onClick={onSelectImport}>Import</Button>
                </Stack>
            </Card>
        </Stack>
    );
}