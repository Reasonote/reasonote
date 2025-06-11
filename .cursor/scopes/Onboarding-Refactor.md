# Course Creation Onboarding Refactor PRD

## Overview
**Updated based on user feedback**: Replace the homepage direct upload with a cleaner card-based course creation flow, similar to the existing partial_skill page design pattern.

## Current Problems
1. Homepage has direct file upload that immediately redirects users away
2. No clear course creation CTA or branding
3. Users don't understand what they're creating (course vs. skill)
4. No course naming or organization step

## Solution
**Card-Based Course Creation Flow** (inspired by partial_skill page):

### Phase 1: Inline Card Design (No Modal)
- Replace homepage upload with "Create Your Course" CTA card
- **Part 1**: Simple course name input + content selection in elegant card
- **Part 2**: Collapsible "Advanced Options" for detailed configuration
- Only show "organize skills" step IF user uploads content (docs/Anki)

### Phase 2: Auto vs Manual Organization Choice  
When content is uploaded, give users the choice:
- **"Organize skills for me"** (auto, emphasized) - runs in background with progress
- **"Let me help organize"** (manual) - shows existing skill tree interface

## Detailed Design

### Homepage CTA Card
- Beautiful card with course creation branding
- Clear value proposition
- Single "Get Started" button

### Course Creation Card (replaces modal)
**Part 1 - Always Visible:**
- Course name input (optional, with skip option)
- Content type selection:
  - 📄 Upload Documents (fully functional)
  - 📚 Import Anki Decks (coming soon)
  - ✏️ Create Manually (coming soon)
- Large "Create Course" button

**Part 2 - Advanced Options (Collapsible):**
- Level selection (beginner/intermediate/advanced)
- Learning goals (add/edit goals)
- Activity type preferences
- Additional settings

### Flow Logic
1. User clicks "Get Started" → Shows course creation card
2. User optionally enters course name
3. User selects content type and uploads if needed
4. **IF content uploaded** → Show organization choice:
   - Auto-organize: "Let AI organize skills for me" (recommended)
   - Manual: "I want to organize skills myself"
5. **IF auto-organize** → Process in background, show progress, redirect to course
6. **IF manual** → Take to existing skill organization interface
7. **IF no content** → Create empty course structure

## Implementation Phases

### Interaction 1: Foundation ✅
- [x] Course creation types and interfaces
- [x] Basic modal with stepper (replaced in later iterations)
- [x] Homepage CTA component
- [x] Replace homepage upload with CTA

### Interaction 2: Core Components ✅  
- [x] Course name step with validation and skip
- [x] Dynamic stepper configuration
- [x] Context for state management
- [x] Placeholder for content step

### Interaction 3: Document Flow ✅
- [x] Content type selection UI
- [x] Document upload integration
- [x] Processing state management
- [x] File upload progress and error handling

### Interaction 4: Card-Based Redesign (CURRENT)
- [ ] Remove modal + stepper approach
- [ ] Create inline card-based course creation component
- [ ] Implement collapsible "Advanced Options"
- [ ] Match partial_skill page visual design
- [ ] Integrate document upload into card flow

### Interaction 5: Anki Integration
- [ ] Extract Anki components from HeaderAddButton
- [ ] Integrate Anki upload into card flow
- [ ] Add deck/card selection interface
- [ ] Handle Anki processing state

### Interaction 6: Organization Choice & Polish
- [ ] Auto vs manual organization choice
- [ ] Background skill organization with progress
- [ ] Integration with existing skill tree
- [ ] Final polish and testing

## Success Metrics
- Increased course creation completion rate
- Better user understanding of course creation flow
- Reduced drop-off at upload step
- Improved onboarding experience

## Technical Notes

### UI Pattern
Following the partial_skill page pattern:
- Single elegant card (no modal)
- Clean top section with primary action
- Collapsible advanced options
- Smooth transitions and micro-interactions

### State Management
- Continue using React Context for course creation state
- Simplify navigation (no stepper)
- Handle document upload and processing inline

### Integration Points
- Document processing API (existing)
- Anki import API (existing)
- Course creation API (to be implemented)
- Skill organization system (existing)

## Current Status
**Completed**: Foundation, core components, and document flow with modal + stepper approach
**Next**: Refactor to card-based design without modal/stepper, inspired by partial_skill page UX

## User Stories

### Primary User Story
**As a new user**, I want to understand what will happen when I create a course and have control over the process, so that I feel confident and in control of my learning experience.

### Supporting User Stories
- **As a user**, I want to name my course before content is processed, so that it's organized the way I prefer
- **As a user**, I want to add multiple types of content (docs, Anki decks) in one course creation flow
- **As a user**, I want clear feedback about what's happening during processing
- **As a user**, I want to be able to skip naming if I prefer auto-generation
- **As a user importing Anki decks**, I want to see my progress through the extended import process in a single, consistent stepper

## Current State vs. Desired State

### Current Homepage Flow
1. User sees upload button directly on homepage
2. User uploads file → immediate processing
3. User is redirected to generated skill/course

### Desired New Flow
1. **Homepage**: Clear "Create Your Course" CTA with explanatory text
2. **Modal with Dynamic Stepper**: Steps adjust based on content type
3. **Document Flow**: Name → Add Content → [Processing]
4. **Anki Flow**: Name → Add Content → Select Cards → Organize Skills → [Processing]
5. **Destination**: Navigate to created course

## Detailed Feature Specification

### 1. Homepage Redesign

#### Primary CTA
- **Button Text**: "Create Your Course"
- **Styling**: Prominent, primary button (similar to current upload button)
- **Position**: Center of the card, where current upload button exists

#### Supporting Text
- **Main Headline**: Keep current A/B tested headline
- **Subtext**: "Generate personalized courses from your documents, Anki decks, and other learning materials"
- **Supported Formats**: Small caption listing supported file types

#### Removal
- Remove direct file upload functionality from homepage
- Remove drag-and-drop behavior on homepage
- Keep existing continue learning section

### 2. Create Course Modal with Dynamic Stepper

#### Modal Properties
- **Size**: Large (`maxWidth="lg"`)
- **Responsive**: Full-width on mobile
- **Backdrop**: Non-dismissible during processing

#### Dynamic Stepper Component
The stepper dynamically adjusts based on content type and user choices:

**Base Steps (All Flows)**:
- Name (skippable)
- Add Content

**Document Flow**:
- Name → Add Content → [Processing & Navigation]

**Anki Flow** (Extended):
- Name → Add Content → Select Cards → Organize Skills → [Processing & Navigation]

**Future Integrations**:
- YouTube: Name → Add Content → Configure Video → [Processing]
- Multiple Content: Name → Add Content → Review & Organize → [Processing]

#### Step Configuration Logic
```typescript
const getStepsForFlow = (contentType?: string, courseName?: string) => {
  const baseSteps = courseName ? ['Add Content'] : ['Name', 'Add Content'];
  
  switch (contentType) {
    case 'anki':
      return [...baseSteps, 'Select Cards', 'Organize Skills'];
    case 'youtube':
      return [...baseSteps, 'Configure Video'];
    case 'document':
    default:
      return baseSteps;
  }
};
```

### 3. Step 1: Course Name

#### UI Components
- **Input Field**: 
  - Label: "Course Name"
  - Placeholder: "e.g., Advanced React Concepts, Spanish Vocabulary, etc."
  - Helper text: "Leave blank to auto-generate based on your content"
- **Skip Option**: "Skip - Generate name automatically" link
- **Navigation**: 
  - Next button (enabled always)
  - Back button (disabled on first step)

#### Behavior
- Store name in modal state
- Validate reasonable length (1-100 characters)
- No required validation - can be empty
- If skipped, remove from stepper and advance directly to Add Content

### 4. Step 2: Add Content

#### Content Upload Options
Display as cards/options (similar to current HeaderAddButton):

1. **Upload Documents**
   - Icon: Document icon
   - Description: "PDF, DOCX, TXT files (up to 50 pages)"
   - Action: Sets content type to 'document' and triggers file picker

2. **Import Anki Decks**
   - Icon: Import icon
   - Description: "Upload .apkg files from Anki"
   - Action: Sets content type to 'anki' and expands stepper

3. **Add Details Manually** (Future)
   - Icon: Edit icon
   - Description: "Create course content from scratch"
   - Action: Sets content type to 'manual'

#### Content Type Selection Behavior
When user selects a content type:
1. **Update stepper steps** dynamically based on content type
2. **Store content type** in modal state
3. **Show type-specific interface** (file picker, etc.)
4. **Enable navigation** to next step

### 5. Step 3: Select Cards (Anki Only)

#### Component Refactoring
Refactor existing `ImportApkgFile` component into smaller, reusable components:

```typescript
// New component structure
AnkiFlow/
├── AnkiFileUpload.tsx        // File selection and upload
├── AnkiCardSelection.tsx     // Deck/card selection (Step 3)
├── AnkiSkillOrganization.tsx // Skill association (Step 4)
└── AnkiProcessing.tsx        // Processing and completion
```

#### Step 3 Functionality (AnkiCardSelection)
- **File Upload**: If not done in Step 2, handle .apkg upload
- **Deck Display**: Show parsed decks with card counts
- **Card Selection**: 
  - Checkbox selection for entire decks
  - Expandable accordions for individual card selection
  - Preview of card front/back content
- **Validation**: Ensure at least some cards are selected
- **Navigation**: 
  - Back to Add Content step
  - Next to Organize Skills (enabled when cards selected)

### 6. Step 4: Organize Skills (Anki Only)

#### Skills Explanation
Before presenting options, provide clear context:
- **What are skills?** "Skills are units of learning that help organize your knowledge. Think of them as topics or concepts you want to master."
- **Why organize?** "We'll create a skill tree to help you track progress and understand how concepts connect."

#### Step 4 Functionality (AnkiSkillOrganization)
Present users with two clear paths:

**Option A: "Organize Skills for Me" (Slightly Emphasized)**
- **UI**: Primary button, recommended badge, positioned first
- **Copy**: "Let us automatically organize your cards into a skill tree"
- **Sub-text**: "We'll analyze your cards and create a logical learning path (recommended for most users)"
- **Behavior**: 
  - Start background skill creation and organization
  - Show progress with specific messaging ("Analyzing cards...", "Creating skill tree...", "Organizing concepts...")
  - User sees progress but doesn't need to make decisions
  - Faster completion time

**Option B: "Let Me Help Organize" (Power User Path)**
- **UI**: Secondary button, "Advanced" label
- **Copy**: "I want to organize the skill tree myself"
- **Sub-text**: "Review and customize how your cards are organized into skills"
- **Behavior**:
  - Show skill autocomplete for associating imported content
  - Allow creation of new skills
  - Show skill tree preview with real-time updates
  - Interactive organization with existing tree apparatus
  - User guidance and explanations throughout

#### Implementation Details

**Auto-Organization Path**:
```typescript
interface AutoOrganizeProps {
  selectedCards: SelectedCardData;
  courseName?: string;
  onComplete: (result: AnkiImportResult) => void;
  onSwitchToManual: () => void; // Allow switching mid-process
}
```

**Manual Organization Path** (existing functionality):
```typescript
interface ManualOrganizeProps {
  selectedCards: SelectedCardData;
  onComplete: (result: AnkiImportResult) => void;
  onBack: () => void;
}
```

#### Choice Interface Design
```
┌─────────────────────────────────────────────────────────────┐
│ How would you like to organize your Anki cards into skills? │
│                                                             │
│ Skills are units of learning that help organize your        │
│ knowledge and track your progress.                          │
│                                                             │
│ ┌─────────────────────────────────┐ ┌─────────────────────── │
│ │ 🤖 Organize Skills for Me       │ │ ⚙️  Let Me Help        │
│ │ ⭐ Recommended                   │ │ Advanced               │
│ │                                 │ │                       │
│ │ We'll automatically create a    │ │ Review and customize   │
│ │ logical skill tree from your    │ │ how cards are         │
│ │ cards                          │ │ organized             │
│ │                                 │ │                       │
│ │ [Organize for Me]              │ │ [Let Me Organize]     │
│ └─────────────────────────────────┘ └─────────────────────── │
└─────────────────────────────────────────────────────────────┘
```

#### Navigation Options
- **Back**: Return to Select Cards step
- **Switch Paths**: Allow switching from auto to manual (with confirmation)
- **Complete**: Advance to processing/completion

### 7. Processing States

#### Document Processing
- **UI**: Same as current homepage processing screen
- **Location**: Overlay the entire modal
- **Messaging**: "Creating your course from [filename]..."

#### Anki Processing
- **UI**: Replace modal content with processing interface
- **Messaging**: 
  - "Creating activities from selected cards..."
  - "Organizing skill tree..."
  - "Finalizing your course..."
- **Progress**: Show specific progress indicators

#### Error Handling
- **Display**: Error alerts within current step
- **Actions**: Retry options, go back to previous step
- **Persistence**: Keep all user progress, don't lose data
- **Step Rollback**: Allow users to go back and fix issues

### 8. Final Destination

#### Success Criteria
- Course/skill successfully created
- User navigated to appropriate page

#### Navigation Targets
- **Document Courses**: `/app/skills/{skillId}?tab=outline` (same as current)
- **Anki Courses**: `/app/skills/{skillId}?tab=learn` (focus on practice)
- **Mixed Content**: Primary content type determines destination

#### Modal Closure
- Close modal on successful navigation
- Clear modal state
- Show success toast/notification

## Technical Implementation

### Component Architecture

#### New Components
```
CreateCourseModal/
├── CreateCourseModal.tsx           // Main modal with dynamic stepper
├── hooks/
│   ├── useStepperConfig.tsx        // Dynamic step configuration
│   └── useCourseCreation.tsx       // Course creation logic
├── steps/
│   ├── CourseNameStep.tsx          // Step 1: Course naming
│   ├── AddContentStep.tsx          // Step 2: Content type selection
│   └── ProcessingStep.tsx          // Final: Processing overlay
├── content-flows/
│   ├── DocumentFlow/
│   │   └── DocumentUpload.tsx      // Document-specific handling
│   ├── AnkiFlow/
│   │   ├── AnkiFileUpload.tsx      // File upload for Anki
│   │   ├── AnkiCardSelection.tsx   // Step 3: Card selection
│   │   ├── AnkiSkillOrganization.tsx // Step 4: Skill organization
│   │   └── AnkiProcessing.tsx      // Anki-specific processing
│   └── index.ts                    // Content flow exports
├── providers/
│   └── CourseCreationContext.tsx   // Global state management
└── types/
    └── courseCreation.types.ts     // TypeScript definitions
```

#### State Management
```typescript
interface CourseCreationState {
  // Basic course info
  courseName?: string;
  contentType?: 'document' | 'anki' | 'manual';
  
  // Stepper state
  currentStep: number;
  steps: string[];
  canProgress: boolean;
  
  // Content-specific data
  documentData?: DocumentUploadData;
  ankiData?: AnkiImportData;
  
  // Processing state
  isProcessing: boolean;
  processingState?: ProcessingState;
  
  // Navigation
  finalDestination?: string;
}

interface AnkiImportData {
  uploadedFile?: File;
  decks: AnkiDeck[];
  selectedCards: SelectedCardData;
  selectedSkills: AutocompleteSkill[];
  skillTreeState: 'waiting' | 'working' | 'finished' | 'error';
}

interface DocumentUploadData {
  files: File[];
  uploadStatus: 'pending' | 'uploading' | 'complete' | 'error';
}
```

#### Dynamic Stepper Hook
```typescript
export const useStepperConfig = (contentType?: string, courseName?: string) => {
  const getSteps = useCallback(() => {
    const baseSteps = courseName ? ['Add Content'] : ['Name', 'Add Content'];
    
    switch (contentType) {
      case 'anki':
        return [...baseSteps, 'Select Cards', 'Organize Skills'];
      case 'youtube':
        return [...baseSteps, 'Configure Video'];
      case 'document':
      default:
        return baseSteps;
    }
  }, [contentType, courseName]);

  const [steps, setSteps] = useState<string[]>(getSteps());
  const [currentStep, setCurrentStep] = useState(0);

  const updateStepsForContentType = useCallback((newContentType: string) => {
    const newSteps = getSteps();
    setSteps(newSteps);
    // Don't auto-advance step, let user control navigation
  }, [getSteps]);

  return {
    steps,
    currentStep,
    setCurrentStep,
    updateStepsForContentType,
    canGoBack: currentStep > 0,
    canGoForward: currentStep < steps.length - 1,
  };
};
```

### Integration Points

#### Homepage Integration
- Replace `HomeMainSkillCreatorV2` upload functionality with CTA button
- Keep drag-and-drop detection but show modal instead
- Maintain existing continue learning functionality

#### Anki Integration
- **Refactor** `ImportApkgFile` into step-specific components
- **Reuse** existing `/api/integrations/anki/ingest` route
- **Maintain** all existing Anki processing logic
- **Extract** skill tree organization into separate component

#### Document Integration
- **Reuse** existing document processing pipeline
- **Maintain** same API calls and error handling
- **Keep** same success navigation logic

### Anki Component Refactoring

#### Current ImportApkgFile → New Components

**AnkiCardSelection.tsx** (extracted from ImportApkgFile step 1):
```typescript
interface AnkiCardSelectionProps {
  decks: AnkiDeck[];
  onSelectionChange: (selectedCards: SelectedCardData) => void;
  onNext: () => void;
  onBack: () => void;
}
```

**AnkiSkillOrganization.tsx** (extracted from ImportApkgFile steps 2-3):
```typescript
interface AnkiSkillOrganizationProps {
  selectedCards: SelectedCardData;
  onSkillsSelected: (skills: AutocompleteSkill[]) => void;
  onComplete: (result: AnkiImportResult) => void;
  onBack: () => void;
}
```

This maintains all existing functionality while fitting into the unified stepper flow.

## User Experience Flow

### Happy Path - Document Upload
1. User clicks "Create Your Course" on homepage
2. Modal opens with stepper: **[Name]** → Add Content
3. User enters "React Advanced Patterns" or skips
4. Stepper updates to: Name → **[Add Content]**
5. User clicks "Upload Documents"
6. User selects PDF file
7. Modal shows processing overlay
8. On completion, user navigated to skill page, modal closes

### Happy Path - Anki Import (Auto-Organize)
1. User clicks "Create Your Course" on homepage  
2. Modal opens with stepper: **[Name]** → Add Content
3. User skips naming step
4. Stepper updates to: **[Add Content]**
5. User clicks "Import Anki Decks"
6. **Stepper dynamically expands**: Add Content → **[Select Cards]** → Organize Skills
7. User uploads .apkg file, selects cards
8. User proceeds to: Add Content → Select Cards → **[Organize Skills]**
9. **Choice presented**: "Organize for me" vs "Let me help"
10. User selects "Organize Skills for Me" (recommended path)
11. Background processing begins with progress indicators
12. Processing completes, user navigated to skill page, modal closes

### Happy Path - Anki Import (Manual Organize)
1-9. Same as above through choice presentation
10. User selects "Let Me Help Organize" (power user path)
11. User sees skill association interface and tree organization
12. User customizes organization with guidance
13. Manual organization completes, processing begins
14. User navigated to skill page, modal closes

### Error Handling Flow
1. User uploads unsupported file in any step
2. Error message shows within current step
3. User can retry, go back, or choose different content
4. All previous progress preserved (course name, selections, etc.)

## Acceptance Criteria

### Homepage
- [ ] "Create Your Course" button replaces upload functionality
- [ ] Descriptive text explains supported content types
- [ ] No direct file upload capability on homepage
- [ ] Continue learning section remains unchanged
- [ ] Drag detection shows modal instead of processing files

### Dynamic Stepper
- [ ] Stepper shows appropriate steps based on content type
- [ ] Document flow: Name → Add Content (→ Processing)
- [ ] Anki flow: Name → Add Content → Select Cards → Organize Skills (→ Processing)
- [ ] Steps update dynamically when content type is selected
- [ ] Back/forward navigation works correctly
- [ ] Step labels are clear and descriptive

### Modal Functionality
- [ ] Modal opens with stepper UI
- [ ] Course name step allows optional input and skipping
- [ ] Add Content step shows upload options clearly
- [ ] Content type selection triggers stepper updates
- [ ] Processing states work for all content types
- [ ] Error handling preserves user progress
- [ ] Modal closes on successful course creation

### Document Flow
- [ ] Document upload works same as current homepage
- [ ] Same file validation and processing
- [ ] Same navigation to skill page
- [ ] Same error handling and messaging

### Anki Flow (Extended)
- [ ] File upload and deck parsing works correctly
- [ ] Card selection interface (from ImportApkgFile) displays properly
- [ ] Skill organization step functions correctly  
- [ ] Background processing shows appropriate feedback
- [ ] Navigation to skill page with learn tab focus
- [ ] All existing ImportApkgFile functionality preserved

### Cross-browser Compatibility
- [ ] Works on Chrome, Firefox, Safari, Edge
- [ ] Mobile responsive design
- [ ] File upload works on all platforms
- [ ] Dynamic stepper updates work consistently

## Future Enhancements

### Multi-Content Courses
- Support multiple documents in one course
- Combine Anki decks with documents
- Course-level organization and structure
- Additional stepper steps for content review

### Advanced Course Configuration
- Learning objectives input
- Difficulty level selection
- Estimated duration settings
- Course description and metadata

### Integration Expansion
- **YouTube Video Processing**: Add Content → Configure Video → [Processing]
- **Web Page/Article Import**: Add Content → Configure Source → [Processing]  
- **Notion Page Integration**: Add Content → Select Pages → [Processing]
- **Readwise Highlights**: Add Content → Select Highlights → [Processing]

### Course Templates
- Pre-built course structures
- Subject-specific templates  
- Learning path recommendations
- Template selection as content type

## Dependencies

### Internal Dependencies
- **Completed**: Anki import functionality in HeaderAddButton
- **Required**: Refactoring ImportApkgFile into step components
- **Existing**: Document processing pipeline and skill creation logic

### External Dependencies
- No new external services required
- Existing file storage and processing APIs
- Current authentication and user management

## Risks and Mitigations

### Risk: Component Refactoring Complexity
- **Mitigation**: Phase refactoring (start with extraction, then integration)
- **Mitigation**: Maintain existing functionality in parallel during development
- **Mitigation**: Comprehensive testing of extracted components

### Risk: Dynamic Stepper UX Confusion
- **Mitigation**: Clear step labels and progress indication
- **Mitigation**: User testing of stepper behavior
- **Mitigation**: Smooth animations for step changes

### Risk: State Management Complexity  
- **Mitigation**: Use Context API for clean state management
- **Mitigation**: Type-safe state interfaces
- **Mitigation**: Clear separation between step-specific and global state

### Risk: Regression in Current Flows
- **Mitigation**: Feature flags for gradual rollout
- **Mitigation**: Parallel testing of old vs new flows
- **Mitigation**: Easy rollback capability

## Testing Strategy

### Unit Testing
- Dynamic stepper configuration logic
- Step navigation and validation
- Component state management
- File upload and processing functions
- Error handling scenarios

### Integration Testing
- End-to-end course creation flows (document and Anki)
- API integration points
- Cross-browser stepper behavior
- Modal state persistence

### User Testing
- A/B test new flow vs. current flow
- Stepper UX and navigation feedback
- Content type selection clarity
- Anki import flow completion rates

### Component Testing
- Extracted Anki components function independently
- Step transitions work smoothly
- Error states display correctly
- Processing feedback is clear

## Implementation Timeline

### Interaction 1: Homepage Redesign + Basic Modal
**Scope**: Replace upload functionality with CTA, create modal foundation
**Deliverables**:
- [ ] Replace `HomeMainSkillCreatorV2` upload button with "Create Your Course" CTA
- [ ] Create basic `CreateCourseModal` component with static stepper
- [ ] Basic modal state management and open/close functionality
- [ ] Static stepper UI (Name → Add Content steps)

**Files to Create/Modify**:
- `apps/next-main/app/app/page.page.tsx` - Update homepage CTA
- `apps/next-main/components/course-creation/CreateCourseModal.tsx` - New modal
- `apps/next-main/components/course-creation/types/courseCreation.types.ts` - Types

**Checkpoint**: Homepage shows CTA button, modal opens with basic 2-step stepper

---

### Interaction 2: Course Name Step + Dynamic Stepper Foundation
**Scope**: Implement course naming and dynamic step configuration
**Deliverables**:
- [ ] Create `CourseNameStep` component with skip functionality
- [ ] Implement `useStepperConfig` hook for dynamic step management
- [ ] Basic step navigation between Name and Add Content
- [ ] Course name state management

**Files to Create/Modify**:
- `apps/next-main/components/course-creation/steps/CourseNameStep.tsx` - New
- `apps/next-main/components/course-creation/hooks/useStepperConfig.tsx` - New
- `apps/next-main/components/course-creation/providers/CourseCreationContext.tsx` - New

**Checkpoint**: Can navigate between Name and Add Content steps, course name persists

---

### Interaction 3: Add Content Step + Document Flow Integration
**Scope**: Content type selection and working document upload
**Deliverables**:
- [ ] Create `AddContentStep` with content type cards
- [ ] Implement document upload flow within modal
- [ ] Connect to existing document processing pipeline
- [ ] Processing overlay within modal
- [ ] Complete document creation flow (modal → processing → skill page)

**Files to Create/Modify**:
- `apps/next-main/components/course-creation/steps/AddContentStep.tsx` - New
- `apps/next-main/components/course-creation/content-flows/DocumentFlow/DocumentUpload.tsx` - New
- Update modal to handle processing states

**Checkpoint**: Can create courses from documents end-to-end through new modal

---

### Interaction 4: Anki Component Extraction
**Scope**: Refactor ImportApkgFile into reusable step components
**Deliverables**:
- [ ] Extract `AnkiCardSelection` component from `ImportApkgFile` (step 1)
- [ ] Extract `AnkiSkillOrganization` component from `ImportApkgFile` (steps 2-3)
- [ ] Create shared types and interfaces
- [ ] Test extracted components work independently

**Files to Create/Modify**:
- `apps/next-main/components/course-creation/content-flows/AnkiFlow/AnkiCardSelection.tsx` - New
- `apps/next-main/components/course-creation/content-flows/AnkiFlow/AnkiSkillOrganization.tsx` - New
- `apps/next-main/components/course-creation/content-flows/AnkiFlow/types.ts` - New

**Checkpoint**: Extracted Anki components work as standalone components

---

### Interaction 5: Anki Flow Integration + Dynamic Step Expansion
**Scope**: Integrate Anki components into dynamic stepper
**Deliverables**:
- [ ] Implement dynamic step expansion when Anki is selected
- [ ] Integrate `AnkiCardSelection` as Step 3
- [ ] Integrate `AnkiSkillOrganization` as Step 4
- [ ] Connect to existing `/api/integrations/anki/ingest` route
- [ ] Complete Anki creation flow (modal → steps → processing → skill page)

**Files to Create/Modify**:
- Update `useStepperConfig` for Anki step injection
- Update `CreateCourseModal` to handle extended flows
- `apps/next-main/components/course-creation/content-flows/AnkiFlow/AnkiFileUpload.tsx` - New

**Checkpoint**: Can create courses from Anki files end-to-end with extended stepper

---

### Interaction 6: Polish, Error Handling & Testing
**Scope**: Production-ready refinements
**Deliverables**:
- [ ] Comprehensive error handling with step rollback
- [ ] Progress preservation across all steps
- [ ] Mobile responsiveness testing
- [ ] Performance optimization (lazy loading, etc.)
- [ ] Cross-browser compatibility
- [ ] Clean up and remove old code references

**Files to Review/Polish**:
- All created components for error handling
- Mobile responsive design
- Performance optimizations
- Code cleanup

**Checkpoint**: Production-ready course creation flow with robust error handling

---

## Context Size Considerations

**Per Interaction Limits**:
- **Files Modified**: 3-5 files max per interaction
- **New Components**: 2-3 major components max
- **Complexity**: One major feature per interaction
- **Dependencies**: Each interaction builds cleanly on previous

**Checkpoint Validation**:
- Each interaction should result in a demonstrable, testable feature
- Can be validated independently before moving to next interaction
- Clear rollback point if issues arise

**Logical Dependencies**:
1. **Interaction 1 → 2**: Modal foundation needed for stepper
2. **Interaction 2 → 3**: Dynamic stepper needed for content flows  
3. **Interaction 3 → 4**: Document flow establishes patterns for Anki
4. **Interaction 4 → 5**: Extracted components needed for integration
5. **Interaction 5 → 6**: Complete flows needed for comprehensive testing 