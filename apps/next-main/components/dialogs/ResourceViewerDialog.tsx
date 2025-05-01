import {X} from "lucide-react";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {PdfViewer} from "@/components/pdf/PdfViewer";
import {Txt} from "@/components/typography/Txt";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton as MuiIconButton,
  Stack,
} from "@mui/material";

type ResourceViewerDialogProps = {
    open: boolean;
    onClose: () => void;
    resourceName: string;
    pdfUrl: string | null;
    searchText?: string;
}

export function ResourceViewerDialog({
    open,
    onClose,
    resourceName,
    pdfUrl,
    searchText,
}: ResourceViewerDialogProps) {

    const isSmallDevice = useIsSmallDevice();

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    height: '90vh',
                    maxHeight: '90vh'
                }
            }}
        >
            <DialogTitle>
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                >
                    <Txt variant="h6" color="text.primary">
                        {resourceName}
                    </Txt>
                    <MuiIconButton onClick={onClose}>
                        <X size={20} />
                    </MuiIconButton>
                </Stack>
                {pdfUrl ? (
                    <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                        <Txt color="primary">View in new tab</Txt>
                    </a>
                ) : (
                    ""
                )}
            </DialogTitle>
            <DialogContent sx={{ p: isSmallDevice ? 0 : 2 }}>
                {pdfUrl ? (
                    <PdfViewer url={pdfUrl} searchText={searchText} />
                ) : (
                    <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 200 }}>
                        <Txt color="text.secondary">No PDF URL available</Txt>
                    </Stack>
                )}
            </DialogContent>
        </Dialog>
    );
} 