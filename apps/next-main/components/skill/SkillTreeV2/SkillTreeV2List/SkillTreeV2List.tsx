import {
  useCallback,
  useState,
} from "react";

import _ from "lodash";

import {SkillChipProps} from "@/components/chips/SkillChip/SkillChip";
import {
  ActivityType,
  LessonSkillTreeActivityGenerateSkill,
  SkillTree,
  SkillTreeNode,
} from "@reasonote/core";

import {SkillTreeV2ListDumb} from "./SkillTreeV2ListDumb";

/**
 * Props for the SkillTreeV2List component, which handles the business logic
 * for a single node in the skill tree, including expansion state and callbacks.
 */
export interface SkillTreeV2ListProps {
  /** The skill tree data structure containing all nodes and edges */
  tree: SkillTree;
  /** The current node's data */
  node: SkillTreeNode;
  /** The current indentation level in the tree (0 = root) */
  indent: number;
  /** Array of parent skill IDs in the current path to this node */
  parentSkillIds?: string[];
  /** Callback to generate new subskills for a node */
  generateSubskills?: (skillId: string, parentSkillIds?: string[]) => void;
  /** Array of skill IDs that are currently generating subskills */
  generatingSubskillsIds?: string[];
  /** Callback to delete a skill from the tree */
  deleteSkill?: (skillId: string, parentSkillIds?: string[]) => void;
  /** Callback to create activities for a skill */
  createActivitiesForSkill?: (props: {
    skill: LessonSkillTreeActivityGenerateSkill,
    activityType: ActivityType
  }) => any;
  /** Callback to create slides for a skill */
  createSlidesForSkill?: (props: {
    skill: LessonSkillTreeActivityGenerateSkill,
  }) => any;
  /** Maximum depth to show before collapsing nodes */
  hideAfterDepth?: number;
  /** Callback to create a lesson for a skill */
  createLesson?: (skillId: string, parentSkillIds?: string[]) => void;

  /**
   * If set, show the number of activities for each skill.
   * Can be a boolean or a function that determines visibility per node.
   */
  showActivityCount?: boolean | ((n: SkillTreeNode) => boolean);
  
  /**
   * If set, show the score for each skill.
   * Can be a boolean or a function that determines visibility per node.
   */
  showScore?: boolean | ((n: SkillTreeNode) => boolean);

  /** Whether the delete functionality is disabled */
  disableDelete?: boolean;

  /**
   * If set, allows overriding any props on individual SkillChipProps.
   * Can be a boolean or a function that returns props per node.
   */
  skillChipProps?: boolean | ((n: SkillTreeNode) => SkillChipProps);

  /**
   * If set, show the create lesson button for each skill.
   * Can be a boolean or a function that determines visibility per node.
   */
  showCreateLesson?: boolean | ((n: SkillTreeNode) => boolean);
}

export function SkillTreeV2List({
  tree,
  node,
  indent,
  parentSkillIds = [],
  createLesson,
  generatingSubskillsIds,
  generateSubskills,
  deleteSkill,
  createActivitiesForSkill,
  createSlidesForSkill,
  hideAfterDepth,
  ...rest
}: SkillTreeV2ListProps) {
  const [expandedPaths, setExpandedPaths] = useState(() => {
    // Initialize with paths for first two levels
    const paths = new Set<string>();
    
    // Add current node's path
    const currentPath = [...parentSkillIds, node.id].join('/');
    paths.add(currentPath);
    
    // If we're at level 0 or 1, add child paths
    if (indent < 2) {
      const childEdges = tree.edges.filter(edge => edge.from === node.id);
      childEdges.forEach(edge => {
        paths.add([...parentSkillIds, node.id, edge.to].join('/'));
      });
    }
    
    return paths;
  });

  // Handle callbacks
  const handleExpandToggle = useCallback((thisId: string, parentSkillIds: string[] = []) => {
    // When expanding, add this node's children paths
    const newPaths = new Set(expandedPaths);
 
    // Add this node to expandedPaths
    newPaths.add([...parentSkillIds, thisId].join('/'));

    setExpandedPaths(newPaths);
  }, [tree.edges, expandedPaths]);

  const handleGenerateSubskills = (thisId: string, parentSkillIds?: string[]) => {
    if (generateSubskills) {
      generateSubskills(thisId, parentSkillIds);
    }
  };

  const handleDelete = (thisId: string, parentSkillIds?: string[]) => {
    if (deleteSkill) {
      deleteSkill(thisId, parentSkillIds);
    }
  };

  const handleCreateLesson = (thisId: string, parentSkillIds?: string[]) => {
    if (createLesson) {
      createLesson(thisId, parentSkillIds);
    }
  };

  return (
    <SkillTreeV2ListDumb
      tree={tree}
      node={node}
      indent={indent}
      parentSkillIds={parentSkillIds}
      expandedPaths={expandedPaths}
      onExpandToggle={handleExpandToggle}
      isGeneratingSubskills={generatingSubskillsIds?.includes(node.id)}
      onGenerateSubskills={handleGenerateSubskills}
      onDelete={handleDelete}
      onCreateActivities={createActivitiesForSkill ? 
        (type) => createActivitiesForSkill({
          skill: {
            id: node.id,
            pathTo: parentSkillIds ?? []
          },
          activityType: type as ActivityType
        }) : undefined}
      onCreateSlides={createSlidesForSkill ?
        () => createSlidesForSkill({
          skill: {
            id: node.id,
            pathTo: parentSkillIds ?? []
          }
        }) : undefined}
      onCreateLesson={handleCreateLesson}
      hideAfterDepth={hideAfterDepth}
      {...rest}
    />
  );
}