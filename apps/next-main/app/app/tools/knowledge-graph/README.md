# Knowledge Graph Explorer

This tool allows users to visualize and explore knowledge graphs for any topic or skill.

## Features

- **Search Interface**: Users can enter any topic to visualize its knowledge graph
- **Suggested Topics**: Quick-access topic cards with relevant emojis for common subjects
- **Interactive Graph**: The graph is interactive and allows users to explore relationships between skills
- **Responsive Design**: Works well on both desktop and mobile devices
- **Fullscreen Mode**: Users can toggle fullscreen mode for a more immersive experience
- **Smooth Animations**: Uses Framer Motion for smooth transitions and animations
- **Loading Indicator**: Shows a fractal tree loading animation while generating the graph
- **Integrated Controls**: UI controls are seamlessly integrated into the graph's header
- **Keyboard Shortcuts**: Provides keyboard shortcuts for common actions (F, N, Esc, Enter)

## Implementation Details

The Knowledge Graph Explorer uses the following components:

- `SkillTreeV2` with graph variant for visualization
- `SimpleSkillChipWithAutoEmoji` for generating relevant emojis for topics
- `FractalTreeLoading` for the loading animation
- Framer Motion for animations and transitions
- Custom header elements via the `rightHeaderExtras` prop

## Technical Architecture

- Uses Supabase to create and store skills
- Integrates with the `FillSubskillTreeRoute` API to generate knowledge graphs
- Implements responsive layout with fullscreen capabilities
- Utilizes the `rightHeaderExtras` prop to place controls directly in the graph header
- Provides keyboard shortcuts for improved user experience:
  - `F`: Toggle fullscreen mode
  - `N`: Start a new search
  - `Esc`: Exit fullscreen mode
  - `Enter`: Submit search when typing
- Features suggested topic cards with relevant emojis for quick access to common subjects

## Future Enhancements

- Add ability to save and share knowledge graphs
- Implement search history
- Add more customization options for the graph visualization
- Integrate with the lesson creation workflow
- Add ability to export graphs as images or PDFs 