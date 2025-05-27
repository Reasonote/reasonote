"use client";
import React, {useState} from "react";

import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
import {
  ACSBDefaultInfiniteScroll,
} from "@/components/lists/ACSBDefaultInfiniteScroll";
import {useQuery} from "@apollo/client";
import {
  BookmarkBorder,
  Clear,
  FilterList,
  Highlight,
  Link as LinkIcon,
  OpenInNew,
  Search,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import {
  getHighlightFlatQueryDoc,
  getIntegrationFlatQueryDoc,
  OrderByDirection,
} from "@reasonote/lib-sdk-apollo-client";
import {
  useIntegrationFlatFragLoader,
} from "@reasonote/lib-sdk-apollo-client-react";

interface HighlightNode {
  id: string;
  content: string;
  note?: string | null;
  location?: string | null;
  highlightedAt?: string | null;
  tags?: string[] | null;
  sourceMetadata?: any;
  targetUrl?: string | null;
  targetSnipId?: string | null;
  targetRsnPageId?: string | null;
  sourceIntegrationId: string;
  createdDate: any;
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  const theme = useTheme();

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={2}
      sx={{
        borderRadius: 1,
        padding: 1,
      }}
    >
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        color: theme.palette.text.secondary,
      }}>
        {icon}
      </Box>
      <Typography variant="h6" color="text.secondary">
        {title}
      </Typography>
    </Stack>
  );
}

function HighlightCard({ highlight }: { highlight: HighlightNode }) {
  const theme = useTheme();
  const { data: integration } = useIntegrationFlatFragLoader(highlight.sourceIntegrationId);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getIntegrationIcon = (integrationType?: string) => {
    switch (integrationType) {
      case 'readwise':
        return (
          <img 
            src="/static/images/Readwise-Icon-Dark.svg" 
            width={16} 
            height={16} 
            alt="Readwise"
          />
        );
      default:
        return <BookmarkBorder sx={{ fontSize: 16 }} />;
    }
  };

  const sourceTitle = highlight.sourceMetadata?.title || 'Unknown Source';
  const sourceAuthor = highlight.sourceMetadata?.author;
  const highlightDate = highlight.highlightedAt || highlight.createdDate;

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Stack spacing={2}>
          {/* Header with source info */}
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              {getIntegrationIcon(integration?.type)}
              <Typography variant="body2" color="text.secondary">
                {sourceTitle}
                {sourceAuthor && ` by ${sourceAuthor}`}
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {formatDate(highlightDate)}
            </Typography>
          </Stack>

          {/* Highlight content */}
          <Box
            sx={{
              borderLeft: `4px solid ${theme.palette.primary.main}`,
              paddingLeft: 2,
              backgroundColor: theme.palette.action.hover,
              borderRadius: 1,
              padding: 2,
            }}
          >
            <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
              "{highlight.content}"
            </Typography>
          </Box>

          {/* Note if present */}
          {highlight.note && (
            <Box sx={{ paddingLeft: 2 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Note:</strong> {highlight.note}
              </Typography>
            </Box>
          )}

          {/* Location if present */}
          {highlight.location && (
            <Typography variant="caption" color="text.secondary">
              Location: {highlight.location}
            </Typography>
          )}

          {/* Tags */}
          {highlight.tags && highlight.tags.length > 0 && (
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {highlight.tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.75rem' }}
                />
              ))}
            </Stack>
          )}

          {/* Actions */}
          <Stack direction="row" spacing={1} alignItems="center">
            {highlight.targetUrl && (
              <IconButton
                size="small"
                onClick={() => window.open(highlight.targetUrl!, '_blank')}
                title="Open source"
              >
                <OpenInNew fontSize="small" />
              </IconButton>
            )}
            
            {(highlight.targetRsnPageId || highlight.targetSnipId) && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<LinkIcon />}
                onClick={() => {
                  // Navigate to the linked target
                  const targetUrl = highlight.targetRsnPageId 
                    ? `/app/pages/${highlight.targetRsnPageId}`
                    : highlight.targetSnipId
                    ? `/app/snips/${highlight.targetSnipId}`
                    : highlight.targetUrl;
                  
                  if (targetUrl) {
                    window.open(targetUrl, '_blank');
                  }
                }}
              >
                View in Reasonote
              </Button>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function HighlightsPage() {
  const { rsnUserId } = useRsnUser();
  
  // Get user's integrations
  const { data: integrationsData } = useQuery(getIntegrationFlatQueryDoc, {
    variables: {
      filter: {
        forUser: { eq: rsnUserId || 'FAKE' }
      }
    },
    skip: !rsnUserId,
  });

  const userIntegrationIds = integrationsData?.integrationCollection?.edges.map(edge => edge.node.id) || [];
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIntegration, setSelectedIntegration] = useState<string>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleIntegrationChange = (event: any) => {
    setSelectedIntegration(event.target.value);
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedIntegration("all");
    setSelectedTags([]);
  };

  const hasActiveFilters = searchQuery || selectedIntegration !== "all" || selectedTags.length > 0;

  // Build filter for GraphQL query
  const buildFilter = () => {
    const filters: any = {};

    // Filter by user's integrations
    if (userIntegrationIds.length > 0) {
      filters.sourceIntegrationId = {
        in: userIntegrationIds
      };
    } else {
      // If no integrations, return empty results
      filters.id = { eq: 'FAKE_ID_NO_RESULTS' };
    }

    // Search filter
    if (searchQuery.trim()) {
      filters.or = [
        { content: { ilike: `%${searchQuery}%` } },
        { note: { ilike: `%${searchQuery}%` } },
      ];
    }

    // Integration filter
    if (selectedIntegration !== "all") {
      const selectedIntegrationData = integrationsData?.integrationCollection?.edges.find(
        edge => edge.node.type === selectedIntegration
      );
      if (selectedIntegrationData) {
        filters.sourceIntegrationId = { eq: selectedIntegrationData.node.id };
      }
    }

    // Tags filter
    if (selectedTags.length > 0) {
      filters.tags = {
        overlaps: selectedTags
      };
    }

    return filters;
  };

  return (
    <Box sx={{ maxWidth: 900, margin: '0 auto', padding: 3 }}>
      <Stack spacing={4}>
        {/* Page Header */}
        <Stack spacing={2}>
          <SectionHeader 
            icon={<Highlight />} 
            title="Highlights" 
          />
          <Typography variant="body1" color="text.secondary">
            View and manage highlights synced from your connected integrations.
          </Typography>
        </Stack>

        <Divider />

        {/* Filters */}
        <Card>
          <CardContent>
            <Stack spacing={3}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <FilterList />
                <Typography variant="h6">Filters</Typography>
                {hasActiveFilters && (
                  <Button
                    size="small"
                    startIcon={<Clear />}
                    onClick={clearFilters}
                  >
                    Clear All
                  </Button>
                )}
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                {/* Search */}
                <TextField
                  label="Search highlights"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search content, notes, or source..."
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  sx={{ flex: 1 }}
                />

                {/* Integration filter */}
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Integration</InputLabel>
                  <Select
                    value={selectedIntegration}
                    onChange={handleIntegrationChange}
                    label="Integration"
                  >
                    <MenuItem value="all">All Integrations</MenuItem>
                    <MenuItem value="readwise">Readwise</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              {/* TODO: Add tags filter when we have tag data */}
            </Stack>
          </CardContent>
        </Card>

        {/* Highlights List */}
        {rsnUserId ? (
          <ACSBDefaultInfiniteScroll
            getCollection={(data) => data.highlightCollection}
            getNodes={(collection) => collection.edges.map(edge => edge.node)}
            queryOpts={{
              query: getHighlightFlatQueryDoc,
              variables: {
                filter: buildFilter(),
                orderBy: [
                  { highlightedAt: OrderByDirection.DescNullsLast },
                  { createdDate: OrderByDirection.DescNullsLast }
                ],
                first: 20,
              },
              fetchPolicy: "network-only",
            }}
            getChild={(node: any) => (
              <HighlightCard key={node.id} highlight={node} />
            )}
            infScrollStyle={{
              gap: '16px'
            }}
            emptyListComponent={
              <Card>
                <CardContent>
                  <Stack alignItems="center" spacing={2} sx={{ py: 4 }}>
                    <Highlight sx={{ fontSize: 48, color: 'text.secondary' }} />
                    <Typography variant="h6" color="text.secondary">
                      No highlights found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      {hasActiveFilters 
                        ? "Try adjusting your filters or search terms."
                        : "Connect an integration like Readwise to start syncing your highlights."
                      }
                    </Typography>
                    {!hasActiveFilters && (
                      <Button
                        variant="contained"
                        href="/app/integrations"
                      >
                        Set up Integrations
                      </Button>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            }
            loader={
              <Stack alignItems="center" spacing={2} sx={{ py: 4 }}>
                <CircularProgress />
                <Typography variant="body2" color="text.secondary">
                  Loading highlights...
                </Typography>
              </Stack>
            }
          />
        ) : (
          <Alert severity="info">
            Please log in to view your highlights.
          </Alert>
        )}
      </Stack>
    </Box>
  );
} 