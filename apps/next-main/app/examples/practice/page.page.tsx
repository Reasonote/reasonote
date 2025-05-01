"use client";
import React from 'react';
import { Stack, Typography, Container, Grid } from '@mui/material';
import { 
  Waves, 
  QuestionAnswer,
  LocalActivity,
  Grade,

} from '@mui/icons-material';
import AppLayout from '../../app/layout.page';
import VoronoiBackgroundDefault from "@/components/backgrounds/VoronoiBackgroundDefault";
import { TryNowButton, FeatureSection, TestimonialSection, ExamplePageLayout } from '../utils';

export default function PracticeExample() {
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
                <Waves sx={{ fontSize: 60, color: 'primary.main' }} />
                
                <Typography variant="h4" textAlign="center" sx={{ mb: 2 }}>
                  Practice Mode
                </Typography>

                <Typography variant="body1" textAlign="center" sx={{ maxWidth: '800px', mb: 3 }}>
                  Spending a lot of time learning but not getting anywhere? Practice mode takes your learning to the next level
                  by combining scientifically-proven learning techniques such as active recall and spaced repetition with the ability
                  to interact with the AI. Just show up and let our algorithms do the rest.
                </Typography>

                <TryNowButton text="Start Learning Now" />
                
                <Grid container spacing={2} sx={{ 
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',                    // 1 column on mobile
                        md: 'repeat(2, 1fr)'          // 2 columns on medium and up
                    },
                    gap: 2
                }}>
                  <FeatureSection
                    title="Straight into the thick of it"
                    icon={QuestionAnswer}
                    description="The best way to learn is by practicing. The AI will immediately begin with some questions.
                    Don't be afraid to get things wrong and to ask questions. In fact that is the best
                    way to learn in practice mode."
                    imageSrc="/static/images/examples/practice/interface.png"
                    imageAlt="Practice Conversation Interface"
                  />

                  <FeatureSection
                    title="Continuous feedback"
                    icon={Grade}
                    description="Practicing a lot but can't figure out what you are doing wrong? Our AI will continuously
                    provide feedback on your progress and answer any questions you have."
                    imageSrc="/static/images/examples/practice/interface-2.png"
                    imageAlt="Feedback"
                  />

                  <FeatureSection
                    title="AI-Generated Activities"
                    icon={LocalActivity}
                    description="Bored of the same old learning activities? Our AI will generate activities to always keep you on your toes.
                    Choose from a wide range of activities, from simple activities like multiple choice questions to
                    complex activities like objective-based roleplay."
                    imageSrc="/static/images/examples/practice/activities.png"
                    imageAlt="AI-Generated Activities"
                  />

                  <FeatureSection
                    title="Advanced Activities"
                    icon={LocalActivity}
                    description="Feel like you are ready to achieve mastery? Try our most advanced and challenging activities:
                    Teach the AI and objective-based roleplay."
                    imageSrc="/static/images/examples/practice/advanced-activity.png"
                    imageAlt="Advanced Activity"
                  />
                </Grid>

                <TestimonialSection 
                  title="What Our Users Are Saying"
                  testimonials={[
                    {
                      quote: "I struggled to find a learning tool that adapted to my pace — most felt generic and left me either overwhelmed or under-challenged. Reasonote’s Practice Mode solves this by continually assessing my understanding and delivering personalized activities. Now, I can master topics deeply and retain what I learn effectively.",
                      author: "Yaashree H.",
                      role: "Environmental Researcher"
                    },
                    {
                      quote: "Practice mode effortlessly achieves what usually takes me a lot of work: to prepare a good set of exercises tailored to drill me on a given topic. I find it easy to consistently engage with the content, and my cognitive results are solid. Reasonote, as a learning tool, is an incredible powerful enabler of knowledge.",
                      author: "Alex S.",
                      role: "Computer Science Student"
                    },
                  ]}
                />

                <Stack spacing={2} alignItems="center">
                  <Typography variant="h6" textAlign="center">
                    Experience a New Way of Learning
                  </Typography>
                  <Typography variant="body1" textAlign="center" sx={{ maxWidth: '600px', mb: 2 }}>
                    Discover the joy of natural, curiosity-driven learning. Your journey to deeper understanding starts here.
                  </Typography>
                  <TryNowButton text="Start Learning Now" />
                </Stack>
              </Stack>
            </ExamplePageLayout>
          </Container>
        </div>
      </div>
    </AppLayout>
  );
} 