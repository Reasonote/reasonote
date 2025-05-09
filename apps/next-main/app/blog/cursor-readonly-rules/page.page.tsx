'use client'
import React from "react";

import {useRouter} from "next/navigation";

import {BlogSubscribe} from "@/components/blog/BlogSubscribe";
import {MuiMarkdownDefault} from "@/components/markdown/MuiMarkdownDefault";
import {Txt} from "@/components/typography/Txt";
import {trimLines} from "@lukebechtel/lab-ts-utils";
import {
  ArrowBack,
  GitHub,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

import {FileChangeMessage} from "./FileChangeMessage";
import {GenericAIMessage} from "./GenericAIMessage";
import {MDXWrapper} from "./MDXWrapper";
import {Thread} from "./Thread";
// Import local components
import {UserMessage} from "./UserMessage";

export default function CursorReadonlyRulesPage() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Back Button */}
      <Box sx={{ mb: 4 }}>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => router.push('/blog')}
          variant="text"
        >
          Back to Blog
        </Button>
      </Box>

      {/* Header */}
      <Stack 
        spacing={2} 
        alignItems="center" 
        textAlign="center" 
        sx={{ mb: 6 }}
      >
        <Txt variant="h3" fontWeight="bold">
          Cursor: Readonly Rules
        </Txt>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          How to make AI assistants think before they act with a simple cursorrule
        </Typography>
        <Typography variant="subtitle1" sx={{ fontStyle: 'italic', fontFamily: 'KaTeX_Math' }}>
          "Think first."
        </Typography>
      </Stack>

      <Divider sx={{ mb: 4 }} />

      {/* Content */}
      <Stack spacing={4} sx={{ maxWidth: 800, mx: 'auto' }}>
        <Box sx={{ mb: 4 }}>
          <Txt variant="h4" fontWeight="bold" sx={{ mb: 2 }}>
            The Problem: Overeager AI Assistance
          </Txt>

          <MuiMarkdownDefault>
            {trimLines(`
              <br/>
              When working with AI assistants in code editors like Cursor / Windsurf, you've probably encountered this scenario:
              <br/>
              <br/>

              You casually mention "What about..." or "I wonder if..." and suddenly your AI is eagerly modifying files, creating new ones, and implementing a solution before you've had time to think through the problem.
              <br/>
              <br/>
              Often, this eagerness to jump in results in a worse implementation, because the requirements aren't abundantly clear. Further, the AI can sometimes make changes when you _don't want_ it to.
              <br/>
              <br/>

              This eagerness to help is generally a positive feature - but sometimes you just want to **explore ideas**, **ask questions**, **discuss architecture**, or **debug issues** without triggering immediate implementation.
            `)}
          </MuiMarkdownDefault>
        </Box>

        <Divider />

        <Box sx={{ mb: 4 }}>
          <Txt variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
            "Readonly State"
          </Txt>

          <MuiMarkdownDefault>
            {trimLines(`
              <br/>
              At [Reasonote](https://reasonote.com), we have a special "Readonly State" rule that allows you to explore ideas without triggering immediate implementation.

              <br/>
              The "Readonly State" rule creates a discussion-only mode for your AI assistant:

              <br/>
              <br/>
              \`\`\`text
              If I begin or end my message with "RO" or "ro", activate "Readonly State". In this state:

              1. You must NOT modify files, create new files, or use edit_file/any file modification tools
              2. You MUST prefix your responses with [READONLY STATE]\\n as a visual indicator
              3. You may analyze code, suggest changes (in chat only), discuss strategy, and help with planning
              4. You will only exit this state when I explicitly say "GO" or clearly request you to make specific file changes

              Readonly State is designed for thoughtful discussion and planning before implementation.
              \`\`\`

              <br/>
              <br/>

              Setup in Cursor:
              1. Add a file at \`[YOUR_PROJECT_ROOT]/.cursor/rules/readonly-state.mdc\` with the above content
              1. Ensure the cursor rule is set as 'Always active'

              <br/>

              Setup in windsurf:
              1. Add a file at \`[YOUR_PROJECT_ROOT]/.windsurf/rules/readonly-state.md\` with the above content
              1. Ensure the rule is set as 'Always active'
            `)}
          </MuiMarkdownDefault>
        </Box>

        <Divider />

        <Box sx={{ mb: 4 }}>
          <Txt variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
            When to Use Readonly State
          </Txt>

          <MuiMarkdownDefault>
            {trimLines(`
              <br/>
              This rule is particularly useful when:

              - **Exploring multiple approaches** to a problem before committing to one
              - **Discussing architecture** or design patterns without premature implementation
              - **Debugging complex issues** where you want to analyze before making changes
              - **Learning about code concepts** without modifying your codebase
              - **Planning a major refactor** that requires careful consideration
              - **Asking for clarification** before proceeding with implementation
            `)}
          </MuiMarkdownDefault>
        </Box>

        <Divider />

        <Box sx={{ mb: 4 }}>
          <Txt variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
            How It Works
          </Txt>

          <MuiMarkdownDefault>
            {trimLines(`
              <br/>
              Simply include \`RO\` or \`ro\` at the beginning or end of your message to activate Readonly State:

              <br/>
              \`\`\`text
              RO What do you think about refactoring this component to use React hooks instead?
              \`\`\`

              <br/>
              or
              <br/>

              <br/>
              \`\`\`text
              I'm wondering if we could improve the performance of this query ro
              \`\`\`

              <br/>

              The AI will respond with "[READONLY STATE]\\n\\n" at the beginning of its message, signaling it's in planning mode. It will provide analysis, suggestions, and ideas - but critically, it will not make any file changes.

              <br/>
              When you're ready for implementation, simply say:

              <br/>
              \`\`\`text
              GO
              \`\`\`

              <br/>
              or make a clear implementation request like:
              <br/>
              <br/>
              \`\`\`text
              Now implement the hook-based approach we discussed
              \`\`\`
            `)}
          </MuiMarkdownDefault>
        </Box>

        <Divider />

        <Box sx={{ mb: 4 }}>
          <Txt variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
            Benefits of the Readonly State Workflow
          </Txt>

          <MuiMarkdownDefault>
            {trimLines(`
              <br/>
              **1. Reduces the need to undo premature changes**  
              When the AI jumps straight to implementation, you often need to revert changes that don't align with your goals.

              <br/>
              **2. Enables proper planning**  
              Complex problems require exploration before commitment. Readonly State creates space for that exploration.

              <br/>
              **3. Improves communication clarity**  
              By forcing a clear delineation between discussion and implementation, both you and the AI understand exactly which mode you're operating in.

              <br/>
              **4. Builds better mental models**  
              Discussion-first approaches help the AI build better mental models of your intentions before acting on them.

              <br/>
              **5. Keeps you in control**  
              You decide when it's time to move from planning to implementation, not the AI's eagerness to help.
            `)}
          </MuiMarkdownDefault>
        </Box>

        <Divider />

        <Box sx={{ mb: 4 }}>
          <Txt variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
            Using Readonly State Effectively
          </Txt>

          <MuiMarkdownDefault>
            {trimLines(`
              <br/>
              For best results:

              - Use \`RO\` when you're still in the "divergent thinking" phase
              - Switch out of \`RO\` when you're ready for "convergent thinking"
              - Be explicit about what you want the AI to focus on during \`RO\` discussions
              - Take advantage of the opportunity to explore multiple approaches
            `)}
          </MuiMarkdownDefault>
        </Box>

        <Divider />

        <Box sx={{ mb: 4 }}>
          <Txt variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
            Real-world Scenarios Where Readonly Shines
          </Txt>

          <MuiMarkdownDefault>
            {trimLines(`
              <br/>
              ### Feature Planning: Thinking Before Building
              <br/>

              When starting a new feature, jumping straight into implementation often leads to rework later. You might have a general idea but need to explore the technical approach.
            `)}
          </MuiMarkdownDefault>

          <Thread>
            <UserMessage>
              <MDXWrapper>
                RO I need to build a user authentication system for my React app. What are the key components I should consider?
              </MDXWrapper>
            </UserMessage>
            <GenericAIMessage>
              <MDXWrapper>
                [READONLY STATE]
                <br/>

                For a React authentication system, you'll want to consider several key areas such as the API, frontend components, security, and user experience. We can dive into specifics if you'd like.
              </MDXWrapper>
            </GenericAIMessage>
            <UserMessage>
              <MDXWrapper>
                Let's go with JWT. How would the authentication flow work? What libraries should I consider?
              </MDXWrapper>
            </UserMessage>
            <GenericAIMessage>
              <MDXWrapper>
                [READONLY STATE]
                <br/>
                For JWT authentication in React, the typical flow involves token exchange and validation. Key libraries can help with this, and secure token storage is crucial. Ready to proceed with an example implementation?
              </MDXWrapper>
            </GenericAIMessage>
            <UserMessage>
              <MDXWrapper>
                GO
              </MDXWrapper>
            </UserMessage>
            <GenericAIMessage>
              <MDXWrapper>
                Alright, I'm on it! I'll implement the JWT authentication flow we discussed.
              </MDXWrapper>
            </GenericAIMessage>
            <FileChangeMessage fileName="src/components/AuthForm.jsx" added={15} removed={1} />
            <FileChangeMessage fileName="src/services/authService.js" added={10} removed={0} />
            <FileChangeMessage fileName="src/App.jsx" added={2} removed={0} />
            <GenericAIMessage>
              <MDXWrapper>
                I've set up the basic JWT authentication. We should definitely discuss more secure token storage strategies next!
              </MDXWrapper>
            </GenericAIMessage>
          </Thread>

          <MuiMarkdownDefault>
            {trimLines(`
              With Readonly State activated, the AI helps you map out the architecture, explore different auth providers, discuss security considerations, and recommend potential libraries—all without creating any files or writing any code prematurely.
              <br/>
              <br/>
              Once your mental model is clear and you've chosen an approach, you simply say "GO". The AI will then proceed with the implementation, typically confirming the changes made by summarizing the modified files and key alterations, as illustrated above.
              <br/>
              <br/>
              ### Post-Implementation Review: Questions Without Changes
              <br/>
              After the AI has created or modified code, you often want to understand certain aspects of the implementation:
            `)}
          </MuiMarkdownDefault>

          <Thread>
            <FileChangeMessage fileName="src/components/AuthForm.jsx" added={15} removed={1} />
            <FileChangeMessage fileName="src/services/authService.js" added={10} removed={0} />
            <FileChangeMessage fileName="src/App.jsx" added={2} removed={0} />
            <UserMessage>
              <MDXWrapper>
                RO Why did you implement the authentication using JWT instead of sessions?
              </MDXWrapper>
            </UserMessage>
            <GenericAIMessage>
              <MDXWrapper>
                [READONLY STATE]
                <br/>
                I chose JWT over sessions due to its statelessness, compatibility, and performance benefits for this kind of setup. However, sessions have their own advantages in other contexts.
              </MDXWrapper>
            </GenericAIMessage>
            <UserMessage>
              <MDXWrapper>
                How can I improve the token storage security?
              </MDXWrapper>
            </UserMessage>
            <GenericAIMessage>
              <MDXWrapper>
                [READONLY STATE]
                <br/>
                To improve JWT token storage security, key strategies include avoiding localStorage, using httpOnly cookies, implementing a robust token refresh mechanism, and considering in-memory storage for access tokens.
              </MDXWrapper>
            </GenericAIMessage>
          </Thread>

          <MuiMarkdownDefault>
            {trimLines(`
              Without Readonly State, asking questions might trigger the AI to think you're unhappy with its choice and immediately start rewriting the code. 
              <br/>
              <br/>
              But with \`RO\` activated, you can freely:

              <br/>
              - Ask clarifying questions about implementation choices
              - Learn about tradeoffs the AI considered
              - Understand how certain parts of the code work
              - Explore alternative approaches that might be better
              <br/>
              <br/>

              Often, the AI's first implementation is perfectly valid, and your questions are simply to understand it better. Readonly State keeps the AI in explanation mode, preventing premature or unnecessary changes while you're still absorbing the solution.
            `)}
          </MuiMarkdownDefault>
        </Box>

        <Divider />

        <Box sx={{ mb: 4 }}>
          <MuiMarkdownDefault>
            {trimLines(`
              The Readonly State cursorrule is a simple but powerful way to improve your workflow with AI coding assistants. By creating a clear boundary between exploration and implementation, you gain the benefits of AI assistance while maintaining control of your development process.
              <br/>
              <br/>
              Next time you find yourself saying "Wait, I didn't want you to do that yet!" - try starting with \`RO\`.
            `)}
          </MuiMarkdownDefault>
        </Box>

        <Divider />

        {/* CTA Footer with Subscribe */}
        <Box sx={{ textAlign: 'center', mt: 6, mb: 4 }}>
          <Stack spacing={4} alignItems="center">
            <Txt variant="h4" fontWeight="bold">
              Stay Connected
            </Txt>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600 }}>
              Subscribe to get technical deep-dives, release notes, and community highlights.
            </Typography>
            <Paper variant="outlined" sx={{ p: 3, width: '100%', maxWidth: 500, mt: 2, alignItems: 'center', display: 'flex', justifyContent: 'center' }}>
              <BlogSubscribe 
                variant="compact"
                buttonText="Subscribe to Updates"
              />  
            </Paper>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 4 }}>
              <Button 
                variant="contained" 
                size="large"
                component="a" 
                href="https://github.com/reasonote/reasonote" 
                target="_blank" 
                rel="noopener"
                startIcon={<GitHub />}
              >
                Star on GitHub
              </Button>

              <Button 
                variant="outlined" 
                size="large"
                component="a" 
                href="https://reasonote.app/" 
                target="_blank" 
                rel="noopener"
              >
                Try Reasonote
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
} 