"use client";
import React from 'react';
import { Stack, Typography, Container, Grid } from '@mui/material';
import { 
  School, 
  AutoStories,
  Analytics,
  Share,
  ControlPoint,
  AutoAwesome,
  RotateRight,
} from '@mui/icons-material';
import AppLayout from '../../app/layout.page';
import VoronoiBackgroundDefault from "@/components/backgrounds/VoronoiBackgroundDefault";
import { TryNowButton, FeatureSection, WhyChooseSection, ExamplePageLayout } from '../utils';

export default function TeachExample() {
  return (
    <AppLayout>
      <div style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }}>
        <VoronoiBackgroundDefault/>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          overflowY: 'auto',
          zIndex: 1,
        }}>
          <Container maxWidth="lg" sx={{ py: 4 }}>
            <ExamplePageLayout>
              <Stack spacing={4} alignItems="center" sx={{ maxWidth: '1200px', margin: 'auto' }}>
                <School sx={{ fontSize: 60, color: 'primary.main' }} />
                
                <Typography variant="h4" textAlign="center" sx={{ mb: 2 }}>
                  AI-Powered Course Creation for Educators
                </Typography>

                <Typography variant="body1" textAlign="center" sx={{ maxWidth: '800px', mb: 3 }}>
                  Spending too much time creating and adapting learning materials? Let AI handle the heavy 
                  lifting. Create personalized lessons in minutes, not hours, while maintaining full control 
                  over the content and teaching approach.
                </Typography>

                <TryNowButton text="Create Your First Lesson Now" link="/app/lessons/new" />

                <Grid container spacing={2} sx={{ 
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',                    // 1 column on mobile
                        md: 'repeat(2, 1fr)'          // 2 columns on medium and up
                    },
                    gap: 2
                }}>
                  <FeatureSection
                    title="Rapid Lesson Planning"
                    icon={AutoStories}
                    description="Tired of having to build your own lessons from scratch? We've got you covered. 
                    Input your topic and a brief description of the learning objectives, and our AI generates a detailed lesson plan.
                    Alternatively, simply input a file about your topic and we'll generate a lesson plan for you."
                    imageSrc="/static/images/examples/teach/lesson-creation.png"
                    imageAlt="Lesson Creation Interface"
                  />

                  <FeatureSection
                    title="Retain Flexibility and Control"
                    icon={ControlPoint}
                    description="Our AI will suggest skills and topics to cover, but you can always edit the lesson plan to fit your needs.
                    You can add skills manually, deepend the skill tree with AI, and autogenerate slides and activities for specific skills."
                    imageSrc="/static/images/examples/teach/enhance-skill-tree.png"
                    imageAlt="Enhance Skill Tree Interface"
                  />

                  <FeatureSection
                    title="AI-Powered Content Generation"
                    icon={AutoAwesome}
                    description="Our AI will generate slides and activities for specific skills, or for the entire lesson. 
                    You can always edit the content and activities to fit your needs, or use them as a starting point for your own content."
                    imageSrc="/static/images/examples/teach/content-generation.png"
                    imageAlt="AI Content Generation Interface"
                  />

                  <FeatureSection
                    title="Share the Lessons with Your Students or Employees"
                    icon={Share}
                    description="Invite your students or employees to the lesson, and they'll be able to access the lesson materials and activities.
                    You can also make collaborative lessons with your colleagues, or make your lessons public to the world."
                    imageSrc="/static/images/examples/teach/share-lesson.png"
                    imageAlt="Share Lesson Interface"
                  />

                  <FeatureSection
                    title="Analytics Dashboard"
                    icon={Analytics}
                    description="Track student or employee progress, identify knowledge gaps, and measure learning outcomes with 
                    our comprehensive analytics. Make data-driven decisions to improve your teaching effectiveness."
                    chipText="Coming Soon"
                    chipColor="#9e9e9e"
                  />

                  <FeatureSection
                    title="Adaptive Lessons for Students or Employees"
                    icon={RotateRight}
                    description="Our AI will adapt the lesson to the student's needs, and explicitly incorporate science-based
                    learning strategies such as spaced repetition, active recall, scaffolding, interleaving, and self-explanation."
                    chipText="Coming Soon"
                    chipColor="#9e9e9e"
                  />
                </Grid>

                <WhyChooseSection
                  title="Why Choose Reasonote?"
                  benefits={[
                    "Save Time: Create lessons in minutes instead of hours",
                    "Personalized Learning: Tailor content to individual student or employee needs",
                    "Adaptive Content: AI adapts content based on student or employee performance",
                    "Analytics: Track student or employee progress and measure learning outcomes",
                  ]}
                />

                <Stack spacing={2} alignItems="center">
                  <Typography variant="h6" textAlign="center">
                    Transform Your Teaching Today
                  </Typography>
                  <Typography variant="body1" textAlign="center" sx={{ maxWidth: '600px', mb: 2 }}>
                    Stay ahead of the curve by using AI to create better learning experiences while 
                    saving hours of preparation time.
                  </Typography>
                  <TryNowButton text="Create Your First Lesson Now" link="/app/lessons/new" />
                </Stack>
              </Stack>
            </ExamplePageLayout>
          </Container>
        </div>
      </div>
    </AppLayout>
  );
} 