import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {theme} from "@/styles/theme";
import {ThemeProvider} from "@mui/material/styles";
import {SkillTree} from "@reasonote/core";
import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";

import {SkillTreeV2ListDumb} from "./SkillTreeV2ListDumb";

// Mock the CreateActivityIconDropdownButton component
vi.mock("@/components/activity/generate/CreateActivityTypeIconButton", () => ({
  CreateActivityIconDropdownButton: ({ onActivityTypeCreate, icon }: any) => (
    <button 
      onClick={() => onActivityTypeCreate('QUIZ')}
      data-testid="create-activities-button"
    >
      {icon}
    </button>
  ),
}));

// Mock the CreateSlidesModalButton component
vi.mock("./CreateSlidesModalButton", () => ({
  CreateSlidesModalButton: ({ onSlideCreate, icon }: any) => (
    <button 
      onClick={() => onSlideCreate()}
      data-testid="create-slides-button"
    >
      {icon}
    </button>
  ),
}));

// Add this mock at the top with other mocks
vi.mock("@/components/buttons/IconButtonDelete", () => ({
  IconButtonDelete: ({ onConfirmDelete, iconButtonProps }: any) => (
    <button 
      onClick={onConfirmDelete}
      {...iconButtonProps}
    >
      Delete
    </button>
  ),
}));

// Create a wrapper component that provides the theme
const renderWithTheme = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {ui}
    </ThemeProvider>
  );
};

// Update helper functions to handle nested spans
const findSkillByName = (name: string) => {
  return screen.getByText(name, {
    selector: 'span'
  });
};

const findAllSkillsByName = (name: string) => {
  return screen.getAllByText(name, {
    selector: 'span'
  });
};

describe('SkillTreeV2ListDumb', () => {
  const mockNode = {
    id: 'skill_1',
    name: 'Test Skill',
    emoji: '🎯',
    directScore: 0.75,
    calculatedScore: 0.8,
  };

  const mockNode2 = {
    id: 'skill_2',
    name: 'Child Skill 1',
  };

  const mockNode3 = {
    id: 'skill_3',
    name: 'Child Skill 2',
  };

  const mockTree = new SkillTree(
    [
      mockNode,
      mockNode2,
      mockNode3,
    ],
    [
      {
        id: 'edge_1',
        from: 'skill_1',
        to: 'skill_2',
        metadata: { level: 'BASIC' }
      },
      {
        id: 'edge_2',
        from: 'skill_1',
        to: 'skill_3',
        metadata: { level: 'BASIC' }
      }
    ]
  );

  const defaultProps = {
    tree: mockTree,
    node: mockNode,
    indent: 0,
    isExpanded: false,
    onExpandToggle: vi.fn(),
  };

  it('renders basic skill information', () => {
    renderWithTheme(<SkillTreeV2ListDumb {...defaultProps} />);
    expect(screen.getByText('Test Skill')).toBeInTheDocument();
  });

  it('shows/hides children based on isExpanded prop', () => {
    const { rerender } = renderWithTheme(<SkillTreeV2ListDumb {...defaultProps} />);
    expect(screen.queryByText(/Child Skill 1/i)).not.toBeInTheDocument();

    rerender(
      <ThemeProvider theme={theme}>
        <SkillTreeV2ListDumb 
          {...defaultProps} 
          
          expandedPaths={new Set(['skill_1'])}
        />
      </ThemeProvider>
    );
    expect(screen.getByText(/Child Skill 1/i)).toBeInTheDocument();
  });

  it('calls onExpandToggle when clicking expand button', () => {
    const onExpandToggle = vi.fn();
    renderWithTheme(
      <SkillTreeV2ListDumb {...defaultProps} onExpandToggle={onExpandToggle} />
    );
    
    const expandButton = screen.getByTestId('expand-button');
    fireEvent.click(expandButton);
    expect(onExpandToggle).toHaveBeenCalledWith('skill_1', []);
  });

  it('shows correct number of children in expand button', () => {
    renderWithTheme(<SkillTreeV2ListDumb {...defaultProps} />);
    const expandButton = screen.getByTestId('expand-button');
    expect(expandButton).toBeInTheDocument();
    expect(expandButton).toHaveTextContent('Show 2 more items');
  });

  it('shows activity count when showActivityCount is true', () => {
    renderWithTheme(
      <SkillTreeV2ListDumb {...defaultProps} showActivityCount={true} />
    );
    expect(screen.getByTestId('activity-count')).toBeInTheDocument();
  });

  it('shows score when showScore is true', () => {
    renderWithTheme(
      <SkillTreeV2ListDumb {...defaultProps} showScore={true} />
    );
    expect(screen.getByTestId('score-chip')).toBeInTheDocument();
  });

  it('recursively renders children when expanded', () => {
    renderWithTheme(
      <SkillTreeV2ListDumb 
        {...defaultProps} 
        
        expandedPaths={new Set(['skill_1'])}
      />
    );
    expect(screen.getByText(/Child Skill 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Child Skill 2/i)).toBeInTheDocument();
  });

  it('shows action buttons based on provided callbacks', () => {
    const onCreateLesson = vi.fn();
    const onCreateActivities = vi.fn();
    const onCreateSlides = vi.fn();
    
    renderWithTheme(
      <SkillTreeV2ListDumb 
        {...defaultProps} 
        onCreateLesson={onCreateLesson}
        onCreateActivities={onCreateActivities}
        onCreateSlides={onCreateSlides}
        showCreateLesson={true}
      />
    );

    expect(screen.getByTestId('create-lesson-button')).toBeInTheDocument();
    expect(screen.getByTestId('create-activities-button')).toBeInTheDocument();
    expect(screen.getByTestId('create-slides-button')).toBeInTheDocument();
  });

  it('handles deep nesting correctly', () => {
    const deepTree = new SkillTree(
      [
        mockNode,
        {
          id: 'skill_2',
          name: 'Level 1',
        },
        {
          id: 'skill_3',
          name: 'Level 2',
        },
        {
          id: 'skill_4',
          name: 'Level 3',
        }
      ],
      [
        {
          id: 'edge_1',
          from: 'skill_1',
          to: 'skill_2',
          metadata: { level: 'BASIC' }
        },
        {
          id: 'edge_2',
          from: 'skill_2',
          to: 'skill_3',
          metadata: { level: 'BASIC' }
        },
        {
          id: 'edge_3',
          from: 'skill_3',
          to: 'skill_4',
          metadata: { level: 'BASIC' }
        }
      ]
    );

    renderWithTheme(
      <SkillTreeV2ListDumb 
        {...defaultProps}
        tree={deepTree}
        
        expandedPaths={new Set([
          'skill_1',
          'skill_1/skill_2'
        ])}
      />
    );

    // First two levels should be visible by default
    expect(findSkillByName('Level 1')).toBeInTheDocument();
    expect(findSkillByName('Level 2')).toBeInTheDocument();
    
    // Level 3 should not be visible initially
    expect(screen.queryByText('Level 3')).not.toBeInTheDocument();
  });

  it('automatically expands first two levels', () => {
    const threeDeepTree = new SkillTree(
      [
        mockNode,
        { id: 'skill_2', name: 'Level 1' },
        { id: 'skill_3', name: 'Level 2' },
        { id: 'skill_4', name: 'Level 3' }
      ],
      [
        {
          id: 'edge_1',
          from: 'skill_1',
          to: 'skill_2',
          metadata: { level: 'BASIC' }
        },
        {
          id: 'edge_2',
          from: 'skill_2',
          to: 'skill_3',
          metadata: { level: 'BASIC' }
        },
        {
          id: 'edge_3',
          from: 'skill_3',
          to: 'skill_4',
          metadata: { level: 'BASIC' }
        }
      ]
    );

    renderWithTheme(
      <SkillTreeV2ListDumb 
        {...defaultProps}
        tree={threeDeepTree}
        
        expandedPaths={new Set(['skill_1', 'skill_1/skill_2'])}
      />
    );

    // First two levels should be visible
    expect(findSkillByName('Level 1')).toBeInTheDocument();
    expect(findSkillByName('Level 2')).toBeInTheDocument();

    // Third level should be hidden with "Show more" button
    expect(screen.queryByText('Level 3')).not.toBeInTheDocument();
    expect(screen.getByTestId('expand-button')).toHaveTextContent('Show 1 more items');
  });

  it('handles empty tree gracefully', () => {
    renderWithTheme(
      <SkillTreeV2ListDumb 
        {...defaultProps} 
        tree={new SkillTree([], [])}
      />
    );

    expect(screen.queryByText('More')).not.toBeInTheDocument();
  });

  it('respects hideAfterDepth prop', () => {
    renderWithTheme(
      <SkillTreeV2ListDumb 
        {...defaultProps}
        
        expandedPaths={new Set(['skill_1'])}
        hideAfterDepth={1}
      />
    );

    expect(findSkillByName('Child Skill 1')).toBeInTheDocument();
  });

  it('handles duplicate nodes in tree correctly', () => {
    const duplicateTree = new SkillTree(
      [mockNode, mockNode2],
      [
        {
          id: 'edge_1',
          from: mockNode.id,
          to: mockNode2.id,
          metadata: { level: 'BASIC' }
        },
        {
          id: 'edge_2',
          from: mockNode.id,
          to: mockNode2.id,
          metadata: { level: 'INTERMEDIATE' }
        }
      ]
    );

    renderWithTheme(
      <SkillTreeV2ListDumb 
        {...defaultProps}
        tree={duplicateTree}
        
        expandedPaths={new Set([
          'skill_1',
          'skill_1/skill_2'
        ])}
      />
    );

    const sharedSkills = findAllSkillsByName('Child Skill 1');
    expect(sharedSkills).toHaveLength(2);
  });

  it('handles action buttons correctly', async () => {
    const onDelete = vi.fn();
    const onGenerateSubskills = vi.fn();
    const onCreateLesson = vi.fn();
    const onCreateActivities = vi.fn();
    const onCreateSlides = vi.fn();

    renderWithTheme(
      <SkillTreeV2ListDumb 
        {...defaultProps}
        onDelete={onDelete}
        onGenerateSubskills={onGenerateSubskills}
        onCreateLesson={onCreateLesson}
        onCreateActivities={onCreateActivities}
        onCreateSlides={onCreateSlides}
        showCreateLesson={true}
        disableDelete={false}
      />
    );

    // Test delete button - now just clicks directly
    const deleteButton = screen.getByTestId('delete-button');
    fireEvent.click(deleteButton);
    expect(onDelete).toHaveBeenCalled();

    // Test generate subskills button
    const generateButton = screen.getByTestId('expand-tree-button');
    fireEvent.click(generateButton);
    expect(onGenerateSubskills).toHaveBeenCalled();

    // Test create lesson button
    const lessonButton = screen.getByTestId('create-lesson-button');
    fireEvent.click(lessonButton);
    expect(onCreateLesson).toHaveBeenCalled();

    // Test create activities button
    const activitiesButton = screen.getByTestId('create-activities-button');
    fireEvent.click(activitiesButton);
    expect(onCreateActivities).toHaveBeenCalledWith('QUIZ');

    // Test create slides button
    const slidesButton = screen.getByTestId('create-slides-button');
    fireEvent.click(slidesButton);
    expect(onCreateSlides).toHaveBeenCalled();
  });

  it('hides generate subskills button when disabled', () => {
    const onGenerateSubskills = vi.fn();
    
    renderWithTheme(
      <SkillTreeV2ListDumb 
        {...defaultProps}
        onGenerateSubskills={onGenerateSubskills}
        disableGenerateSubskills={true}
      />
    );

    // Generate subskills button should not be present
    expect(screen.queryByTestId('expand-tree-button')).not.toBeInTheDocument();
  });

  it('passes disableGenerateSubskills to child nodes', () => {
    const onGenerateSubskills = vi.fn();
    
    renderWithTheme(
      <SkillTreeV2ListDumb 
        {...defaultProps}
        tree={mockTree}
        expandedPaths={new Set(['skill_1'])}
        onGenerateSubskills={onGenerateSubskills}
        disableGenerateSubskills={true}
      />
    );

    // No generate subskills buttons should be present in the tree
    expect(screen.queryAllByTestId('expand-tree-button')).toHaveLength(0);
  });

  it('renders skill icon correctly', () => {
    renderWithTheme(
      <SkillTreeV2ListDumb 
        {...defaultProps}
        node={{
          ...mockNode,
          emoji: '🎯'
        }}
      />
    );
    expect(screen.getByText('🎯')).toBeInTheDocument();
  });

  it('renders default skill icon when no emoji is provided', () => {
    renderWithTheme(
      <SkillTreeV2ListDumb 
        {...defaultProps}
        node={{
          ...mockNode,
          emoji: null
        }}
      />
    );
    expect(screen.getByTestId('skill-icon')).toBeInTheDocument();
  });

  it('handles circular references in display only', () => {
    const circularTree = new SkillTree(
      [mockNode, mockNode2],
      [
        {
          id: 'edge_1',
          from: mockNode.id,
          to: mockNode2.id,
          metadata: { level: 'BASIC' }
        },
        {
          id: 'edge_2',
          from: mockNode2.id,
          to: mockNode.id,
          metadata: { level: 'BASIC' }
        }
      ]
    );

    renderWithTheme(
      <SkillTreeV2ListDumb 
        {...defaultProps}
        tree={circularTree}
        expandedPaths={new Set([
          'skill_1',
          'skill_1/skill_2',
          'skill_1/skill_2/skill_1'
        ])}
      />
    );

    // Each node should appear exactly once in each valid path
    expect(findAllSkillsByName('Test Skill')).toHaveLength(2);
    expect(findAllSkillsByName('Child Skill 1')).toHaveLength(2);
  });

  it('renders nodes at different levels correctly', () => {
    const multiLevelTree = new SkillTree(
      [
        mockNode,
        {
          id: 'skill_2',
          name: 'Basic Skill',
        },
        {
          id: 'skill_3',
          name: 'Intermediate Skill',
        },
        {
          id: 'skill_4',
          name: 'Advanced Skill',
        }
      ],
      [
        {
          id: 'edge_1',
          from: 'skill_1',
          to: 'skill_2',
          metadata: { level: 'BASIC' }
        },
        {
          id: 'edge_2',
          from: 'skill_1',
          to: 'skill_3',
          metadata: { level: 'INTERMEDIATE' }
        },
        {
          id: 'edge_3',
          from: 'skill_1',
          to: 'skill_4',
          metadata: { level: 'ADVANCED' }
        }
      ]
    );

    renderWithTheme(
      <SkillTreeV2ListDumb 
        {...defaultProps}
        tree={multiLevelTree}
        
        expandedPaths={new Set([mockNode.id])}
      />
    );

    expect(screen.getByText('Basic Skill')).toBeInTheDocument();
    expect(screen.getByText('Intermediate Skill')).toBeInTheDocument();
    expect(screen.getByText('Advanced Skill')).toBeInTheDocument();
  });

  it('handles nodes appearing in multiple paths', () => {
    const multiPathTree = new SkillTree(
      [
        mockNode,
        {
          id: 'skill_2',
          name: 'Shared Skill',
        }
      ],
      [
        {
          id: 'edge_1',
          from: 'skill_1',
          to: 'skill_2',
          metadata: { level: 'BASIC' }
        },
        {
          id: 'edge_2',
          from: 'skill_1',
          to: 'skill_2',
          metadata: { level: 'INTERMEDIATE' }
        }
      ]
    );

    renderWithTheme(
      <SkillTreeV2ListDumb 
        {...defaultProps}
        tree={multiPathTree}
        
        expandedPaths={new Set([
          'skill_1',
          'skill_1/skill_2'
        ])}
      />
    );

    // Should show the skill twice since it appears in different levels
    const sharedSkills = findAllSkillsByName('Shared Skill');
    expect(sharedSkills).toHaveLength(2);
  });

  it('correctly displays node metadata', () => {
    const nodeWithMetadata = {
      ...mockNode,
      calculatedScore: 0.75,
      directScore: 0.5,
      emoji: '🎯',
      metadata: {
        someKey: 'someValue'
      }
    };

    const metadataTree = new SkillTree(
      [nodeWithMetadata],
      []
    );

    renderWithTheme(
      <SkillTreeV2ListDumb 
        {...defaultProps}
        tree={metadataTree}
        node={nodeWithMetadata}
        showScore={true}
      />
    );

    expect(screen.getByText('🎯')).toBeInTheDocument();
    const scoreChip = screen.getByTestId('score-chip');
    expect(scoreChip).toBeInTheDocument();
    expect(scoreChip).toHaveTextContent('75.0%');
  });

  it('allows expanding deeper levels progressively', () => {
    const deepTree = new SkillTree(
      [
        mockNode,
        { id: 'skill_2', name: 'Level 1' },
        { id: 'skill_3', name: 'Level 2' },
        { id: 'skill_4', name: 'Level 3' }
      ],
      [
        {
          id: 'edge_1',
          from: 'skill_1',
          to: 'skill_2',
          metadata: { level: 'BASIC' }
        },
        {
          id: 'edge_2',
          from: 'skill_2',
          to: 'skill_3',
          metadata: { level: 'BASIC' }
        },
        {
          id: 'edge_3',
          from: 'skill_3',
          to: 'skill_4',
          metadata: { level: 'BASIC' }
        }
      ]
    );

    const onExpandToggle = vi.fn();
    const { rerender } = renderWithTheme(
      <SkillTreeV2ListDumb 
        {...defaultProps}
        tree={deepTree}
        
        expandedPaths={new Set(['skill_1'])}
        onExpandToggle={onExpandToggle}
      />
    );

    // Initially only Level 1 should be visible
    expect(findSkillByName('Level 1')).toBeInTheDocument();
    expect(screen.queryByText('Level 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Level 3')).not.toBeInTheDocument();

    // Click "Show more" on Level 1
    const expandButton1 = screen.getByTestId('expand-button');
    fireEvent.click(expandButton1);
    expect(onExpandToggle).toHaveBeenCalledWith('skill_2', ['skill_1']);

    // Simulate parent component updating expandedPaths
    rerender(
      <ThemeProvider theme={theme}>
        <SkillTreeV2ListDumb 
          {...defaultProps}
          tree={deepTree}
          
          expandedPaths={new Set(['skill_1', 'skill_1/skill_2'])}
          onExpandToggle={onExpandToggle}
        />
      </ThemeProvider>
    );

    // Now Level 2 should be visible with its own "Show more" button
    expect(findSkillByName('Level 2')).toBeInTheDocument();
    expect(screen.queryByText('Level 3')).not.toBeInTheDocument();
    expect(screen.getByTestId('expand-button')).toHaveTextContent('Show 1 more items');

    // Click "Show more" on Level 2
    const expandButton2 = screen.getByTestId('expand-button');
    fireEvent.click(expandButton2);
    expect(onExpandToggle).toHaveBeenCalledWith('skill_3', ['skill_1', 'skill_2']);

    // Simulate parent component updating expandedPaths again
    rerender(
      <ThemeProvider theme={theme}>
        <SkillTreeV2ListDumb 
          {...defaultProps}
          tree={deepTree}
          
          expandedPaths={new Set(['skill_1', 'skill_1/skill_2', 'skill_1/skill_2/skill_3'])}
          onExpandToggle={onExpandToggle}
        />
      </ThemeProvider>
    );

    // Finally Level 3 should be visible
    expect(findSkillByName('Level 3')).toBeInTheDocument();
  });

  it('safely handles cyclical references without infinite recursion', () => {
    // Create a tree with a cycle: skill_1 -> skill_2 -> skill_1
    const cyclicalTree = new SkillTree(
      [
        mockNode,
        { id: 'skill_2', name: 'Child' },
      ],
      [
        // skill_1 -> skill_2
        {
          id: 'edge_1',
          from: 'skill_1',
          to: 'skill_2',
          metadata: { level: 'BASIC' }
        },
        // skill_2 -> skill_1 (creates cycle)
        {
          id: 'edge_2',
          from: 'skill_2',
          to: 'skill_1',
          metadata: { level: 'BASIC' }
        }
      ]
    );

    // This would cause infinite recursion if not handled properly:
    // skill_1 -> skill_2 -> skill_1 -> skill_2 -> skill_1 ...
    // But path-based expansion prevents this
    const expandedPaths = new Set([
      'skill_1',                    // Root
      'skill_1/skill_2',           // Child
      'skill_1/skill_2/skill_1'    // Back to root, but in a new path
    ]);

    // This should render without any errors
    expect(() => {
      renderWithTheme(
        <SkillTreeV2ListDumb 
          {...defaultProps}
          tree={cyclicalTree}
          expandedPaths={expandedPaths}
        />
      );
    }).not.toThrow();

    // Verify the structure rendered correctly
    const rootSkills = findAllSkillsByName('Test Skill');
    const childSkills = findAllSkillsByName('Child');

    // Each skill should appear in its proper path positions
    expect(rootSkills).toHaveLength(2); // Once as root, once as child of Child
    expect(childSkills).toHaveLength(2); // Once as child of root, once as child of the repeated root
  }); 
}); 