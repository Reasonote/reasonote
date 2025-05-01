import {
  MouseEvent,
  useEffect,
  useState,
} from "react";

import {ResourceViewerDialog} from "@/components/dialogs/ResourceViewerDialog";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import {
  Badge,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Popover,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {ActivityConfig} from "@reasonote/core";

// Enhanced resource display component that fetches and displays the actual resource
const ResourceDisplay = ({ docId, searchText }: { docId: string, searchText?: string }) => {
    const { sb } = useSupabase();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [resource, setResource] = useState<any | null>(null);
    const [content, setContent] = useState<any | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [pdfDialogOpen, setPdfDialogOpen] = useState(false);

    // Fetch the resource details
    useEffect(() => {
        const fetchRsnPage = async (rsnPageId: string) => {
            const { data: pageData, error: pageError } = await sb
                .from('rsn_page')
                .select('*')
                .eq('id', rsnPageId)
                .single();

            if (pageError) {
                throw new Error(`Error fetching page: ${pageError.message}`);
            }

            setResource(pageData);
            setContent(pageData);

            // If it's a PDF, fetch the signed URL
                if (pageData.file_type?.includes('pdf') && pageData.storage_path) {
                    const { data: urlData, error: urlError } = await sb.storage
                        .from('attachment-uploads')
                        .createSignedUrl(pageData.storage_path, 300);

                    if (urlError) {
                        throw new Error(`Error creating signed URL: ${urlError.message}`);
                    }

                    if (urlData?.signedUrl) {
                        setPdfUrl(urlData.signedUrl);
                        // Auto-open PDF dialog when URL is ready
                        setPdfDialogOpen(true);
                    }
                }
        }

        const fetchResource = async () => {
            setLoading(true);
            try {
                // If the rsn_page id is passed in, just use that
                if (docId.startsWith('rsnpage_')) {
                    await fetchRsnPage(docId);
                }
                else {
                    // First get the resource record
                    const { data, error } = await sb
                        .from('resource')
                        .select('*')
                        .eq('id', docId)
                        .single();

                    if (error) {
                        throw new Error(`Error fetching resource: ${error.message}`);
                    }

                    if (!data) {
                        throw new Error('Resource not found');
                    }

                    setResource(data);

                    // Based on whether it has child_page_id or child_snip_id, fetch the appropriate content
                    if (data.child_page_id) {
                        await fetchRsnPage(data.child_page_id);
                    } else if (data.child_snip_id) {
                        const { data: snipData, error: snipError } = await sb
                            .from('snip')
                            .select('*')
                            .eq('id', data.child_snip_id)
                            .single();

                        if (snipError) {
                            throw new Error(`Error fetching snip: ${snipError.message}`);
                        }

                        setContent(snipData);
                    } else {
                        throw new Error('Resource does not have associated content');
                    }
                }
            } catch (err: any) {
                console.error('Error loading resource:', err);
                setError(err.message || 'An error occurred while loading the resource');
            } finally {
                setLoading(false);
            }
        };

        fetchResource();

        // Cleanup function
        return () => {
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }
        };
    }, [docId, sb]);

    // Extract text to highlight based on citation
    const textToHighlight = searchText ? searchText.trim() : null;

    // Handle text-based content highlighting
    const highlightTextContent = (text: string) => {
        if (!textToHighlight || !text.includes(textToHighlight)) {
            return <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{text}</Typography>;
        }

        const parts = text.split(new RegExp(`(${textToHighlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i'));

        return (
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {parts.map((part, i) => (
                    part.toLowerCase() === textToHighlight.toLowerCase() ? (
                        <Box
                            component="span"
                            key={i}
                            sx={{
                                backgroundColor: 'yellow',
                                px: 0.5,
                                fontWeight: 'bold',
                                borderRadius: '2px',
                            }}
                        >
                            {part}
                        </Box>
                    ) : part
                ))}
            </Typography>
        );
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, width: '100%' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 2, color: 'error.main' }}>
                <Typography variant="subtitle1">Error Loading Resource</Typography>
                <Typography variant="body2">{error}</Typography>
            </Box>
        );
    }

    // Render based on content type
    if (content) {
        // For PDF content - use the ResourceViewerDialog with search text
        if (content.file_type?.includes('pdf') && pdfUrl) {
            return (
                <>
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6" gutterBottom>
                            {content._name || content.original_filename || 'PDF Document'}
                        </Typography>

                        {textToHighlight && (
                            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                                We'll search for: "{textToHighlight}"
                            </Typography>
                        )}

                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => setPdfDialogOpen(true)}
                            sx={{ mt: 2 }}
                        >
                            View PDF
                        </Button>
                    </Box>

                    <ResourceViewerDialog
                        open={pdfDialogOpen}
                        onClose={() => setPdfDialogOpen(false)}
                        resourceName={content._name || content.original_filename || 'PDF Document'}
                        pdfUrl={pdfUrl}
                        searchText={textToHighlight || undefined}
                    />
                </>
            );
        }

        // For text content from rsn_page with highlighting
        if (content.content || content.raw_text) {
            const textContent = content.content || content.raw_text;
            return (
                <Paper elevation={0} sx={{ p: 2, minHeight: 300, maxHeight: '60vh', overflow: 'auto' }}>
                    <Typography variant="h6" gutterBottom>
                        {content._name || content.original_filename || 'Document Content'}
                    </Typography>
                    {highlightTextContent(textContent)}
                </Paper>
            );
        }

        // For snip content with highlighting
        if (content.text) {
            return (
                <Paper elevation={0} sx={{ p: 2, minHeight: 300, maxHeight: '60vh', overflow: 'auto' }}>
                    <Typography variant="h6" gutterBottom>
                        {content._name || 'Snippet'}
                    </Typography>
                    {highlightTextContent(content.text)}
                </Paper>
            );
        }
    }

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="subtitle1">Resource Found</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                This resource type is not supported for display.
            </Typography>
        </Box>
    );
};

// Type for resource metadata
interface ResourceMetadata {
    id: string;
    name: string;
    loading: boolean;
    error?: string;
    url?: string;
    type?: 'page' | 'snip' | 'url' | 'unknown';
}

export function ActivityCitationHeaderIndicator({ activityConfig }: { activityConfig: ActivityConfig }) {
    const { sb } = useSupabase();
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [selectedCitation, setSelectedCitation] = useState<{ docId: string, startText?: string, endText?: string } | null>(null);
    const [resourceMetadata, setResourceMetadata] = useState<Record<string, ResourceMetadata>>({});

    // Fetch resource metadata for all citations
    useEffect(() => {
        if (!activityConfig.citations?.length) return;

        const fetchResourceMetadata = async () => {
            const uniqueDocIds = Array.from(new Set(activityConfig.citations?.map(c => c.docId) || []));

            // Initialize metadata with loading state for all citations
            const initialMetadata: Record<string, ResourceMetadata> = {};
            uniqueDocIds.forEach(id => {
                initialMetadata[id] = {
                    id,
                    name: id, // Default to ID until we load the name
                    loading: true
                };
            });
            setResourceMetadata(initialMetadata);

            // Fetch metadata for each citation
            for (const docId of uniqueDocIds) {
                try {
                    // First get the resource record
                    const { data, error } = await sb
                        .from('resource')
                        .select('*')
                        .eq('id', docId)
                        .single();

                    if (error) {
                        setResourceMetadata(prev => ({
                            ...prev,
                            [docId]: {
                                ...prev[docId],
                                loading: false,
                                error: `Error fetching resource: ${error.message}`,
                                name: docId, // Fallback to ID
                            }
                        }));
                        continue;
                    }

                    if (!data) {
                        setResourceMetadata(prev => ({
                            ...prev,
                            [docId]: {
                                ...prev[docId],
                                loading: false,
                                error: 'Resource not found',
                                name: docId, // Fallback to ID
                            }
                        }));
                        continue;
                    }

                    // Store the URL if available from the metadata or fallback to empty string
                    let url = '';
                    try {
                        if (data.metadata && typeof data.metadata === 'object') {
                            const metadata = data.metadata as any;
                            url = metadata.url || '';
                        }
                    } catch (e) {
                        console.error('Error parsing resource metadata URL:', e);
                    }

                    // Based on whether it has child_page_id or child_snip_id, fetch the appropriate content
                    if (data.child_page_id) {
                        const { data: pageData, error: pageError } = await sb
                            .from('rsn_page')
                            .select('*')
                            .eq('id', data.child_page_id)
                            .single();

                        if (pageError || !pageData) {
                            setResourceMetadata(prev => ({
                                ...prev,
                                [docId]: {
                                    ...prev[docId],
                                    loading: false,
                                    error: pageError ? `Error fetching page: ${pageError.message}` : 'Page not found',
                                    name: url || docId, // Fallback to URL or ID
                                    url,
                                    type: 'page'
                                }
                            }));
                            continue;
                        }

                        // For pages, use _name or original_filename or fallback to URL/ID
                        const name = pageData._name || pageData.original_filename || url || docId;
                        setResourceMetadata(prev => ({
                            ...prev,
                            [docId]: {
                                ...prev[docId],
                                loading: false,
                                name,
                                url,
                                type: 'page'
                            }
                        }));
                    } else if (data.child_snip_id) {
                        const { data: snipData, error: snipError } = await sb
                            .from('snip')
                            .select('*')
                            .eq('id', data.child_snip_id)
                            .single();

                        if (snipError || !snipData) {
                            setResourceMetadata(prev => ({
                                ...prev,
                                [docId]: {
                                    ...prev[docId],
                                    loading: false,
                                    error: snipError ? `Error fetching snip: ${snipError.message}` : 'Snip not found',
                                    name: url || docId, // Fallback to URL or ID
                                    url,
                                    type: 'snip'
                                }
                            }));
                            continue;
                        }

                        // For snips, use _name or fallback to URL/ID
                        const name = snipData._name || url || docId;
                        setResourceMetadata(prev => ({
                            ...prev,
                            [docId]: {
                                ...prev[docId],
                                loading: false,
                                name,
                                url,
                                type: 'snip'
                            }
                        }));
                    } else if (url) {
                        // If it's just a URL, use that
                        setResourceMetadata(prev => ({
                            ...prev,
                            [docId]: {
                                ...prev[docId],
                                loading: false,
                                name: url,
                                url,
                                type: 'url'
                            }
                        }));
                    } else {
                        // Fallback to just the ID
                        setResourceMetadata(prev => ({
                            ...prev,
                            [docId]: {
                                ...prev[docId],
                                loading: false,
                                name: docId,
                                type: 'unknown'
                            }
                        }));
                    }
                } catch (err: any) {
                    console.error('Error loading resource metadata:', err);
                    setResourceMetadata(prev => ({
                        ...prev,
                        [docId]: {
                            ...prev[docId],
                            loading: false,
                            error: err.message || 'An error occurred while loading the resource',
                            name: docId, // Fallback to ID
                        }
                    }));
                }
            }
        };

        fetchResourceMetadata();
    }, [activityConfig.citations, sb]);

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleCitationClick = (citation: { docId: string, startText?: string, endText?: string }) => {
        setSelectedCitation(citation);
    };

    const handleResourceDialogClose = () => {
        setSelectedCitation(null);
    };

    const open = Boolean(anchorEl);
    const id = open ? 'citations-popover' : undefined;

    if (!activityConfig.citations?.length) {
        return null;
    }

    // Get the selected resource metadata if there's a selected citation
    const selectedResourceMetadata = selectedCitation
        ? resourceMetadata[selectedCitation.docId]
        : null;

    return (
        <>
            <Tooltip title="View Citations">
                <Badge
                    badgeContent={activityConfig.citations.length > 0 ? activityConfig.citations.length : 0}
                    color="primary"
                    sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem' } }}
                    invisible={activityConfig.citations.length < 1}
                >
                    <IconButton
                        size="small"
                        onClick={handleClick}
                        color="inherit"
                        sx={{ color: 'white' }}
                        aria-describedby={id}
                    >
                        <FormatQuoteIcon />
                    </IconButton>
                </Badge>
            </Tooltip>

            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
            >
                <Box sx={{ p: 2, maxWidth: 400 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>Citations</Typography>
                    <Stack spacing={1.5}>
                        {activityConfig.citations.map((citation) => {
                            const metadata = resourceMetadata[citation.docId];
                            const isLoading = metadata?.loading;
                            const name = metadata?.name || citation.docId;

                            return (
                                <Box key={citation.docId}>
                                    <Chip
                                        label={isLoading ? (
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <CircularProgress size={12} sx={{ mr: 1 }} />
                                                Loading...
                                            </Box>
                                        ) : name}
                                        color="primary"
                                        size="small"
                                        sx={{ mb: 0.5, cursor: 'pointer' }}
                                        onClick={() => handleCitationClick(citation)}
                                    />
                                    {(citation.startText || citation.endText) && (
                                        <Typography
                                            variant="body2"
                                            sx={{ ml: 1, fontStyle: 'italic', cursor: 'pointer' }}
                                            onClick={() => handleCitationClick(citation)}
                                        >
                                            {citation.startText && `"${citation.startText}...`}
                                            {citation.endText && `...${citation.endText}"`}
                                        </Typography>
                                    )}
                                </Box>
                            );
                        })}
                    </Stack>
                </Box>
            </Popover>

            {/* Resource Display Dialog */}
            <Dialog
                open={Boolean(selectedCitation)}
                onClose={handleResourceDialogClose}
                maxWidth="md"
                fullWidth
            >
                {selectedCitation && (
                    <>
                        <DialogTitle>
                            {selectedResourceMetadata?.loading ? (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <CircularProgress size={16} sx={{ mr: 1 }} />
                                    Loading resource...
                                </Box>
                            ) : (
                                <>
                                    {selectedResourceMetadata?.name || 'Citation Resource'}
                                    <Typography variant="subtitle2" color="text.secondary">
                                        {selectedCitation.docId}
                                    </Typography>
                                </>
                            )}
                        </DialogTitle>
                        <DialogContent dividers>
                            <ResourceDisplay
                                docId={selectedCitation.docId}
                                searchText={selectedCitation.startText}
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleResourceDialogClose}>Close</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </>
    );
}