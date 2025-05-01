import React, {
  useCallback,
  useMemo,
  useState,
} from "react";

import _ from "lodash";
import {
  Circle,
  Cloud,
  Diamond,
  Heart,
  Hexagon,
  Octagon,
  Pentagon,
  Square,
  Star,
  Triangle,
} from "lucide-react";

import {MuiMarkdownDefault} from "@/components/markdown/MuiMarkdownDefault";
import {trimAllLines} from "@lukebechtel/lab-ts-utils";
import {CheckCircle} from "@mui/icons-material";
import {
  Badge,
  Button,
  Chip,
  Grid,
  Paper,
  Stack,
} from "@mui/material";
import {
  keyframes,
  useTheme,
} from "@mui/material/styles";
import {
  TermMatchingActivityConfig,
  TermMatchingResult,
  TermMatchingSubmitRequest,
} from "@reasonote/activity-definitions";

import {ActivityComponent} from "../../ActivityComponent";

// Define a set of shape icons
const SHAPES = [
  Circle, Square, Triangle, Star, Heart, 
  Diamond, Hexagon, Octagon, Pentagon, Cloud
];

// Add these animations
const shakeAnimation = keyframes`
  0% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  50% { transform: translateX(5px); }
  75% { transform: translateX(-5px); }
  100% { transform: translateX(0); }
`;

const flashAnimation = keyframes`
  0% { background-color: transparent; }
  50% { background-color: rgba(211, 47, 47, 0.1); }
  100% { background-color: transparent; }
`;

export const TermMatchingActivity: ActivityComponent<TermMatchingActivityConfig, TermMatchingSubmitRequest, TermMatchingResult> = ({
  config,
  callbacks,
}) => {
  const theme = useTheme();
  const COLORS = [
    'matchingColorRed',
    // 'matchingColorTeal',
    'matchingColorBlue',
    'matchingColorOrange',
    // 'matchingColorGreen',
    'matchingColorYellow',
    'matchingColorPurple',
    'matchingColorPink',
    'matchingColorLime',
    'matchingColorLavender',
  ] as const;

  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [selectedDefinition, setSelectedDefinition] = useState<string | null>(null);
  const [matches, setMatches] = useState<Array<{ term: string; matchedDefinition: string }>>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [grade, setGrade] = useState<number | null>(null);
  const [incorrectPair, setIncorrectPair] = useState<{ term: string; definition: string } | null>(null);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [hasAttempted, setHasAttempted] = useState(false);

  const hardMode = config.version === '0.0.1' ? config.hardMode : false;

  const shuffledAnswers = useMemo(() => {
    return _.shuffle(config.termPairs.map(pair => pair.definition));
  }, []);

  // Assign colors and shapes to terms
  const termProperties = useMemo(() => {
    const newTermProperties: {[key: string]: {color: typeof COLORS[number], ShapeIcon: React.ElementType}} = {};
      config.termPairs.forEach((pair, index) => {
          newTermProperties[pair.term] = {
            color: COLORS[index % COLORS.length],
            ShapeIcon: SHAPES[index % SHAPES.length],
          };
        });
    return newTermProperties;
  }, [config, COLORS]);


  const handleTermClick = (term: string) => {
    if (matches.some(m => m.term === term)) {
      return;
    }

    if (selectedDefinition) {
      const correctPair = config.termPairs.find(pair => 
        pair.term === term && pair.definition === selectedDefinition
      );
      
      handleMatch(term, selectedDefinition, correctPair != null);
    } else {
      setSelectedTerm(term === selectedTerm ? null : term);
    }
  };

  const handleDefinitionClick = (definition: string) => {
    if (matches.some(m => m.matchedDefinition === definition)) {
      return;
    }

    if (selectedTerm) {
      const correctPair = config.termPairs.find(pair => 
        pair.term === selectedTerm && pair.definition === definition
      );
      
      handleMatch(selectedTerm, definition, correctPair != null);
    } else {
      setSelectedDefinition(definition === selectedDefinition ? null : definition);
    }
  };

  const handleMatch = (term: string, definition: string, isCorrect: boolean) => {
    if (!hasAttempted) {
      setHasAttempted(true);
    }

    if (isCorrect) {
      const newMatch = { term, matchedDefinition: definition };
      setMatches([...matches, newMatch]);
      setSelectedTerm(null);
      setSelectedDefinition(null);

      if (matches.length + 1 === config.termPairs.length) {
        setIsComplete(true);
      }
    } else {
      if (hardMode) {
        setMistakeCount(prev => prev + 1);
      }
      
      setIncorrectPair({ term, definition });
      setTimeout(() => {
        setIncorrectPair(null);
        setSelectedTerm(null);
        setSelectedDefinition(null);
      }, 800);
    }
  };

  const gradeActivity = useCallback(async () => {
    if (!callbacks?.onSubmission) {
      return;
    }

    try {
      const submitRequest: TermMatchingSubmitRequest = {
        userMatches: matches,
        mistakeCount: hardMode ? mistakeCount : undefined
      };
      
      const submitResult = await callbacks?.onSubmission?.(submitRequest);

      // Use optional chaining to safely access properties
      const grade0To100 = (submitResult as any)?.details?.grade0To100;
      const explanation = (submitResult as any)?.details?.explanation;
      const shortExplanation = (submitResult as any)?.details?.shortExplanation;

      if (grade0To100 !== undefined) {
        setGrade(grade0To100);
        callbacks?.onComplete?.({
          type: "graded",
          gradeType: 'graded-numeric',
          activityType: "term-matching",
          resultData: {
            userMatches: matches,
          },
          activityConfig: config,
          grade0to100: grade0To100,
          feedback: {
            markdownFeedback: trimAllLines(`
            # Explanation
            ${hardMode ? `You made ${mistakeCount} mistake${mistakeCount === 1 ? '' : 's'} while completing this exercise.\n\n` : ''}
            ${explanation || ''}
            `),
            aboveTheFoldAnswer: shortExplanation || '',
          }
        });
      }
    } catch (error) {
      console.error("Error submitting term matching activity:", error);
    }
  }, [matches, config, hardMode, mistakeCount, callbacks]);

  const getButtonStyle = (item: string, isterm: boolean) => {
    const match = matches.find(m => isterm ? m.term === item : m.matchedDefinition === item);

    if (match) {
      const properties = termProperties[match.term];
      const ShapeIcon: any = properties.ShapeIcon as any;

      return {
        color: isterm ? properties.color : properties.color,
        startIcon: isterm ? <ShapeIcon size={16} /> : undefined,
        endIcon: !isterm ? <ShapeIcon size={16} /> : undefined,
      };
    }
    if (isterm) {
      const ShapeIcon = termProperties[item].ShapeIcon as any;
      return {
        startIcon: <ShapeIcon size={16} />,
      };
    }
    return {};
  };

  return (
    <>
      <Paper 
        sx={{ 
          width: '100%', 
          p: 2,
          maxHeight: '80vh',
          overflow: 'auto',
          animation: incorrectPair ? `${flashAnimation} 0.8s ease` : 'none',
          position: 'relative',
        }}
      >
        <Stack spacing={2} alignItems={'center'}>
          <Stack 
            direction="row" 
            spacing={2} 
            alignItems="center" 
            justifyContent="space-between"
            width="100%"
          >
            {config.instructions && (
              <Stack flexGrow={1}>
                <MuiMarkdownDefault>
                  {config.instructions}
                </MuiMarkdownDefault>
              </Stack>
            )}
            {hardMode && (
              <Chip
                label="Hard Mode"
                color="warning"
                size="small"
                sx={{ 
                  fontWeight: 600,
                  borderRadius: '4px',
                  backgroundColor: theme.palette.warning.light,
                  '& .MuiChip-label': {
                    color: theme.palette.warning.dark,
                    px: 1
                  }
                }}
              />
            )}
          </Stack>

          <Grid container spacing={2}>
            <Grid item xs={6} alignItems={'center'}>
              <Stack spacing={1}>
                {config.termPairs.map(({ term }) => {
                  const selectedTermMatch = selectedTerm === term;
                  const isIncorrect = incorrectPair?.term === term;
                  
                  return <Button
                      key={term}
                      variant="contained"
                      onClick={() => handleTermClick(term)}
                      fullWidth
                      size='small'
                      color={selectedTermMatch ? termProperties[term].color : 'darkGray'}
                      sx={{
                        textTransform: 'none',
                        color: '#FFF',
                        animation: isIncorrect ? `${shakeAnimation} 0.4s ease-in-out` : 'none',
                      }}
                      {...getButtonStyle(term, true)}
                    >
                      {term}
                    </Button>
                })}
              </Stack>
            </Grid>
            <Grid item xs={6}>
              <Stack spacing={1}>
                {shuffledAnswers.map((definition) => {
                  const pair = config.termPairs.find(pair => pair.definition === definition);
                  const term = pair?.term;
                  if (!term) return null;
                  
                  const match = matches.find(m => m.matchedDefinition === definition);
                  const ShapeIcon = termProperties[term].ShapeIcon as any;
                  const isIncorrect = incorrectPair?.definition === definition;
                  const properties = termProperties[term];

                  return <Button
                      key={definition}
                      variant="contained"
                      onClick={() => handleDefinitionClick(definition)}
                      fullWidth
                      disabled={matches.some(m => m.matchedDefinition === definition)}
                      size='small'
                      color={selectedDefinition === definition ? properties.color : 'darkGray'}
                      sx={{ 
                        color: '#FFF',
                        textTransform: 'none',
                        animation: isIncorrect ? `${shakeAnimation} 0.4s ease-in-out` : 'none',
                        '&.MuiButton-root.Mui-disabled': (
                          match ? {
                            backgroundColor: theme.palette[properties.color].dark,
                            color: '#DDD',
                            opacity: 1,
                          } : undefined
                        )
                      }}
                      startIcon={match ? 
                        <Badge badgeContent={<CheckCircle color='success' fontSize="small" sx={{zoom: '.75'}} />}>
                          <ShapeIcon size={16} />
                        </Badge>
                        :
                        undefined
                      }
                    >
                    {definition}
                  </Button>
                })}
              </Stack>
            </Grid>
          </Grid>

          {isComplete && !grade && (
            <Button 
              variant="contained" 
              onClick={gradeActivity}
            >
              Complete
            </Button>
          )}
        </Stack>
      </Paper>
    </>
  );
};
