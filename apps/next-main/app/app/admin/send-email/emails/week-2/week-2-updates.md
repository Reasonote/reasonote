

## Podcast Improvements
### Podcast Queue
Adds the ability to add subjects to your podcast queue! Now, if you find something interesting,  you can keep learning easily, just like in your favorite streaming service. Two new buttons -- the Skip Buttons -- have been added to the existing seek buttons, so that you can skip to the next podcast, if you want to.

### Podcast Background Playback
Before, if you changed tabs, or your phone screen turned off, playback would stop. Now -- playback will continue in the background! You can also use your device's media playback buttons to control the podcast.

### Improved Podcast Controls
- Podcast controls now have a better speed indicator
- Podcast controls queue icon now shows up on the right
- Podcast controls layout is now laid out better.


----------------------------

### Admin Updates:
NOTE: Not user facing features!!!!
* [`apps/next-main/app/app/admin/send-email/week-1-email.html`](diffhunk://#diff-0b8697a5d75e3811a2c4fe73c5d4c6f5e25cf765205e5c645e977869b688a98aR1-R138): Added a new HTML email template for weekly updates, highlighting new features, bug fixes, and improvements.
* `apps/next-main/app/app/admin/users/[userId]/PodcastsTab.tsx`: Introduced the `PodcastsTab` component to display user-specific podcasts with infinite scroll functionality. ([apps/next-main/app/app/admin/users/[userId]/PodcastsTab.tsxR1-R43](diffhunk://#diff-a3d7035b0ae838d0ace7691897d11f0bcf8d25359c802d5a37e8acfa01a35a98R1-R43))
* `apps/next-main/app/app/admin/users/[userId]/LessonsTab.tsx`: Removed unused imports and replaced `Typography` and `Chip` components with `Txt` component for better consistency. ([apps/next-main/app/app/admin/users/[userId]/LessonsTab.tsxL7-R7](diffhunk://#diff-0b72e2cd87ffc258d9c932409b99e4ef6dc9bcfb13438d21bf6f3ffb16def71fL7-R7), [apps/next-main/app/app/admin/users/[userId]/LessonsTab.tsxR28-R31](diffhunk://#diff-0b72e2cd87ffc258d9c932409b99e4ef6dc9bcfb13438d21bf6f3ffb16def71fR28-R31))
* `apps/next-main/app/app/admin/users/[userId]/UserHistoryTab.tsx`: Removed the unused `gql` import and the `GET_USER_HISTORY` query. ([apps/next-main/app/app/admin/users/[userId]/UserHistoryTab.tsxL5](diffhunk://#diff-f84578eb9fa49a0e0fe44a3221e634a81e6d9296a9c4e8e22d6aaadc8f0cb580L5), [apps/next-main/app/app/admin/users/[userId]/UserHistoryTab.tsxL17-L42](diffhunk://#diff-f84578eb9fa49a0e0fe44a3221e634a81e6d9296a9c4e8e22d6aaadc8f0cb580L17-L42))
* `apps/next-main/app/app/admin/users/[userId]/page.page.tsx`: Added `PodcastsTab` to the user admin page and renamed the component to `UserAdminPage`. ([apps/next-main/app/app/admin/users/[userId]/page.page.tsxL18-R25](diffhunk://#diff-771f5e26d50b78066c2f9efc3066a9f38777a57c3a2e628b1226decce21619d7L18-R25), [apps/next-main/app/app/admin/users/[userId]/page.page.tsxL52-R55](diffhunk://#diff-771f5e26d50b78066c2f9efc3066a9f38777a57c3a2e628b1226decce21619d7L52-R55), [apps/next-main/app/app/admin/users/[userId]/page.page.tsxR87](diffhunk://#diff-771f5e26d50b78066c2f9efc3066a9f38777a57c3a2e628b1226decce21619d7R87), [apps/next-main/app/app/admin/users/[userId]/page.page.tsxR105-R107](diffhunk://#diff-771f5e26d50b78066c2f9efc3066a9f38777a57c3a2e628b1226decce21619d7R105-R107))

### Podcast Improvements
* Podcast now autoplays correctly once user interaction has occurred, and prompts user to play if autoplay is not available.
* Podcast now shows "loading" indicators when audio is not yet loaded or is still buffering.
* Podcasts will now auto-scroll to the appropriate line with a delay, making the experience of finding your place smoother.
* The play button is more obvious, and stylistically the chips are defocused unless they are on the active podcast line card.


### Bug Fixes and Enhancements:
* The AI will now appropriately save your self-attested skill-level, which you can check in Settings.
* The AI will now appropriately save the specific things you want to study in the skill you're currently viewing.

These changes collectively improve the functionality, maintainability, and user experience of the application.



-----------------------


# Comprehensive Pull Request Summary

This combined pull request introduces several new features, enhancements, and refactorings across the codebase. The key changes include:

## New Features

### 1. Real-Time Audio Feature
- Added a new API route for real-time audio processing using WebSocket to interact with the OpenAI Realtime API.[^1]
- Defined the schema for the new real-time audio API route using `zod`.[^2]
- Created a test page for the real-time audio feature, allowing users to select or input text and styles, generate audio, play it, and download it as a WAV file.[^3]

### 2. Combined History Component
- Introduced a new `CombinedHistory` component to unify the display of skill and podcast history in a single list.[^4]
- Replaced `SkillHistory` with `CombinedHistory` in the `LeftDrawer` component.[^5]

### 3. Slides With Configurable Difficulty
- Each slide can now be increased in difficulty / level of depth, easily, right from the slide.

## Enhancements

### 1. PodcastPlayer Improvements
- Added tracking for podcast visits using `rsnUserId` in the `PodcastPlayer` component.[^6]
- Updated bar colors in the `PodcastPlayer` component for better visual distinction.[^7]

### 2. Infinite Scroll Functionality
- Improved to prevent double fetching and added debouncing to the visibility check.[^8]

### 3. Lesson Pages
- Enhanced the lesson session page to include navigation hooks and a stack layout for better user experience.[^9]
- Updated the lesson list to create a new lesson session upon selection.[^10]

### 4. Analytics Integration
- Integrated user identification with PostHog analytics to track user interactions more effectively.[^11]

## Refactorings and Cleanups

1. Removed the `shouldRedirectToBetaPage` logic and related UI elements from the application layout.[^12]
2. Added a `CenterPaperStack` component to the lessons page.[^13]
3. Added a utility to get the directory name two levels up from the current file.[^14]

## Database and Schema Updates

### 1. Database Schema
- Added `podcast_id` field to the `user_history` table and updated related foreign keys.[^15]

### 2. GraphQL Schema
- Updated GraphQL fragments and queries to include `podcastId` and support the new `CombinedHistory` component.[^16]

-------------------------------------------

This pull request makes the onboarding experience much more streamlined and user-friendly.

### New Components and Features:
* [`apps/next-main/app/ExperienceCardBig.tsx`](diffhunk://#diff-1bb5fe241887056dc773a16cf90f9cdf7b92612095c2fcf1273daa4c18c5a4d7R1-R58): Introduced the `ExperienceCard` component, which displays interactive cards with hover effects for different learning experiences.
* [`apps/next-main/app/LearningExperiencePickerBig.tsx`](diffhunk://#diff-921724d84db535a1c5e1a572f37ebf4c5b0ae32d1de17d23c5f8b557793d19eeR1-R100): Added the `LearningExperiencePickerBig` component that allows users to pick between different learning modes with a loading state and progress indicator.
* [`apps/next-main/app/LearningModeSelectorSmall.tsx`](diffhunk://#diff-b0061986ea589a535e05e460e98aac2e93a09b943c3b5a82ee8f58a6c3bec183R1-R82): Added the `LearningModeSelectorSmall` component for selecting learning modes in a compact format.

### Refactoring and Integration:
* [`apps/next-main/app/page.page.tsx`](diffhunk://#diff-676a3f7fa35ded3540fd4154fda05ef3c45bb5cfde96a61b7de33911db41328cL10): Refactored the main application page to use the new `LearningExperiencePickerBig` and `LearningModeSelectorSmall` components, replacing the old `LearningExperiencePicker` and `ExperienceCard` components. This includes changes to the layout, handling of user interactions, and conditional rendering based on device size. [[1]](diffhunk://#diff-676a3f7fa35ded3540fd4154fda05ef3c45bb5cfde96a61b7de33911db41328cL10) [[2]](diffhunk://#diff-676a3f7fa35ded3540fd4154fda05ef3c45bb5cfde96a61b7de33911db41328cR48) [[3]](diffhunk://#diff-676a3f7fa35ded3540fd4154fda05ef3c45bb5cfde96a61b7de33911db41328cR69-R70) [[4]](diffhunk://#diff-676a3f7fa35ded3540fd4154fda05ef3c45bb5cfde96a61b7de33911db41328cL147-R151) [[5]](diffhunk://#diff-676a3f7fa35ded3540fd4154fda05ef3c45bb5cfde96a61b7de33911db41328cR335) [[6]](diffhunk://#diff-676a3f7fa35ded3540fd4154fda05ef3c45bb5cfde96a61b7de33911db41328cR452-R453) [[7]](diffhunk://#diff-676a3f7fa35ded3540fd4154fda05ef3c45bb5cfde96a61b7de33911db41328cR466-R470) [[8]](diffhunk://#diff-676a3f7fa35ded3540fd4154fda05ef3c45bb5cfde96a61b7de33911db41328cL608-R498) [[9]](diffhunk://#diff-676a3f7fa35ded3540fd4154fda05ef3c45bb5cfde96a61b7de33911db41328cR654-R658) [[10]](diffhunk://#diff-676a3f7fa35ded3540fd4154fda05ef3c45bb5cfde96a61b7de33911db41328cL782-R690) [[11]](diffhunk://#diff-676a3f7fa35ded3540fd4154fda05ef3c45bb5cfde96a61b7de33911db41328cL849-R757) [[12]](diffhunk://#diff-676a3f7fa35ded3540fd4154fda05ef3c45bb5cfde96a61b7de33911db41328cL876-R775) [[13]](diffhunk://#diff-676a3f7fa35ded3540fd4154fda05ef3c45bb5cfde96a61b7de33911db41328cR824)

### Minor Updates:
* [`apps/next-main/components/appHeader/AppHeaderSkill.tsx`](diffhunk://#diff-2b164e519f1d3fb007da903a8b743fb815695c4b55d7ad6135df97c7b8271f9bL67-R67): Adjusted the minimum width of a button for better alignment.
* [`apps/next-main/components/auth/login-signup/LoginSignupCombined.tsx`](diffhunk://#diff-80be6e51940e3bbd2b0fcceed3cb449c78186fd44167f877a938bb72669f2045R168-R169): Updated the `posthog.capture` call to send data instantly.