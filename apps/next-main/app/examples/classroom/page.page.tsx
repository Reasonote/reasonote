"use client";
import React from 'react';
import { Stack, Typography, Container, Grid } from '@mui/material';
import { School, Timer, Chat, Assignment, AccountTree } from '@mui/icons-material';
import AppLayout from '../../app/layout.page';
import VoronoiBackgroundDefault from "@/components/backgrounds/VoronoiBackgroundDefault";
import { TryNowButton, FeatureSection, TestimonialSection, ExamplePageLayout } from '../utils';

export default function ClassroomExample() {
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
                  AI Classroom
                </Typography>

                <Typography variant="body1" textAlign="center" sx={{ maxWidth: '800px', mb: 3 }}>
                  Struggling to find quality tutoring that fits your schedule and budget? Our AI classroom 
                  provides instant, personalized teaching exactly when you need it. Master any subject with 
                  interactive lessons tailored to your learning style.
                </Typography>

                <TryNowButton text="Enter Classroom Now" />

                <Grid container spacing={2} sx={{ 
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',                    // 1 column on mobile
                        md: 'repeat(2, 1fr)'          // 2 columns on medium and up
                    },
                    gap: 2
                }}>
                  <FeatureSection
                    title="Skill Tree Navigation"
                    icon={AccountTree}
                    description="Don't know where you are or where you're going? Our AI classroom will help you map out 
                    the skill tree and find the best path to your goals. It sees the big picture and puts your learning 
                    into context."
                    imageSrc="/static/images/examples/classroom/skill-tree.png"
                    imageAlt="Skill Tree"
                  />

                  <FeatureSection
                    title="Interactive Learning Experience"
                    icon={Chat}
                    description="Tired of having to scour the internet for hours to find an explanation that resonates with you? 
                    Get instant answers to your questions and receive step-by-step explanations. Our AI adapts 
                    its teaching style to match how you learn best, ensuring you truly understand each concept."
                    imageSrc="/static/images/examples/classroom/chat.png"
                    imageAlt="Interactive Discussion Example"
                  />

                  <FeatureSection
                    title="Practice Exercises"
                    icon={Assignment}
                    description="Learning happens by doing, not just by reading. This is a core part of the Reasonote classroom. 
                    The AI generates personalized practice problems and provides immediate feedback on your answers.
                    We have a wide range of activities, from simple to complex, to help you master any subject."
                    imageSrc="/static/images/examples/classroom/exercises.png"
                    imageAlt="Practice Exercise Example"
                  />

                  <FeatureSection
                    title="Progress Tracking"
                    icon={Timer}
                    description="Don't know how you're doing? Monitor your learning progress in real-time. The system tracks your understanding
                    of different concepts and adjusts the curriculum accordingly. You can see your progress and get feedback on your answers."
                    imageSrc="/static/images/examples/classroom/progress.png"
                    imageAlt="Progress Tracking Dashboard"
                  />
                </Grid>

                <TestimonialSection 
                  title="What Our Users Are Saying"
                  testimonials={[
                    {
                      quote: "I struggle to complete online courses, losing interest when it's not exactly what I want.  Reasonote lets me be as ADHD as I want with my learning.  I can dive into anything I’m curious about, combining topics and customizing their applicability to my life, goals, and interests. The lessons encourage me to engage more deeply than I would just reading about a random topic, and features like Teach the AI challenge the depth of my understanding.",
                      author: "Jordan K.",
                      role: "Social Worker"
                    },
                    {
                      quote: "Being in the early stages of pursuing a CS degree, I am always on the lookout for great resources to supplement the lessons that I am being taught in my classes. Reasonote helped me take a deep dive on figuring out binary addition and introduced me to the concept of Big O notation. The branching lesson opportunities that Reasonote provides create a sort of rabbit-hole of learning that never loses sight of what I signed on to study.",
                      author: "Chris J.",
                      role: "Computer Science Major"
                    },
                  ]}
                />


                <Stack spacing={2} alignItems="center">
                  <Typography variant="h6" textAlign="center">
                    Transform How You Learn Today
                  </Typography>
                  <Typography variant="body1" textAlign="center" sx={{ maxWidth: '600px', mb: 2 }}>
                    Discover a better way to learn. Your personal AI teacher is always ready to help you succeed.
                  </Typography>
                  <TryNowButton text="Enter Classroom Now" />
                </Stack>
              </Stack>
            </ExamplePageLayout>
          </Container>
        </div>
      </div>
    </AppLayout>
  );
}
