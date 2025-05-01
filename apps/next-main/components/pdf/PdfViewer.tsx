import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

import {
  ChangeEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Document,
  Page,
  pdfjs,
} from "react-pdf";

import {
  ArrowBackIos,
  ArrowForwardIos,
  FitScreen,
  ZoomIn,
  ZoomOut,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  CircularProgress,
  IconButton,
  InputBase,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import {Txt} from "../typography/Txt";

// Initialize worker once at module level
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type PdfViewerProps = {
    url: string;
    searchText?: string; // Optional search text to highlight
}

// Interface for matched text position data
interface TextMatch {
    pageIndex: number;
    element: HTMLElement;
    rect: DOMRect;
    text: string;
}

export function PdfViewer({ url, searchText }: PdfViewerProps) {
    // Constants
    const ZOOM_STEP = 0.25;
    const MIN_ZOOM = 0.25; // 25% of base scale
    const MAX_ZOOM = 3; // 300% of base scale
    const CONTAINER_PADDING = 48; // Padding to subtract from container width
    const RESIZE_DEBOUNCE = 200; // ms to debounce resize updates

    const [numPages, setNumPages] = useState<number | null>(null);
    const [isLoadingPdf, setIsLoadingPdf] = useState(true);
    const [pdfError, setPdfError] = useState<string | null>(null);
    const [zoom, setZoom] = useState<number | null>(null);
    const [zoomInput, setZoomInput] = useState('100');
    const [containerWidth, setContainerWidth] = useState<number | null>(null);
    const [originalWidth, setOriginalWidth] = useState<number | null>(null);
    const [baseScale, setBaseScale] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Search state
    const [searchQuery, setSearchQuery] = useState<string>(searchText || '');
    const [searchMessage, setSearchMessage] = useState<string | null>(null);
    
    // New state for search highlights and navigation
    const [textMatches, setTextMatches] = useState<TextMatch[]>([]);
    const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(-1);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [pagesRendered, setPagesRendered] = useState<Set<number>>(new Set());
    const highlightLayerRef = useRef<HTMLDivElement>(null);

    // Add effectiveZoom for delayed rendering
    const [effectiveZoom, setEffectiveZoom] = useState<number | null>(null);
    
    // Use this to store the real zoom that we'll transition to
    const pendingZoomRef = useRef<number | null>(null);

    // Add state to track current page
    const [currentPage, setCurrentPage] = useState<number>(1);

    // Add state to track component width for responsive UI
    const [componentWidth, setComponentWidth] = useState<number>(0);

    const file = useMemo(() => ({ url }), [url]);

    // Initialize search query from searchText prop
    useEffect(() => {
        if (searchText) {
            setSearchQuery(searchText);
            setSearchMessage(`Looking for: "${searchText}"`);
        }
    }, [searchText]);

    // Calculate the appropriate base scale whenever container or original width changes
    const updateBaseScale = useCallback(() => {
        if (!containerWidth || !originalWidth) return;

        const availableWidth = containerWidth - CONTAINER_PADDING;
        if (originalWidth <= availableWidth) {
            // If original PDF fits in container, use scale of 1 (original size)
            setBaseScale(1);
        } else {
            // If PDF is too large, use fit-to-width scale
            setBaseScale(availableWidth / originalWidth);
        }
    }, [containerWidth, originalWidth]);

    // Get container width and update on resize
    useEffect(() => {
        let timeoutId: NodeJS.Timeout | null = null;
        const DEBOUNCE_DELAY = 250; // 250ms debounce delay
        
        const updateWidth = () => {
            if (containerRef.current) {
                const newWidth = containerRef.current.clientWidth;
                setContainerWidth(newWidth);
                
                // Also update component width for responsive UI
                const component = containerRef.current.closest('.MuiBox-root') as HTMLElement;
                if (component) {
                    setComponentWidth(component.clientWidth);
                }
            }
        };
        
        // Debounced update function
        const debouncedUpdateWidth = () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            
            timeoutId = setTimeout(() => {
                updateWidth();
            }, DEBOUNCE_DELAY);
        };
        
        // Initial size calculation (no debounce)
        updateWidth();
        
        // Use ResizeObserver with debounce
        const resizeObserver = new ResizeObserver(() => {
            debouncedUpdateWidth();
        });
        
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
            
            // Also observe the parent component
            const component = containerRef.current.closest('.MuiBox-root') as HTMLElement;
            if (component) {
                resizeObserver.observe(component);
            }
        }
        
        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            
            if (containerRef.current) {
                resizeObserver.unobserve(containerRef.current);
                
                const component = containerRef.current.closest('.MuiBox-root') as HTMLElement;
                if (component) {
                    resizeObserver.unobserve(component);
                }
            }
            resizeObserver.disconnect();
        };
    }, []);

    // Update base scale when widths change
    useEffect(() => {
        updateBaseScale();
    }, [containerWidth, originalWidth, updateBaseScale]);

    // Update zoom when base scale changes
    useEffect(() => {
        if (baseScale !== null) {
            setZoom(baseScale); // Reset to 100% when base scale changes
        }
    }, [baseScale]);

    // Update input field when zoom changes
    useEffect(() => {
        if (zoom !== null && baseScale !== null) {
            const zoomPercentage = Math.round((zoom / baseScale) * 100);
            setZoomInput(String(zoomPercentage));
        }
    }, [zoom, baseScale]);

    // Find text matches in the rendered pages
    const findTextMatches = useCallback(() => {
        if (!searchQuery || !numPages || pagesRendered.size < numPages) return;

        setIsSearching(true);
        setTextMatches([]);
        
        // Small delay to ensure text layers are fully rendered
        setTimeout(() => {
            try {
                const matches: TextMatch[] = [];
                const term = searchQuery.toLowerCase();
                
                // Find all text spans in the PDF
                const textLayers = containerRef.current?.querySelectorAll('.react-pdf__Page__textContent');
                
                if (textLayers) {
                    textLayers.forEach((layer, pageIndex) => {
                        const textElements = layer.querySelectorAll('span');
                        
                        textElements.forEach((element: HTMLElement) => {
                            const text = element.textContent?.toLowerCase() || '';
                            
                            if (text.includes(term)) {
                                const rect = element.getBoundingClientRect();
                                matches.push({
                                    pageIndex,
                                    element,
                                    rect,
                                    text
                                });
                            }
                        });
                    });
                }
                
                setTextMatches(matches);
                
                if (matches.length > 0) {
                    setCurrentMatchIndex(0);
                    setSearchMessage(`Found ${matches.length} matches`);
                } else {
                    setCurrentMatchIndex(-1);
                    setSearchMessage(`No matches found for "${searchQuery}"`);
                }
            } catch (error) {
                console.error('Error searching PDF:', error);
                setSearchMessage(`Error searching: ${error instanceof Error ? error.message : String(error)}`);
            } finally {
                setIsSearching(false);
            }
        }, 500);
    }, [searchQuery, numPages, pagesRendered]);

    // Scroll to the current match
    useEffect(() => {
        if (currentMatchIndex >= 0 && textMatches.length > 0) {
            const match = textMatches[currentMatchIndex];
            if (match && match.element) {
                // Scroll to the element with some offset
                match.element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });

                // Remove any existing highlights
                textMatches.forEach(m => {
                    // Remove any previously added highlight elements
                    const existingHighlight = m.element.querySelector('.pdf-text-highlight');
                    if (existingHighlight) {
                        m.element.removeChild(existingHighlight);
                    }
                    
                    // Create and add highlight element
                    const highlightElement = document.createElement('span');
                    highlightElement.className = 'pdf-text-highlight';
                    highlightElement.style.position = 'absolute';
                    highlightElement.style.left = '0';
                    highlightElement.style.top = '0';
                    highlightElement.style.width = '100%';
                    highlightElement.style.height = '100%';
                    highlightElement.style.backgroundColor = m === match 
                        ? 'rgba(255, 165, 0, 0.5)'  // Active highlight (orange)
                        : 'rgba(255, 255, 0, 0.3)'; // Regular highlight (yellow)
                    highlightElement.style.borderRadius = '2px';
                    highlightElement.style.pointerEvents = 'none';
                    highlightElement.style.zIndex = '-1';
                    
                    // Ensure the text element has a position for the absolute positioning of the highlight
                    // m.element.style.position = 'relative';
                    m.element.appendChild(highlightElement);
                });
                
                // Update search message with current position
                setSearchMessage(`Match ${currentMatchIndex + 1} of ${textMatches.length}`);
            }
        }
    }, [currentMatchIndex, textMatches]);

    // Trigger search when all pages are rendered and search query changes
    useEffect(() => {
        if (numPages && pagesRendered.size === numPages && searchQuery) {
            findTextMatches();
        }
    }, [numPages, pagesRendered, searchQuery, findTextMatches]);

    // Handle when zoom changes - need to recalculate matches
    useEffect(() => {
        if (zoom && searchQuery && textMatches.length > 0) {
            // Clear existing matches and wait for pages to re-render
            setTextMatches([]);
            setPagesRendered(new Set());
        }
    }, [zoom, searchQuery, textMatches.length]);

    // Navigation controls for search results
    const goToPreviousMatch = useCallback(() => {
        if (textMatches.length > 0) {
            setCurrentMatchIndex(prev => 
                prev <= 0 ? textMatches.length - 1 : prev - 1
            );
        }
    }, [textMatches.length]);

    const goToNextMatch = useCallback(() => {
        if (textMatches.length > 0) {
            setCurrentMatchIndex(prev => 
                prev >= textMatches.length - 1 ? 0 : prev + 1
            );
        }
    }, [textMatches.length]);

    const handleLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setIsLoadingPdf(false);
        setPdfError(null);
        // Reset pages rendered
        setPagesRendered(new Set());
    };

    const handleLoadError = (error: Error) => {
        console.error('Error loading PDF:', error);
        setPdfError(error.message);
        setIsLoadingPdf(false);
    };

    const handlePageLoadSuccess = useCallback((page: any) => {
        if (!originalWidth) {
            // Get the original width from the first page
            const viewport = page.getViewport({ scale: 1 });
            setOriginalWidth(viewport.width);
        }
    }, [originalWidth]);

    // Track when each page's text layer is rendered
    const handlePageRenderSuccess = useCallback((pageNumber: number) => {
        setPagesRendered(prev => {
            const newSet = new Set(prev);
            newSet.add(pageNumber);
            return newSet;
        });
    }, []);

    // When zoom changes, debounce the actual rendered width update
    useEffect(() => {
        if (zoom === null) return;
        
        const timeoutId = setTimeout(() => {
            setEffectiveZoom(zoom);
        }, RESIZE_DEBOUNCE);
        
        return () => clearTimeout(timeoutId);
    }, [zoom, RESIZE_DEBOUNCE]);

    // Update the handleZoomIn function
    const handleZoomIn = useCallback(() => {
        if (baseScale === null) return;
        setZoom(prevZoom => {
            if (prevZoom === null) return baseScale;
            return Math.min(prevZoom + (baseScale * ZOOM_STEP), baseScale * MAX_ZOOM);
        });
    }, [baseScale]);

    // Update the handleZoomOut function
    const handleZoomOut = useCallback(() => {
        if (baseScale === null) return;
        setZoom(prevZoom => {
            if (prevZoom === null) return baseScale;
            return Math.max(prevZoom - (baseScale * ZOOM_STEP), baseScale * MIN_ZOOM);
        });
    }, [baseScale]);

    // Update the handleFitToWidth function
    const handleFitToWidth = useCallback(() => {
        if (!containerWidth || !originalWidth) return;
        // Always calculate actual fit-to-width scale
        const fitScale = (containerWidth - CONTAINER_PADDING) / originalWidth;
        setZoom(fitScale);
    }, [containerWidth, originalWidth]);

    const handleZoomInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        // Allow only numbers and empty string
        const value = e.target.value.replace(/[^\d]/g, '');
        setZoomInput(value);
    };

    // Update the applyZoomInput function
    const applyZoomInput = () => {
        if (baseScale === null) return;
        
        let percentage = Number(zoomInput);
        
        // Clamp value between min and max percentages
        percentage = Math.max(MIN_ZOOM * 100, Math.min(MAX_ZOOM * 100, percentage));
        
        // Convert percentage to actual scale
        const newScale = (percentage / 100) * baseScale;
        
        // Only update if actually changed
        if (zoom !== newScale) {
            setZoom(newScale);
        }
        
        setZoomInput(String(percentage));
    };

    const handleZoomInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            applyZoomInput();
        }
    };

    const handleZoomInputBlur = () => {
        applyZoomInput();
    };

    // Fix the handleScroll function to target the correct container
    const handleScroll = useCallback(() => {
        // We need to find the scrollable container element in our new structure
        const scrollContainer = document.querySelector('.pdf-scroll-container');
        if (!scrollContainer || !numPages) return;
        
        // Find which page is most visible in the viewport
        const pdfPages = document.querySelectorAll('.react-pdf__Page');
        const scrollContainerRect = scrollContainer.getBoundingClientRect();
        
        // Start with the first page
        let mostVisiblePage = 1;
        let maxVisibleArea = 0;
        
        pdfPages.forEach((page, index) => {
            const pageRect = page.getBoundingClientRect();
            
            // Calculate intersection with container viewport
            const visibleTop = Math.max(pageRect.top, scrollContainerRect.top);
            const visibleBottom = Math.min(pageRect.bottom, scrollContainerRect.bottom);
            const visibleHeight = Math.max(0, visibleBottom - visibleTop);
            
            // Calculate percentage of page visible
            const visibleArea = visibleHeight * pageRect.width;
            
            if (visibleArea > maxVisibleArea) {
                maxVisibleArea = visibleArea;
                mostVisiblePage = index + 1; // Pages are 1-indexed
            }
        });
        
        if (mostVisiblePage !== currentPage) {
            setCurrentPage(mostVisiblePage);
        }
    }, [numPages, currentPage]);

    // Fix the scroll event listener to attach to the correct container
    useEffect(() => {
        // Use a slight delay to ensure everything is rendered
        const timeoutId = setTimeout(() => {
            const scrollContainer = document.querySelector('.pdf-scroll-container');
            if (!scrollContainer) return;
            
            // Add the scroll event listener
            scrollContainer.addEventListener('scroll', handleScroll);
            
            // Initial calculation
            handleScroll();
            
            return () => {
                scrollContainer.removeEventListener('scroll', handleScroll);
            };
        }, 500);
        
        return () => clearTimeout(timeoutId);
    }, [handleScroll, numPages]);

    return (
        <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%', 
            position: 'relative',
            overflow: 'hidden',
            '& .react-pdf__Page__textContent': {
                userSelect: 'text',
                pointerEvents: 'auto',
                '& span': {
                    cursor: 'text',
                    color: 'transparent'
                }
            }
        }}>
            {/* Fixed toolbar section */}
            <Box sx={{ 
                position: 'sticky',
                top: 0,
                zIndex: 10,
                backgroundColor: 'background.paper',
                borderBottom: '1px solid',
                borderColor: 'divider',
                pb: 0
            }}>
                <Stack 
                    direction="row" 
                    spacing={1} 
                    alignItems="center" 
                    justifyContent="center"
                    sx={{ mb: 2, pt: 0 }}
                >
                    <Tooltip title="Zoom out">
                        <span>
                            <IconButton 
                                onClick={handleZoomOut}
                                disabled={zoom === null || baseScale === null || zoom <= baseScale * MIN_ZOOM}
                            >
                                <ZoomOut />
                            </IconButton>
                        </span>
                    </Tooltip>
                    
                    {/* Only show the zoom input if we have enough space */}
                    {componentWidth > 400 && (
                        <InputBase
                            value={zoomInput}
                            onChange={handleZoomInputChange}
                            onKeyDown={handleZoomInputKeyDown}
                            onBlur={handleZoomInputBlur}
                            sx={{
                                width: '60px',
                                textAlign: 'center',
                                '& input': {
                                    textAlign: 'center',
                                    p: '2px 4px',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                },
                            }}
                            endAdornment="%"
                        />
                    )}
                    
                    <Tooltip title="Zoom in">
                        <span>
                            <IconButton 
                                onClick={handleZoomIn}
                                disabled={zoom === null || baseScale === null || zoom >= baseScale * MAX_ZOOM}
                            >
                                <ZoomIn />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title="Fit to width">
                        <IconButton onClick={handleFitToWidth}>
                            <FitScreen />
                        </IconButton>
                    </Tooltip>
                    
                    {/* Page indicator - only show on wider screens */}
                    {numPages && componentWidth > 400 && (
                        <Box 
                            sx={{ 
                                display: 'flex',
                                alignItems: 'center',
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                px: 1,
                                py: 0.5,
                                ml: 2
                            }}
                        >
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                Page {currentPage} of {numPages}
                            </Typography>
                        </Box>
                    )}
                </Stack>

                {pdfError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        Error loading PDF: {pdfError}
                    </Alert>
                )}
                
                {/* Only show search info on wider screens */}
                {searchMessage && componentWidth > 400 && (
                    <Box 
                        sx={{ 
                            mb: 2, 
                            p: 1.5, 
                            borderRadius: 1, 
                            bgcolor: 'primary.light', 
                            color: 'primary.contrastText',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}
                    >
                        <Typography variant="body2">
                            <strong>Search:</strong> {searchMessage}
                        </Typography>
                        
                        {textMatches.length > 0 && (
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Tooltip title="Previous match">
                                    <IconButton 
                                        size="small" 
                                        onClick={goToPreviousMatch}
                                        sx={{ color: 'primary.contrastText' }}
                                    >
                                        <ArrowBackIos fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Typography variant="body2">
                                    {currentMatchIndex + 1} of {textMatches.length}
                                </Typography>
                                <Tooltip title="Next match">
                                    <IconButton 
                                        size="small" 
                                        onClick={goToNextMatch}
                                        sx={{ color: 'primary.contrastText' }}
                                    >
                                        <ArrowForwardIos fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Stack>
                        )}
                    </Box>
                )}
            </Box>
            
            {/* Scrollable PDF container - add className for scroll event targeting */}
            <Box 
                className="pdf-scroll-container"
                sx={{ 
                    flexGrow: 1, 
                    overflow: 'auto',
                    position: 'relative',
                    height: '100%'
                }}
            >
                <div ref={containerRef} className="pdf-container" style={{ width: '100%', position: 'relative' }}>
                    <Document
                        key={url}
                        file={file}
                        onLoadSuccess={handleLoadSuccess}
                        onLoadError={handleLoadError}
                        loading={
                            <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 200 }}>
                                <CircularProgress />
                                <Txt color="text.secondary" sx={{ mt: 2 }}>Loading PDF...</Txt>
                            </Stack>
                        }
                    >
                        {!isLoadingPdf && numPages && (
                            <Stack spacing={2} sx={{ alignItems: 'center' }}>
                                {Array.from(new Array(numPages), (_, index) => (
                                    <Page
                                        key={`page_${index + 1}`}
                                        pageNumber={index + 1}
                                        renderTextLayer={true}
                                        renderAnnotationLayer={true}
                                        width={originalWidth && effectiveZoom !== null ? originalWidth * effectiveZoom : undefined}
                                        loading=" "
                                        onLoadSuccess={handlePageLoadSuccess}
                                    />
                                ))}
                            </Stack>
                        )}
                    </Document>
                </div>
            </Box>
        </Box>
    );
}