import {useMemo} from "react";

import _ from "lodash";

import {
  ActivityCountChip,
} from "@/components/activity/components/ActivityCountChip";
import {
  CreateActivityIconDropdownButton,
} from "@/components/activity/generate/CreateActivityTypeIconButton";
import {IconBtn} from "@/components/buttons/IconBtn";
import {IconButtonDelete} from "@/components/buttons/IconButtonDelete";
import {SkillChipDumb} from "@/components/chips/SkillChip/SkillChipDumb";
import {SimpleHeader} from "@/components/headers/SimpleHeader";
import {ActivityIcon} from "@/components/icons/ActivityIcon";
import {ScoreChip} from "@/components/scores/ScoreChip";

import {notEmpty} from "@lukebechtel/lab-ts-utils";
import {
  AccountTree,
  AddCircle,
  Article,
  OpenInNew,
} from "@mui/icons-material";
import {
  Badge,
  Button,
  Card,
  IconButton,
  Stack,
  Tooltip,
  useTheme,
} from "@mui/material";
import {
  SkillTree,
  SkillTreeNode,
} from "@reasonote/core";

import {SkillFullIconDumb} from "../../SkillFullIconDumb";
import {CreateSlidesModalButton} from "../CreateSlidesModalButton";

export interface SkillTreeV2ListDumbProps {
  /** The skill tree data to display */
  tree: SkillTree;
  /** The skill node data to display */
  node: SkillTreeNode;
  /** The current indentation level */
  indent: number;
  /** Array of parent skill IDs in the current path */
  parentSkillIds?: string[];
  /** Set of expanded paths, each path is a string of node IDs joined by '/' */
  expandedPaths?: Set<string>;
  /** Callback when expand/collapse is toggled */
  onExpandToggle: (thisId: string, parentSkillIds?: string[]) => void;
  /** Whether this node is currently generating new subskills */
  isGeneratingSubskills?: boolean;
  /** Callback when generate subskills button is clicked */
  onGenerateSubskills?: (thisId: string, parentSkillIds?: string[]) => void;
  /** Callback when delete is clicked */
  onDelete?: (thisId: string, parentSkillIds?: string[]) => void;
  /** Callback when create activities is clicked */
  onCreateActivities?: (thisId: string, parentSkillIds?: string[]) => void;
  /** Callback when create slides is clicked */
  onCreateSlides?: (thisId: string, parentSkillIds?: string[]) => void;
  /** Maximum depth to show before collapsing */
  hideAfterDepth?: number;
  /** Callback when create lesson is clicked */
  onCreateLesson?: (thisId: string, parentSkillIds?: string[]) => void;
  /** Whether to show activity count */
  showActivityCount?: boolean | ((n: SkillTreeNode) => boolean);
  /** Whether to show score */
  showScore?: boolean | ((n: SkillTreeNode) => boolean);
  /** Whether delete is disabled */
  disableDelete?: boolean;
  /** Whether generating subskills is disabled */
  disableGenerateSubskills?: boolean;
  /** Whether to show create lesson button */
  showCreateLesson?: boolean | ((n: SkillTreeNode) => boolean);
}

export function SkillTreeV2ListDumb({
  tree,
  node,
  indent,
  parentSkillIds = [],
  expandedPaths = new Set(),
  onExpandToggle,
  isGeneratingSubskills,
  onGenerateSubskills,
  onDelete,
  onCreateActivities,
  onCreateSlides,
  hideAfterDepth,
  onCreateLesson,
  showActivityCount,
  showScore,
  disableDelete,
  disableGenerateSubskills,
  showCreateLesson,
}: SkillTreeV2ListDumbProps) {
  const theme = useTheme();
  const currentPath = [...parentSkillIds, node.id].join('/');
  const isNodeExpanded = expandedPaths.has(currentPath);

  const childEdges = tree.edges.filter(edge => edge.from === node.id);
  const numChildren = childEdges.length;

  const groupedChildren = useMemo(() => {
    if (!isNodeExpanded) return [];

    const grouped = _.groupBy(childEdges, edge => edge.metadata?.level ?? 'BASIC');
    const ORDERING = ['INTRO', 'BASIC', 'INTERMEDIATE', 'ADVANCED', 'MASTER'];
 
    return Object.entries(grouped)
      .sort(([a], [b]) => {
        const indexA = ORDERING.indexOf(a);
        const indexB = ORDERING.indexOf(b);
        return indexA - indexB;
      })
      .map(([level, edges]) => ({
        level,
        nodes: edges
          .map(edge => {
            const childNode = tree.skills.find(s => s.id === edge.to);
            if (!childNode) return null;
            return {
              ...childNode,
              metadata: edge.metadata,
            };
          })
          .filter(notEmpty)
      }));
  }, [tree, node.id, currentPath, expandedPaths]);

  return (
    <Stack direction={'row'} gap={1} sx={{width: '100%'}}>
      <Stack gap={1} sx={{width: '100%'}}>
        {node && (
          <>
            <Card sx={{width: '100%'}}>
              <SimpleHeader
                leftContent={
                  <Stack gap={1}>
                    <SkillChipDumb 
                      skillName={node.name ?? ''} 
                      disableAddDelete 
                      icon={
                        <SkillFullIconDumb emoji={node.emoji} />
                      }
                    />
                    {(showActivityCount || showScore) && (
                      <Stack direction={'row'} gap={1}>
                        {_.isFunction(showActivityCount) ? showActivityCount(node) : showActivityCount && (
                          <ActivityCountChip 
                            count={0} 
                            data-testid="activity-count"
                          />
                        )}
                        {_.isFunction(showScore) ? showScore(node) : showScore && (
                          <ScoreChip 
                            score={node.calculatedScore ?? 0}
                            data-testid="score-chip"
                          />
                        )}
                      </Stack>
                    )}
                  </Stack>
                }
                rightContent={
                  <Stack 
                    direction="row" 
                    alignItems="center" 
                    spacing={1}
                    sx={{ 
                      height: '40px' // Fixed height for consistency
                    }}
                  >
                    {onCreateSlides && (
                      <Tooltip title={'Add Slides'}>
                        <div>
                          <CreateSlidesModalButton
                            skill={{
                              id: node.id,
                              pathTo: parentSkillIds
                            }}
                            onSlideCreate={() => onCreateSlides(node.id, parentSkillIds)}
                            icon={
                              <Badge 
                                badgeContent={
                                  <AddCircle sx={{
                                    width: '15px', 
                                    height: '15px', 
                                    backgroundColor: theme.palette.background.paper, 
                                    borderRadius: '50%' 
                                  }}/>
                                } 
                                anchorOrigin={{vertical: 'bottom', horizontal: 'right'}} 
                                overlap="circular" 
                              >
                                <Article/>
                              </Badge>
                            }                                        
                          />
                        </div>
                      </Tooltip>
                    )}
                    
                    {onCreateActivities && (
                      <Tooltip title={'Add Activities'}>
                        <div>
                          <CreateActivityIconDropdownButton
                            onActivityTypeCreate={onCreateActivities}
                            icon={
                              <Badge 
                                badgeContent={
                                  <AddCircle sx={{
                                    width: '15px', 
                                    height: '15px', 
                                    backgroundColor: theme.palette.background.paper, 
                                    borderRadius: '50%' 
                                  }}/>
                                } 
                                anchorOrigin={{vertical: 'bottom', horizontal: 'right'}} 
                                overlap="circular" 
                              >
                                <ActivityIcon fontSize="small"/>
                              </Badge>
                            }
                          />
                        </div>
                      </Tooltip>
                    )}

                    {onCreateLesson && (_.isFunction(showCreateLesson) ? showCreateLesson(node) : showCreateLesson) && (
                      <Tooltip title={'Learn Now'}>
                        <div>
                          <IconButton 
                            onClick={() => onCreateLesson(node.id, parentSkillIds)}
                            sx={{color: theme.palette.gray.dark}}
                            data-testid="create-lesson-button"
                          >
                            <Badge 
                              badgeContent={
                                <AddCircle sx={{
                                  width: '15px', 
                                  height: '15px', 
                                  backgroundColor: theme.palette.background.paper, 
                                  borderRadius: '50%' 
                                }}/>
                              } 
                              anchorOrigin={{vertical: 'bottom', horizontal: 'right'}} 
                              overlap="circular" 
                            >
                              <OpenInNew fontSize="small"/>
                            </Badge>
                          </IconButton>
                        </div>
                      </Tooltip>
                    )}

                    {!disableGenerateSubskills && onGenerateSubskills && (
                      <Tooltip title={'Add Subskills'}>
                        <div>
                          <IconBtn 
                            sx={{color: theme.palette.gray.dark}}
                            onClick={() => onGenerateSubskills(node.id, parentSkillIds)}
                            isWorking={isGeneratingSubskills}
                            data-testid="expand-tree-button"
                          >
                            <Badge 
                              badgeContent={
                                <AddCircle sx={{
                                  width: '15px', 
                                  height: '15px', 
                                  backgroundColor: theme.palette.background.paper, 
                                  borderRadius: '50%' 
                                }}/>
                              } 
                              anchorOrigin={{vertical: 'bottom', horizontal: 'right'}} 
                              overlap="circular" 
                            >
                              <AccountTree fontSize="small"/>
                            </Badge>
                          </IconBtn>
                        </div>
                      </Tooltip>
                    )}

                    {!disableDelete && onDelete && (
                      <Tooltip title={'Remove Skill'}>
                        <div>
                          <IconButtonDelete 
                            onConfirmDelete={() => onDelete(node.id, parentSkillIds)}
                            iconButtonProps={{
                              size: 'small',
                              // @ts-ignore
                              'data-testid': 'delete-button'
                            }}
                            svgIconProps={{
                              fontSize: 'small'
                            }}
                          />
                        </div>
                      </Tooltip>
                    )}
                  </Stack>
                }
              />
            </Card>

            {numChildren > 0 && (
              isNodeExpanded ? (
              groupedChildren.map(({level, nodes}) => (
                <Stack key={level}>
                  <Stack direction="row" gap={.5} width={'100%'}>
                      <Stack sx={{width: '10px', height: '100%', background: '#aaaaaa', opacity: 0}}/>
                      <Stack sx={{width: '100%'}} gap={1}>
                        {nodes.map((childNode) => (
                          <SkillTreeV2ListDumb 
                            key={childNode.id}
                            tree={tree}
                            node={childNode}
                            indent={indent + 1}
                            parentSkillIds={[...parentSkillIds, node.id]}
                            expandedPaths={expandedPaths}
                            onExpandToggle={onExpandToggle}
                            showActivityCount={showActivityCount}
                            showScore={showScore}
                            disableDelete={disableDelete}
                            disableGenerateSubskills={disableGenerateSubskills}
                            showCreateLesson={showCreateLesson}
                            onCreateActivities={onCreateActivities}
                            onCreateSlides={onCreateSlides}
                            onCreateLesson={onCreateLesson}
                            onGenerateSubskills={onGenerateSubskills}
                            onDelete={onDelete}
                          />
                        ))}
                      </Stack>
                    </Stack>
                  </Stack>
                ))
              ) : (
                <Stack>
                  <Stack direction="row" gap={.5} width={'100%'}>
                    <Stack sx={{width: '5px', height: '100%', margin: '5px', background: '#aaaaaa', opacity: 0}}/>
                    <Button 
                      size="small" 
                      fullWidth
                      onClick={() => onExpandToggle(node.id, parentSkillIds)} 
                      sx={{textTransform: 'none', color: theme.palette.text.secondary}}
                      data-testid="expand-button"
                    >
                      {`Show ${numChildren} more items`}
                    </Button>
                  </Stack>
                </Stack>
              ))}
          </>
        )}
      </Stack>
    </Stack>
  );
} 