"use client";
import React from 'react';
import { Stack, Typography, Container, Grid } from '@mui/material';
import { 
  Headphones, 
  PlayArrow,
  Podcasts, 
  Share, 
  ChangeCircle
} from '@mui/icons-material';
import AppLayout from '../../app/layout.page';
import VoronoiBackgroundDefault from "@/components/backgrounds/VoronoiBackgroundDefault";
import { TryNowButton, FeatureSection, TestimonialSection, ExamplePageLayout } from '../utils';

export default function PodcastExample() {
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
                <Headphones sx={{ fontSize: 60, color: 'primary.main' }} />
                
                <Typography variant="h4" textAlign="center" sx={{ mb: 2 }}>
                  Podcasts 2.0
                </Typography>

                <Typography variant="body1" textAlign="center" sx={{ maxWidth: '800px', mb: 3 }}>
                  Tired of wasting hours searching for the right educational content? Our AI transforms any topic 
                  into personalized audio lessons in seconds. Learn during your commute, workout, or daily routine.
                </Typography>

                <TryNowButton text="Create Your First Podcast Now" />

                <Grid container spacing={2} sx={{ 
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',                    // 1 column on mobile
                        md: 'repeat(2, 1fr)'          // 2 columns on medium and up
                    },
                    gap: 2
                }}>
                  <FeatureSection
                    title="Podcast Creation Interface"
                    icon={PlayArrow}
                    description="Instead of spending hours searching for the right educational content, our AI will create
                    a podcast for you in seconds. Simply enter a topic, any additional information, and the type of podcast you want.
                    We'll do the rest."
                    imageSrc="/static/images/examples/podcast/creation-interface.png"
                    imageAlt="Podcast Creation Interface"
                  />

                  <FeatureSection
                    title="Main Podcast Interface"
                    icon={Podcasts}
                    description="Make the podcast your own. Listen to the podcast, jump to any point in the podcast,
                    adjust the speaking pace, and 'join the conversation'. You can also change the topic of the podcast, 
                    add a podcast to your queue, or share the podcast with the world."
                    imageSrc="/static/images/examples/podcast/interface.png"
                    imageAlt="Podcast Interface"
                  />

                  <FeatureSection
                    title="Change Topic or Add to Queue"
                    icon={ChangeCircle}
                    description="Has the podcast drifted off topic? Or are you interested in going deeper into something that was mentioned?
                    Change the topic of the podcast immediately, or add it to queue, just like that."
                    imageSrc="/static/images/examples/podcast/change-topic.png"
                    imageAlt="Change Topic"
                  />

                  <FeatureSection
                    title="Share Your Podcast"
                    icon={Share}
                    description="Having an 'Oh my god, my friend will love this podcast!' moment?
                    Make your podcast static and share it with the world."
                    imageSrc="/static/images/examples/podcast/share.png"
                    imageAlt="Share Podcast"
                  />
                </Grid>

                <TestimonialSection 
                  title="What Our Users Are Saying"
                  testimonials={[
                    {
                      quote: "As an auditory learner, I used to spend hours finding relevant podcasts and listening material. I found it really annoying that most podcasts seem to always be pushing a hidden agenda. With Reasonote's podcast mode, the content is always relevant and tailored to my interests!",
                      author: "Adi M.",
                      role: "Brand Developer"
                    },
                    {
                      quote: "I don't always have time to sit down to learn at my computer, but this application allows me to listen to generated podcasts on my phone! I find the 'expert interview' format to be particularly easy to follow as I'm running errands, doing chores, etc. Having the ability to pause the podcast and review a fully written transcript is especially helpful if I happened to miss something along the way!",
                      author: "Chris J.",
                      role: "Computer Science Major"
                    },
                  ]}
                />

                <Stack spacing={2} alignItems="center">
                  <Typography variant="h6" textAlign="center">
                    Start Your Learning Journey Today
                  </Typography>
                  <Typography variant="body1" textAlign="center" sx={{ maxWidth: '600px', mb: 2 }}>
                    Transform your daily routines into productive learning sessions.
                  </Typography>
                  <TryNowButton text="Create Your First Podcast Now" />
                </Stack>
              </Stack>
            </ExamplePageLayout>
          </Container>
        </div>
      </div>
    </AppLayout>
  );
}