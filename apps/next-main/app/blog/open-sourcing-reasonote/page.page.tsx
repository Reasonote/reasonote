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
          <Txt variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
            Why We're Doing This
          </Txt>

          <MuiMarkdownDefault>
            {trimLines(`
              Having been both learners and teachers, we've observed that learning platforms fall into two categories: **pre-made courses** that offer complete but inflexible learning experiences, and **chatbots or AI assistants** that provide unstructured, user-led learning but lack any structured progression.

              We think learning can be the best of both worlds -- structured, but dynamic, individualized yet grounded. Mastery and curiosity thriving together. We wanted something better -- so we built it.

              And it is open! Some of the reasons we're doing this:

              - **Access for all.** Learning is a fundamental right, and everyone should have access to high-quality education regardless of their ability to pay. Open-sourcing Reasonote lets anyone run the project themselves.
              - **Data ownership.** Privately owned platforms will monetize your data, potentially leading to predatory advertising and misaligned incentives where firms prioritize keeping users on the platform rather than optimizing their learning experience. With open source, you can host Reasonote yourself and keep full control of your own data.
              - **Community-powered growth.** Our vision is broad, and we need your help to reach it: adding features for your specific use cases, translating the interface, and pushing the frontier of what adaptive learning can do.

              Curious about the license? Check the details in our [Github Repo's LICENSE file.](https://github.com/Reasonote/Reasonote/blob/main/LICENSE)
            `)}
          </MuiMarkdownDefault>
        </Box>

        <Divider />

        <Box sx={{ mb: 4 }}>
          <Txt variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
            The current product
          </Txt>

          <MuiMarkdownDefault>
            {trimLines(`
              While we are still far from the ultimate vision (stay tuned for a detailed writeup on our vision on the future of education), today we are shipping a platform that helps you master the content that you care about.

              **1. Drop in content.** PDF, slide deck, research paper — anything text-based.

              **2. Watch it grow.** Reasonote maps the concepts into a directed graph: what depends on what.

              **3. Learn & review.** It serves lessons, activities (Flashcards, MCQs, Cloze Cards, AI Roleplays, and more) and schedules reviews along the graph so you study what matters most.

              **4. Take it with you.** Hit *Generate podcast* and listen on your commute.
            `)}
          </MuiMarkdownDefault>
        </Box>

        <Divider />

        <Box sx={{ mb: 4 }}>
          <Txt variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
            Some features we think are pretty neat
          </Txt>

          <MuiMarkdownDefault>
            {trimLines(`
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
            Coming Soon
          </Txt>

          <MuiMarkdownDefault>
            {trimLines(`
              In the spirit of open source, over the next few weeks, we’ll share what we’ve learned while building Reasonote:

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
              1. **Try the demo** – five minutes beats a thousand words.
              2. **Star the repo** – help others discover the project.
              3. **Clone & tinker** – make it yours.
              4. **Subscribe** – for updates and technical deep-dives.
              5. **Sponsor** – if you want to accelerate research, the button's in the README.
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