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
  ButtonGroup,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

// Import knowledge graph image and Bloom's taxonomy image
import knowledgeGraphImage from "./assets/student-knowledge-graph.png";

export default function OpenSourcingReasonotePage() {
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
          Reasonote Is Now Open-Source: Building the Future of Adaptive Learning
        </Txt>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Convert any content into an adaptive course -- open source, graph‑aware, and extensible.
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          Free for individuals, commercially supported for teams.
        </Typography>

        <ButtonGroup variant="contained" sx={{ mt: 2 }}>
          <Button 
            component="a" 
            href="https://reasonote.app/" 
            target="_blank" 
            rel="noopener"
          >
            🚀 Try the live demo
          </Button>
          <Button 
            component="a" 
            href="https://github.com/reasonote/reasonote" 
            target="_blank" 
            rel="noopener"
            startIcon={<GitHub />}
          >
            ⭐ Star us on GitHub
          </Button>
        </ButtonGroup>
      </Stack>

      <Divider sx={{ mb: 4 }} />

      {/* Content */}
      <Stack spacing={4} sx={{ maxWidth: 800, mx: 'auto' }}>
        <MuiMarkdownDefault>
          {trimLines(`
            Today, we're excited to announce that Reasonote is going open-source. We believe the future of education is open, and we're committed to making that future a reality.
            In a world overflowing with information but lacking effective learning tools, we've built the platform we always wished existed -- one that adapts to your learning style while providing the structure needed for true mastery.
          `)}
        </MuiMarkdownDefault>

        {/* Subscribe component in the middle */}
        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <Paper variant="outlined" sx={{ p: 3, width: '100%', maxWidth: 500, mt: 2, alignItems: 'center', display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <BlogSubscribe 
                variant="compact"
                title="Follow Our Open Source Journey"
                description="Get notified about new releases, features, and technical deep-dives" 
                buttonText="Subscribe"
              />
            </Box>
          </Paper>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Txt variant="h4" fontWeight="bold" sx={{ mb: 2 }}>
            The Problem We're Solving
          </Txt>
          <br/>

          <MuiMarkdownDefault>
            {trimLines(`
              Education today faces fundamental challenges that limit learner potential:
              <br/>
              <br/>
              
              ### Traditional Education's Limitations
              
              - One-size-fits-none curriculum that moves at the same pace regardless of individual understanding
              - Impersonal learning environments due to high student-teacher ratios
              - Limited "why" context where students are told what to learn but rarely why it matters
              - Fear of failure that discourages experimentation and first-principles thinking
              
              <br/>
              ### Current EdTech Shortcomings
              
              Having been both learners and teachers, we've observed that learning platforms fall into two categories: **pre-made courses** that offer complete but inflexible learning experiences, and **chatbots or AI assistants** that provide unstructured, user-led learning but lack any structured progression.

              We think learning can be the best of both worlds -- structured, but dynamic, individualized yet grounded. Mastery and curiosity thriving together.
            `)}
          </MuiMarkdownDefault>
        </Box>

        <Divider />

        <Box sx={{ mb: 4 }}>
          <Txt variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
            How Reasonote Works
          </Txt>
          <br/>

          <MuiMarkdownDefault>
            {trimLines(`
              Reasonote solves these problems by creating personalized AI-Generated interactive courses — including Skill Trees, Lessons, Activities, Feedback, Assistance and Interactive Podcasts — to scaffold a person's journey through the process of understanding a concept.
              <br/>
              <br/>
              1. **Drop in content**: PDF, slide deck, research paper — anything text-based
              2. **Watch it transform**: Our system maps concepts into a knowledge graph
              3. **Learn optimally**: Dynamic lessons and activities follow your personal learning edge
              4. **Listen anywhere**: Generate personalized podcasts from your materials
            `)}
          </MuiMarkdownDefault>
        </Box>

        <Divider />

        <Box sx={{ mb: 4 }}>
          <Txt variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
            Other Features We Think Are Pretty Neat
          </Txt>

          <MuiMarkdownDefault>
            {trimLines(`
              <br/>
              - **Smart learning pathways:** We map out how concepts connect and build on each other, so you always learn things in the right order.
              - **Intelligent review scheduling:** We remember what you know and what you don't, prioritizing reviews based on how concepts relate to each other, not just isolated facts.
              - **Beyond simple memorization:** We offer activities that develop your ability to analyze, evaluate, and create - not just memorize facts.
              - **Everything links back to source:** Every activity connects directly back to your original materials, so you can verify information and see it in context.
              - **Listen and learn:** Turn any document into a personalized podcast that focuses on what matters most to your learning goals.
              - **Extends to fit your needs:** Our plugin architecture lets you create custom activity types, or connect to other learning tools.
              - **Truly open:** The entire codebase is open source, so you can inspect it, modify it, run it yourself, and keep complete control of your learning data.
            `)}
          </MuiMarkdownDefault>
        </Box>

        <Divider />

        <Box sx={{ mb: 2, mt: 2 }}>
          {/* Knowledge Graph Image */}
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                maxWidth: 700,
                height: 'auto',
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: theme.shadows[4],
              }}
            >
              <img
                src={knowledgeGraphImage.src}
                alt="Student Knowledge Graph visualization showing concept connections and dependencies"
                style={{ 
                  width: '100%', 
                  height: 'auto', 
                  objectFit: 'cover', 
                  display: 'block'
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  bgcolor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  px: 2,
                  py: 1,
                  borderTopLeftRadius: 4,
                  fontSize: '0.75rem',
                }}
              >
                Common-Knowledge Graph
              </Box>
            </Box>
          </Box>
        </Box>

        <Divider />

        <Box sx={{ mb: 4 }}>
          <Txt variant="h5" fontWeight="bold" sx={{ mb: 2, mt: 4 }}>
            Key Innovations That Make Reasonote Unique
          </Txt>
          <br/>

          <MuiMarkdownDefault>
            {trimLines(`
              ### 1. Fully Generative, Grounded In Sources
              
              Unlike traditional educational platforms that rely on pre-written content, every aspect of Reasonote's learning experience is dynamically generated by AI, while staying grounded in your source material. This includes the curriculum structure, explanations, examples, practice activities, and personalized feedback - all generated from and validated against your original content. The AI adapts the content and difficulty based on your goals and interests, creating an individualized learning journey that evolves with you while ensuring accuracy to the source material.
              <br/>
              <br/>
              ### 2. Skill Tree & DAG-SRS-1 Algorithm
              
              Unlike Anki, Duolingo, or Quizlet — we map prerequisite relationships between concepts (as a Directed Acyclic Graph) and combine this with spaced repetition. This means you'll learn concepts in-order, and when you're ready. For instance — you'll learn the concept of ***velocity*** before the concept of ***acceleration***, because our system knows it's a prerequisite and you're prepared.
              <br/>
              <br/>
              While "Spaced Repetition for Skill Sequencing" is a well-studied method for information retention, most implementations are concept-specific and don't account for prerequisite relationships between skills. Our DAG-SRS-1 algorithm combines prerequisite relationships and performance scores to determine the best next skill to learn, ensuring a logical learning progression.
              <br/>
              <br/>
              ### 3. AI-Generated Activity Abstraction
              
              We've gone beyond basic flashcards to prevent "overfitting" in learning. Our system generates eight different activity types (roleplay, sequencing, term-matching, etc.) that move past memorization to ensure deeper conceptual understanding.
              <br/>
              <br/>
              Developers can create new activity types by specifying three components:

              - A generator (TS) that creates the activity
              - A renderer (React) that displays it
              - A grader (TS) that evaluates responses
              <br/>
              <br/>
              Each component has access to AI calls to make the experience as interactive as desired.
            `)}
          </MuiMarkdownDefault>
        </Box>

        <Divider />

        

        <Box sx={{ mb: 4 }}>
          <Txt variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
            Why Open Source?
          </Txt>

          <MuiMarkdownDefault>
            {trimLines(`
              <br/>
              We believe systematic improvements to education will improve the world. As such, education is far too important to be locked behind proprietary walls. We've seen the bad that came from "enshittification", and we've seen the good that came from Wikipedia and other open-source tools. We want to build a robust future for AI-powered learning.
              
              We believe education should foster both mastery of existing knowledge and the curiosity to question it - creating learners who can stand at the frontier of knowledge and then push it forward through first-principles thinking.
              
              Finally, we believe that making the product community-driven can give us a much broader perspective, to ensure the product is useful in a wide array of domains and circumstances. This will help us discover use cases we haven't yet considered.
            `)}
          </MuiMarkdownDefault>
        </Box>

        <Divider />

        <Box sx={{ mb: 4 }}>
          <Txt variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
            Our Tech Stack
          </Txt>

          <MuiMarkdownDefault>
            {trimLines(`
              <br/>
              - TypeScript + React frontend
              - Node.js + Bun backend
              - Postgres database via Supabase
              - OpenAI / Anthropic for AI (other provider support is on-roadmap)
            `)}
          </MuiMarkdownDefault>
        </Box>

        <Divider />

        <Box sx={{ mb: 4 }}>
          <Txt variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
            The Roadmap Ahead
          </Txt>

          <MuiMarkdownDefault>
            {trimLines(`
              <br/>
              We're still quite early! Currently, you can upload documents you want to learn from, and Skill Trees, Lessons, Activities, Feedback, and Interactive Podcasts are all generated for you.
              
              Soon, we'll support:
              
              - Learning from videos, audio, and webpages
              - AI-generated diagrams using Mermaid
              - More activity types (Feel free to suggest or author your own!)
              - Advanced visualizations and analytics
            `)}
          </MuiMarkdownDefault>
        </Box>

        <Divider />

        <Box sx={{ mb: 4 }}>
          <Txt variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
            Coming Soon
          </Txt>

          <MuiMarkdownDefault>
            {trimLines(`
              <br/>
              In the spirit of open source, over the next few weeks, we'll share what we've learned while building Reasonote:

              - **Technical deep dives**—working with LLMs, the tools we chose, prompting strategies, streaming podcast generation, and more.
              - **Cognitive-science insights**—optimal cognitive load, boosting learning efficiency, and related research.

              Subscribe to stay updated!
              
              *Choose your interests when subscribing – receive all updates or just the engineering/education content that matters to you.*
            `)}
          </MuiMarkdownDefault>
        </Box>

        <Divider />

        <Box sx={{ mb: 4 }}>
          <Txt variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
            Join the Community
          </Txt>

          <MuiMarkdownDefault>
            {trimLines(`
              <br/>
              We're excited to see what you all build with Reasonote! Here are some ways to get involved:

              - **[Try the app](https://reasonote.com/app/)** – five minutes beats a thousand words.
              - **[Star the Github repo](https://github.com/reasonote/reasonote)** – help others discover the project.
              - **[Contribute to the project](https://github.com/reasonote/reasonote)** – make it yours.
              - **[Join our Discord](https://discord.gg/8VRBVyDP2g)** – to chat with the team and other users.
              - **Subscribe Below** – for updates and technical deep-dives.
              - **[Donate to the project](https://github.com/sponsors/reasonote)** – help us build the future of education.
              - **[Email us](mailto:hello@reasonote.com)** – for business inquiries, or to ask questions.
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
                Try the Demo
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
}