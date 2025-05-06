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

import bloomsTaxonomyImage from "./assets/blooms-taxonomy-revised.jpeg";
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
          Reasonote Is Open-Source
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
            Today, we're excited to announce that Reasonote is going fully open-source. We believe the future of education is open, and we're committed to making that future a reality.
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
          <Txt variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
            Why We're Doing This
          </Txt>

          <MuiMarkdownDefault>
            {trimLines(`
              Most "online learning" still feels like reading a textbook in a web browser.
              As lifelong learners and curious individuals, we've observed that current learning platforms generally fall into two categories:
              1. **Pre-made courses** offering complete but inflexible learning experiences
                  - Well-structured but fixed curricula that rarely align with individual needs
                  - Material often lacks personal relevance, resulting in single-digit completion rates
              2. **Chatbots and AI assistants** providing unstructured, user-led learning
                  - Personalized but lacking structured progression
                  - Difficult to track learning progress
                  - Limited mechanisms for retention and assessment

              We think learning can be the best of both worlds -- structured, but dynamic. Individualized, but grounded.
              We wanted something better -- so we built it.
              And today, we're making that code public.
            `)}
          </MuiMarkdownDefault>
        </Box>

        <Divider />

        <Box sx={{ mb: 4 }}>
          <Txt variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
            How Reasonote Works
          </Txt>

          <MuiMarkdownDefault>
            {trimLines(`
              **1. Drop in content.** PDF, slide deck, research paper — anything text-based.
              **2. Watch it grow.** Reasonote maps the concepts into a directed graph: what depends on what.
              **3. Learn & review.** It serves activities (Flashcards, MCQs, Cloze Cards, AI Roleplays, and more) and schedules reviews along the graph so you study what matters most.
              **4. Take it with you.** Hit *Generate podcast* and listen on your commute.
              No separate "flashcard deck," no manual tagging—just upload and learn.
            `)}
          </MuiMarkdownDefault>
        </Box>

        <Divider />

        <Box sx={{ mb: 4 }}>
          <Txt variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
            What Makes Reasonote Unique
          </Txt>

          <MuiMarkdownDefault>
            {trimLines(`
              Here's what sets Reasonote apart:
              - **Smart learning pathways:** We map out how concepts connect and build on each other, so you always learn things in the right order.
              - **Intelligent review scheduling:** We remember what you know and what you don't, prioritizing reviews based on how concepts relate to each other, not just isolated facts.
              - **Beyond simple memorization:** We offer activities that develop your ability to analyze, evaluate, and create - not just memorize facts.
              - **Everything links back to source:** Every activity connects directly back to your original materials, so you can verify information and see it in context.
              - **Listen and learn:** Turn any document into a personalized podcast that focuses on what matters most to your learning goals.
              - **Extends to fit your needs:** Our plugin architecture lets you create custom activity types, or connect to other learning tools.
              - **Truly open:** The entire codebase is open source, so you can inspect it, modify it, run it yourself, and keep complete control of your learning data.
            `)}
          </MuiMarkdownDefault>

          {/* Knowledge Graph Image */}
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
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
                Knowledge graph visualization
              </Box>
            </Box>
          </Box>
        </Box>

        <Divider />

        <Box sx={{ mb: 4 }}>
          <Txt variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
            Open Source
          </Txt>

          <MuiMarkdownDefault>
            {trimLines(`
              We believe learning is a fundamental right and everyone should have access to high-quality education regardless of resources. Open-sourcing Reasonote is a step toward this vision, allowing people to run the project themselves and maintain ownership of their learning data.
              We're concerned about data usage in privately-owned platforms. Such ownership creates opportunities for data monetization, potentially leading to predatory advertising and misaligned incentives where companies prioritize keeping users on the platform rather than optimizing their learning experience.
              You can read more about our open source licensing strategy in [our Github Repo's \`LICENSE\` file.](https://github.com/Reasonote/Reasonote/blob/main/LICENSE)
            `)}
          </MuiMarkdownDefault>
        </Box>

        <Divider />

        <Box sx={{ mb: 4 }}>
          <Txt variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
            Road Ahead (Next Six Months)
          </Txt>

          <MuiMarkdownDefault>
            {trimLines(`
              - Plugin SDK – hot‑reloadable activity + grader modules
              - Importers – Notion, Roam, Obsidian, YouTube transcripts
              - Portable learner profiles – carry your knowledge graph between apps

              We'll publish deep‑dives as we ship. Subscribe below to follow our progress.
              Our vision is ambitious. We need community support and contributions to achieve this scope. By extending the interface to accommodate diverse learning needs, you help make Reasonote more valuable for everyone.
              Our long-term vision is to fundamentally transform how people learn in the digital age, where:
              - Learning is truly personalized to your prior knowledge and learning style
              - Knowledge acquisition is dramatically more efficient
              - Education is democratized and accessible to everyone
              - Learning becomes lifelong by default, helping people maintain and update their understanding continuously as knowledge evolves rapidly in our changing world
              - Communities can collaboratively build and share knowledge journeys, making expertise accessible across traditional barriers
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
              We're working on a series of in-depth articles exploring both the technical and educational aspects of Reasonote. Subscribe to stay updated:

              **Learning Science:**
              - **Prerequisite Thinking** – Why mastering fundamentals first transforms learning efficiency
              - **Optimizing Cognitive Load** – Techniques we use to present information at the right pace
              - **Climbing Bloom's Taxonomy** – Moving beyond memorization to deeper understanding

              **Engineering Insights:**
              - **Skill Tree Generation with AI** – How we automatically map knowledge dependencies in any content
              - **Streaming Podcast Generation** – The technical architecture behind turning documents into audio learning experiences
              - **Building with PGVector and Supabase** – Our approach to vectorization for semantic understanding
              *Choose your interests when subscribing – receive all updates or just the engineering/education content that matters to you.*
            `)}
          </MuiMarkdownDefault>

          {/* Bloom's Taxonomy Image */}
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                maxWidth: 600,
                height: 'auto',
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: theme.shadows[3],
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <img
                src={bloomsTaxonomyImage.src}
                alt="Revised Bloom's Taxonomy showing the hierarchy of learning objectives"
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
                  left: 0,
                  right: 0,
                  bgcolor: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  p: 1.5,
                  textAlign: 'center',
                  fontSize: '0.8rem',
                }}
              >
                Bloom's Taxonomy: Moving from memorization to creation
              </Box>
            </Box>
          </Box>
        </Box>

        <Divider />

        <Box sx={{ mb: 4 }}>
          <Txt variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
            Join the Community
          </Txt>

          <MuiMarkdownDefault>
            {trimLines(`
              1. **Try the demo** – five minutes beats a thousand words.
              2. **Star the repo** – help others discover the project.
              3. **Clone & tinker** – make it yours.
              4. **Subscribe** – for updates and technical deep-dives.
              5. **Sponsor** – if you want to accelerate research, the button's in the README.
            `)}
          </MuiMarkdownDefault>
        </Box>

        <Divider />

        <Box sx={{ mb: 4 }}>
          <Txt variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
            For Organizations
          </Txt>

          <MuiMarkdownDefault>
            {trimLines(`
              While Reasonote is free for individual use, we offer commercial licensing and support for teams looking to implement adaptive learning at scale. If you're interested in deploying Reasonote within your organization, enhancing employee training, or integrating our technology with your existing learning systems, [reach out to our team](mailto:business@reasonote.com).
              Together, we can build a future where everyone has access to personalized, effective learning tools that adapt to their unique needs and interests—making knowledge and expertise truly accessible in a rapidly changing world.
            `)}
          </MuiMarkdownDefault>
        </Box>

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