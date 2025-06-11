import React, {
  useCallback,
  useRef,
  useState,
} from "react";

import {
  BookOpen,
  Plus,
  Upload,
} from "lucide-react";

import {
  LinearProgressWithLabel,
} from "@/components/progress/LinearProgressWithLabel";
import {Txt} from "@/components/typography/Txt";
import {
  ImportExport,
  Publish,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

import {useCourseCreation} from "../context/CourseCreationContext";
import {ContentType} from "../types/courseCreation.types";
import {DocumentUpload} from "./DocumentUpload";

interface SourceTypeOption {
  type: ContentType;
  title: string;
  description: string;
  icon: React.ReactNode;
  coming_soon?: boolean;
}

const SOURCE_TYPE_OPTIONS: SourceTypeOption[] = [
  {
    type: 'document',
    title: 'Documents',
    description: 'Upload PDFs, Word docs, or text files',
    icon: <Upload size={20} />,
  },
  {
    type: 'anki',
    title: 'Anki Decks',
    description: 'Import your existing Anki flashcard decks',
    icon: <ImportExport sx={{ fontSize: 20 }} />,
  },
  {
    type: 'manual',
    title: 'Manual Entry',
    description: 'Create content from scratch',
    icon: <Plus size={20} />,
    coming_soon: true,
  },
];

function SourceTypeCard({ 
  option, 
  onClick, 
  disabled 
}: { 
  option: SourceTypeOption;
  onClick: () => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  
  return (
    <Card 
      variant="outlined"
      sx={{
        position: 'relative',
        transition: 'all 0.2s ease-in-out',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        borderRadius: '12px',
        borderColor: theme.palette.divider,
        backgroundColor: theme.palette.background.paper,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        '&:hover': disabled ? {} : {
          borderColor: theme.palette.primary.main,
          backgroundColor: theme.palette.background.paper,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          transform: 'translateY(-1px)',
        },
      }}
    >
      <CardActionArea 
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        sx={{ 
          p: 2.5,
          borderRadius: '12px',
          '&.Mui-disabled': {
            opacity: 1, // We handle opacity at the card level
          },
        }}
      >
        <Stack direction="row" gap={3} alignItems="center">
          <Box 
            sx={{ 
              color: theme.palette.text.secondary,
              transition: 'color 0.2s ease-in-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '8px',
              backgroundColor: `${theme.palette.primary.main}08`,
            }}
          >
            {option.icon}
          </Box>
          
          <Stack gap={0.5} sx={{ flex: 1 }}>
            <Txt 
              variant="body1" 
              color="text.primary"
              sx={{ fontWeight: 600, fontSize: '0.95rem' }}
            >
              {option.title}
              {option.coming_soon && (
                <Txt 
                  component="span" 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ 
                    ml: 1.5,
                    fontWeight: 400,
                    fontStyle: 'italic',
                    fontSize: '0.8rem',
                    opacity: 0.7,
                  }}
                >
                  (Coming Soon)
                </Txt>
              )}
            </Txt>
            
            <Txt variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', lineHeight: 1.4, opacity: 0.8 }}>
              {option.description}
            </Txt>
          </Stack>
        </Stack>
      </CardActionArea>
    </Card>
  );
}

interface AnkiDeck {
  id: string | number;
  name: string;
  cards: AnkiCard[];
}

interface AnkiCard {
  id: string | number;
  front: string;
  back: string;
  due?: number;
  ivl?: number;
  factor?: number;
  reps?: number;
  lapses?: number;
  type?: number;
  queue?: number;
  mod?: number;
  flags?: number;
  left?: number;
  odue?: number;
  odid?: number;
}

// Helper functions for card scheduling
function getCardStatusInfo(card: AnkiCard): {
  status: 'new' | 'learning' | 'review' | 'overdue' | 'suspended' | 'buried';
  dueDate?: Date;
  daysOverdue?: number;
  statusText: string;
  statusColor: string;
} {
  // Handle queue status first
  if (card.queue === -1) {
    return {
      status: 'suspended',
      statusText: 'Suspended',
      statusColor: '#666666'
    };
  }
  
  if (card.queue === -2 || card.queue === -3) {
    return {
      status: 'buried',
      statusText: 'Buried',
      statusColor: '#888888'
    };
  }

  if (card.type === 0 || card.queue === 0) {
    return {
      status: 'new',
      statusText: 'New card',
      statusColor: '#2196F3'
    };
  }

  if (card.type === 1 || card.queue === 1 || card.queue === 3) {
    return {
      status: 'learning',
      statusText: card.queue === 3 ? 'Relearning' : 'Learning',
      statusColor: '#FF9800'
    };
  }

  // Review cards (type 2, queue 2)
  if (card.due !== undefined) {
    const today = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const ankiEpoch = Math.floor(new Date('2000-01-01').getTime() / (1000 * 60 * 60 * 24));
    const cardDueDay = card.due;
    const daysOverdue = today - ankiEpoch - cardDueDay;
    
    const dueDate = new Date(2000, 0, 1 + cardDueDay);
    
    if (daysOverdue > 0) {
      return {
        status: 'overdue',
        dueDate,
        daysOverdue,
        statusText: `${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`,
        statusColor: '#f44336'
      };
    } else if (daysOverdue === 0) {
      return {
        status: 'review',
        dueDate,
        statusText: 'Due today',
        statusColor: '#4CAF50'
      };
    } else {
      return {
        status: 'review',
        dueDate,
        statusText: `Due in ${Math.abs(daysOverdue)} day${Math.abs(daysOverdue) > 1 ? 's' : ''}`,
        statusColor: '#9E9E9E'
      };
    }
  }

  return {
    status: 'review',
    statusText: 'Review card',
    statusColor: '#4CAF50'
  };
}

function getCardDifficultyInfo(card: AnkiCard): {
  difficultyText?: string;
  difficultyColor?: string;
} {
  if (card.reps !== undefined && card.lapses !== undefined) {
    const successRate = card.reps > 0 ? ((card.reps - card.lapses) / card.reps) * 100 : 100;
    
    if (successRate < 60) {
      return {
        difficultyText: 'Difficult',
        difficultyColor: '#f44336'
      };
    } else if (successRate < 80) {
      return {
        difficultyText: 'Moderate',
        difficultyColor: '#FF9800'
      };
    } else {
      return {
        difficultyText: 'Easy',
        difficultyColor: '#4CAF50'
      };
    }
  }
  
  return {};
}

interface AnkiUploadProps {
  onDecksLoaded: (decks: AnkiDeck[]) => void;
  onClearError: () => void;
}

function AnkiUpload({ onDecksLoaded, onClearError }: AnkiUploadProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    
    if (!selectedFile) return;

    setError(null);
    onClearError();

    const formData = new FormData();
    formData.append('apkgFile', selectedFile);

    setLoading(true);
    try {
      const response = await fetch('/api/integrations/anki/ingest', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        return;
      }

      if (data.decks) {
        const filteredDecks = data.decks.filter((deck: AnkiDeck) => deck.cards.length > 0);
        onDecksLoaded(filteredDecks);
      } else {
        setError('No decks found in the response');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error processing Anki file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap={3}>
      <input 
        type="file" 
        accept=".apkg" 
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />
      
      {loading ? (
        <Box 
          sx={{ 
            p: 4,
            backgroundColor: 'background.default',
            borderRadius: '12px',
            border: `1px solid ${theme.palette.divider}`,
            textAlign: 'center',
          }}
        >
          <LinearProgressWithLabel label="Uploading and processing your Anki deck..." labelPos="above" />
        </Box>
      ) : (
        <Card 
          variant="outlined"
          sx={{
            borderRadius: '12px',
            borderStyle: 'dashed',
            borderWidth: 2,
            borderColor: theme.palette.divider,
            backgroundColor: theme.palette.background.paper,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              borderColor: theme.palette.primary.main,
              backgroundColor: `${theme.palette.primary.main}04`,
            },
          }}
        >
          <CardActionArea 
            onClick={() => fileInputRef.current?.click()}
            sx={{ 
              p: 6,
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            <Stack gap={2} alignItems="center">
              <Box 
                sx={{ 
                  color: theme.palette.text.secondary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 64,
                  height: 64,
                  borderRadius: '12px',
                  backgroundColor: `${theme.palette.primary.main}08`,
                }}
              >
                <Publish sx={{ fontSize: 32 }} />
              </Box>
              
              <Stack gap={1} alignItems="center">
                <Txt variant="h6" color="text.primary" sx={{ fontWeight: 600 }}>
                  Upload Your Anki Deck (.apkg)
                </Txt>
                <Txt variant="body2" color="text.secondary" sx={{ maxWidth: '24rem', lineHeight: 1.5 }}>
                  Drag & drop your Anki deck file here, or click to browse
                </Txt>
                <Txt variant="caption" color="text.secondary" sx={{ opacity: 0.7 }}>
                  Supports .apkg files only
                </Txt>
              </Stack>
            </Stack>
          </CardActionArea>
        </Card>
      )}
      
      {error && (
        <Card 
          sx={{ 
            p: 3, 
            backgroundColor: 'error.light',
            borderRadius: '8px',
          }}
        >
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        </Card>
      )}
    </Stack>
  );
}

interface AnkiDeckSelectorProps {
  decks: AnkiDeck[];
  onBack: () => void;
  onCreateCourse: (selectedData: { decks: AnkiDeck[], cards: { [deckId: string | number]: AnkiCard[] } }) => void;
}

function AnkiDeckSelector({ decks, onBack, onCreateCourse }: AnkiDeckSelectorProps) {
  const theme = useTheme();
  const [selectedDecks, setSelectedDecks] = useState<(string | number)[]>([]);
  const [selectedCards, setSelectedCards] = useState<{ [deckId: string | number]: (string | number)[] }>({});
  const [expandedDecks, setExpandedDecks] = useState<Set<string | number>>(new Set());

  const handleDeckToggle = useCallback((deckId: string | number) => {
    setSelectedDecks(prev => {
      if (prev.includes(deckId)) {
        return prev.filter(id => id !== deckId);
      } else {
        return [...prev, deckId];
      }
    });
  }, []);

  const handleCardToggle = useCallback((deckId: string | number, cardId: string | number) => {
    setSelectedCards(prev => {
      const currentCards = prev[deckId] || [];
      if (currentCards.includes(cardId)) {
        return {
          ...prev,
          [deckId]: currentCards.filter(id => id !== cardId),
        };
      } else {
        return {
          ...prev,
          [deckId]: [...currentCards, cardId],
        };
      }
    });
  }, []);

  const handleDeckExpansion = useCallback((deckId: string | number) => {
    setExpandedDecks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(deckId)) {
        newSet.delete(deckId);
      } else {
        newSet.add(deckId);
      }
      return newSet;
    });
  }, []);

  const handleCreateCourse = useCallback(() => {
    // Collect selected decks and cards
    const selectedDecksData = decks.filter(deck => selectedDecks.includes(deck.id));
    const selectedCardsData: { [deckId: string | number]: AnkiCard[] } = {};
    
    Object.entries(selectedCards).forEach(([deckId, cardIds]) => {
      const deck = decks.find(d => d.id.toString() === deckId);
      if (deck) {
        selectedCardsData[deckId] = deck.cards.filter(card => cardIds.includes(card.id));
      }
    });

    onCreateCourse({ decks: selectedDecksData, cards: selectedCardsData });
  }, [decks, selectedDecks, selectedCards, onCreateCourse]);

  const hasSelection = selectedDecks.length > 0 || Object.keys(selectedCards).length > 0;

  return (
    <Stack gap={3}>
      <Stack gap={1}>
        <Txt variant="h6" color="text.primary" sx={{ fontWeight: 600 }}>
          Select Anki Content
        </Txt>
        <Txt variant="body2" color="text.secondary">
          Choose the decks and individual cards you want to include in your course.
        </Txt>
      </Stack>

      <Stack gap={2}>
        {decks.map((deck) => (
          <Card 
            key={deck.id}
            variant="outlined"
            sx={{
              borderRadius: '8px',
              backgroundColor: theme.palette.background.paper,
            }}
          >
            {/* Deck Header */}
            <Box sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" gap={2} sx={{ flex: 1 }}>
                  <Box
                    component="input"
                    type="checkbox"
                    checked={selectedDecks.includes(deck.id)}
                    onChange={() => handleDeckToggle(deck.id)}
                    sx={{
                      width: 18,
                      height: 18,
                      accentColor: theme.palette.primary.main,
                    }}
                  />
                  <Stack sx={{ flex: 1 }}>
                    <Txt variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {deck.name}
                    </Txt>
                    <Stack direction="row" gap={1.5} alignItems="center">
                      <Txt variant="caption" color="text.secondary">
                        {deck.cards.length} cards
                      </Txt>
                      {(() => {
                        const stats = deck.cards.reduce((acc, card) => {
                          const status = getCardStatusInfo(card).status;
                          acc[status] = (acc[status] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>);

                        return (
                          <>
                            {stats.overdue > 0 && (
                              <Txt variant="caption" sx={{ color: '#f44336', fontSize: '0.7rem', fontWeight: 500 }}>
                                {stats.overdue} overdue
                              </Txt>
                            )}
                            {stats.review > 0 && (
                              <Txt variant="caption" sx={{ color: '#4CAF50', fontSize: '0.7rem' }}>
                                {stats.review} due
                              </Txt>
                            )}
                            {stats.new > 0 && (
                              <Txt variant="caption" sx={{ color: '#2196F3', fontSize: '0.7rem' }}>
                                {stats.new} new
                              </Txt>
                            )}
                            {stats.learning > 0 && (
                              <Txt variant="caption" sx={{ color: '#FF9800', fontSize: '0.7rem' }}>
                                {stats.learning} learning
                              </Txt>
                            )}
                          </>
                        );
                      })()}
                    </Stack>
                  </Stack>
                </Stack>
                
                <Button
                  variant="text"
                  size="small"
                  onClick={() => handleDeckExpansion(deck.id)}
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.875rem',
                    textTransform: 'none',
                    minWidth: 'auto',
                    px: 2,
                  }}
                >
                  {expandedDecks.has(deck.id) ? 'Hide cards' : 'Show cards'}
                </Button>
              </Stack>
            </Box>

            {/* Expanded Cards */}
            {expandedDecks.has(deck.id) && (
              <Box 
                sx={{ 
                  borderTop: `1px solid ${theme.palette.divider}`,
                  maxHeight: '300px',
                  overflowY: 'auto',
                }}
              >
                {deck.cards.map((card) => (
                  <Box 
                    key={card.id}
                    sx={{ 
                      p: 2,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      '&:last-child': { borderBottom: 'none' },
                    }}
                  >
                    <Stack direction="row" alignItems="flex-start" gap={2}>
                      <Box
                        component="input"
                        type="checkbox"
                        checked={selectedCards[deck.id]?.includes(card.id) || false}
                        onChange={() => handleCardToggle(deck.id, card.id)}
                        sx={{
                          width: 16,
                          height: 16,
                          accentColor: theme.palette.primary.main,
                          mt: 0.5,
                        }}
                      />
                      <Stack sx={{ flex: 1, minWidth: 0 }} gap={1}>
                        <Txt 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 500,
                            wordBreak: 'break-word',
                          }}
                        >
                          {card.front}
                        </Txt>
                        <Txt 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ 
                            lineHeight: 1.4,
                            wordBreak: 'break-word',
                          }}
                        >
                          {card.back}
                        </Txt>
                        
                        {/* Scheduling and Status Information */}
                        <Stack direction="row" gap={1.5} alignItems="center" sx={{ mt: 0.5 }}>
                          {(() => {
                            const statusInfo = getCardStatusInfo(card);
                            const difficultyInfo = getCardDifficultyInfo(card);
                            
                            return (
                              <>
                                {/* Card Status */}
                                <Box
                                  sx={{
                                    px: 1,
                                    py: 0.25,
                                    borderRadius: '4px',
                                    backgroundColor: `${statusInfo.statusColor}20`,
                                    border: `1px solid ${statusInfo.statusColor}40`,
                                  }}
                                >
                                  <Txt 
                                    variant="caption" 
                                    sx={{ 
                                      fontSize: '0.7rem',
                                      fontWeight: 500,
                                      color: statusInfo.statusColor,
                                    }}
                                  >
                                    {statusInfo.statusText}
                                  </Txt>
                                </Box>

                                {/* Review Stats */}
                                {card.reps !== undefined && (
                                  <Txt variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                    {card.reps} review{card.reps !== 1 ? 's' : ''}
                                  </Txt>
                                )}

                                {/* Difficulty Indicator */}
                                {difficultyInfo.difficultyText && (
                                  <Box
                                    sx={{
                                      px: 1,
                                      py: 0.25,
                                      borderRadius: '4px',
                                      backgroundColor: `${difficultyInfo.difficultyColor}15`,
                                    }}
                                  >
                                    <Txt 
                                      variant="caption" 
                                      sx={{ 
                                        fontSize: '0.7rem',
                                        color: difficultyInfo.difficultyColor,
                                      }}
                                    >
                                      {difficultyInfo.difficultyText}
                                    </Txt>
                                  </Box>
                                )}

                                {/* Interval for review cards */}
                                {card.ivl !== undefined && card.ivl > 0 && (
                                  <Txt variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                    {card.ivl}d interval
                                  </Txt>
                                )}
                              </>
                            );
                          })()}
                        </Stack>
                      </Stack>
                    </Stack>
                  </Box>
                ))}
              </Box>
            )}
          </Card>
        ))}
      </Stack>

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Button
          onClick={onBack}
          variant="text"
          sx={{
            textTransform: 'none',
            fontSize: '0.875rem',
            color: 'text.secondary',
            fontWeight: 500,
          }}
        >
          ← Back
        </Button>
        
        <Button
          onClick={handleCreateCourse}
          variant="contained"
          disabled={!hasSelection}
          sx={{
            py: 1.5,
            px: 4,
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: 600,
            textTransform: 'none',
          }}
        >
          Create course
        </Button>
      </Stack>
    </Stack>
  );
}

export function CourseContentSelector() {
  const theme = useTheme();
  const { 
    state, 
    setContentType, 
    clearContentType,
    handleDocumentUpload, 
    clearDocumentError 
  } = useCourseCreation();
  
  const [selectedType, setSelectedType] = useState<ContentType | undefined>(state.contentType);
  const [ankiDecks, setAnkiDecks] = useState<AnkiDeck[]>([]);

  const handleContentTypeSelect = useCallback((type: ContentType) => {
    setSelectedType(type);
    setContentType(type);
  }, [setContentType]);

  const handleDocumentUploadWrapper = useCallback(async (files: File[]) => {
    await handleDocumentUpload(files);
  }, [handleDocumentUpload]);

  const handleBackToSourceSelection = useCallback(() => {
    setSelectedType(undefined);
    setAnkiDecks([]);
    clearContentType();
  }, [clearContentType]);

  const handleAnkiDecksLoaded = useCallback((decks: AnkiDeck[]) => {
    setAnkiDecks(decks);
  }, []);

  const handleAnkiCourseCreate = useCallback(async (selectedData: { decks: AnkiDeck[], cards: { [deckId: string | number]: AnkiCard[] } }) => {
    // TODO: Implement Anki course creation in the context
    console.log('Creating course from Anki data:', selectedData);
  }, []);

  // If no type selected, show the main upload interface (like NotebookLM)
  if (!selectedType) {
    return (
      <Stack gap={4}>
        {/* Main Upload Area */}
        <DocumentUpload
          onUpload={handleDocumentUploadWrapper}
          uploadState={state.documentUpload}
          onClearError={clearDocumentError}
        />

        {/* Source Type Options */}
        <Stack 
          direction={{ xs: 'column', sm: 'row' }}
          gap={2}
          sx={{
            flexWrap: 'wrap',
            alignItems: 'stretch',
          }}
        >
          {SOURCE_TYPE_OPTIONS.map((option) => (
            <Box key={option.type} sx={{ flex: { xs: '1 1 100%', sm: '1 1 0' }, minWidth: '200px' }}>
              <SourceTypeCard
                option={option}
                onClick={() => handleContentTypeSelect(option.type)}
                disabled={option.coming_soon}
              />
            </Box>
          ))}
        </Stack>
      </Stack>
    );
  }

  // Show specialized interface for selected type
  return (
    <Stack gap={3}>
      {/* Document Flow - No back button, this is the main flow */}
      {selectedType === 'document' && (
        <DocumentUpload
          onUpload={handleDocumentUploadWrapper}
          uploadState={state.documentUpload}
          onClearError={clearDocumentError}
        />
      )}

      {/* Anki Flow - Back button only when in deck selection (nested level) */}
      {selectedType === 'anki' && (
        ankiDecks.length > 0 ? (
          <AnkiDeckSelector
            decks={ankiDecks}
            onBack={handleBackToSourceSelection}
            onCreateCourse={handleAnkiCourseCreate}
          />
        ) : (
          <Stack gap={3}>
            <Button
              onClick={handleBackToSourceSelection}
              variant="text"
              sx={{
                alignSelf: 'flex-start',
                textTransform: 'none',
                fontSize: '0.875rem',
                color: 'text.secondary',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: 'action.hover',
                  color: 'text.primary',
                }
              }}
            >
              ← Back to sources
            </Button>
            <AnkiUpload
              onDecksLoaded={handleAnkiDecksLoaded}
              onClearError={clearDocumentError}
            />
          </Stack>
        )
      )}

      {/* Manual Entry Flow - Back button since it's a selected mode */}
      {selectedType === 'manual' && (
        <Stack gap={3}>
          <Button
            onClick={handleBackToSourceSelection}
            variant="text"
            sx={{
              alignSelf: 'flex-start',
              textTransform: 'none',
              fontSize: '0.875rem',
              color: 'text.secondary',
              fontWeight: 500,
              '&:hover': {
                backgroundColor: 'action.hover',
                color: 'text.primary',
              }
            }}
          >
            ← Back to sources
          </Button>
          <Box 
            sx={{ 
              p: 4,
              backgroundColor: 'background.default',
              borderRadius: '8px',
              border: `1px solid ${theme.palette.divider}`,
              textAlign: 'center',
            }}
          >
            <Stack gap={2} alignItems="center">
              <BookOpen size={32} color={theme.palette.text.disabled} />
              <Stack gap={1}>
                <Txt variant="h6" color="text.secondary">
                  Manual creation coming soon
                </Txt>
                <Txt variant="body2" color="text.secondary">
                  This feature will be available in a future release.
                </Txt>
              </Stack>
            </Stack>
          </Box>
        </Stack>
      )}
    </Stack>
  );
} 