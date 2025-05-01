"use client";
import React from "react";

import {motion} from "framer-motion";
import Link from "next/link";
import {useInView} from "react-intersection-observer";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {Footer} from "@/components/footer/Footer";
import {Txt} from "@/components/typography/Txt";
import {QuestionAnswer} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

interface TryNowButtonProps {
  text?: string;
  link?: string;
}

export const TryNowButton = ({ text = "Try Now", link = "/app" }: TryNowButtonProps) => (
  <Link href={link} style={{ textDecoration: 'none' }}>
    <Button 
      variant="contained" 
      size="large"
      sx={{ px: 4, py: 1.5 }}
    >
      {text}
    </Button>
  </Link>
);

interface FeatureSectionProps {
  title: string;
  icon: React.ComponentType<any>;
  description: string | React.ReactNode;
  imageSrc?: string;
  imageAlt?: string;
  mobileImageSrc?: string;
  chipText?: string;
  chipColor?: string;
}

export const FeatureSection = ({ 
  title, 
  icon, 
  description, 
  imageSrc, 
  imageAlt, 
  mobileImageSrc,
  chipText,
  chipColor,
}: FeatureSectionProps) => {
  const theme = useTheme();
  const isSmallDevice = useIsSmallDevice();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.5 }}
    >
      <Card sx={{ height: '100%', p: 3, position: 'relative' }}>
        {chipText && (
          <div 
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              backgroundColor: chipColor || "#2196f3",
              color: theme.palette.text.primary,
              fontSize: '10px',
              padding: '2px 8px',
              borderRadius: '12px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              zIndex: 1,
              transform: 'translate(-8px, 8px)',
              pointerEvents: 'none',
            }}
          >
            {chipText}
          </div>
        )}
        <Stack spacing={2}>
          <Txt variant="h6" startIcon={React.createElement(icon, { fontSize: 'small' })}>
            {title}
          </Txt>
          <Typography variant="body1" color="text.secondary">
            {description}
          </Typography>
          {imageSrc && (
            <Box 
              sx={{ 
                width: '100%',
                mt: 1,
                '& img': {
                  width: '100%',
                  height: 'auto',
                  maxHeight: '300px',
                  objectFit: 'contain',
                  borderRadius: 1
                }
              }}
            >
              <img
                src={isSmallDevice && mobileImageSrc ? mobileImageSrc : imageSrc}
                alt={imageAlt || title}
                loading="lazy"
              />
            </Box>
          )}
        </Stack>
      </Card>
    </motion.div>
  );
};

interface WhyChooseProps {
  title: string;
  benefits: string[];
}

export const WhyChooseSection = ({ title, benefits }: WhyChooseProps) => (
  <Card sx={{ 
    width: '100%', 
    p: 3, 
    backgroundColor: (theme) => theme.palette.background.paper,
    border: (theme) => `1px solid ${theme.palette.divider}`,
  }}>
    <Stack spacing={3}>
      <Stack 
        direction="row" 
        spacing={1} 
        alignItems="center"
        justifyContent="center"
      >
        <QuestionAnswer fontSize="small" color="primary" />
        <Typography 
          variant="h6" 
          sx={{ 
            color: (theme) => theme.palette.primary.main,
            textAlign: 'center',
          }}
        >
          {title}
        </Typography>
      </Stack>

      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',            // One column on mobile
          sm: 'repeat(2, 1fr)'  // Two columns on larger screens
        },
        gap: 2,
      }}>
        {benefits.map((benefit, index) => (
          <Stack 
            key={index} 
            direction="row" 
            spacing={2} 
            alignItems="flex-start"
            sx={{
              display: 'flex',
              justifyContent: 'center',
              '&:hover': {
                transform: 'translateX(8px)',
                transition: 'transform 0.2s ease-in-out',
              }
            }}
          >
            <Typography variant="body1" color={(theme) => theme.palette.text.secondary}>•</Typography>
            <Typography 
              variant="body1" 
              color={(theme) => theme.palette.text.secondary}
              sx={{ 
                flex: 1,
                maxWidth: '90%'  // Prevent text from stretching too wide
              }}
            >
              {benefit}
            </Typography>
          </Stack>
        ))}
      </Box>
    </Stack>
  </Card>
);

interface TestimonialProps {
  title: string;
  testimonials: Array<{
    quote: string;
    author: string;
    role?: string;
  }>;
}

export const TestimonialSection = ({ title, testimonials }: TestimonialProps) => (
  <Card sx={{ 
    width: '100%', 
    p: 3, 
    backgroundColor: (theme) => theme.palette.background.paper,
    border: (theme) => `1px solid ${theme.palette.divider}`,
  }}>
    <Stack spacing={3}>
      <Stack 
        direction="row" 
        spacing={1} 
        alignItems="center"
        justifyContent="center"
      >
        <Typography 
          variant="h6" 
          sx={{ 
            color: 'primary.main',
            textAlign: 'center',
          }}
        >
          {title}
        </Typography>
      </Stack>

      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)'
        },
        gap: 2,
      }}>
        {testimonials.map((testimonial, index) => (
          <Stack 
            key={index} 
            spacing={1}
            sx={{
              p: 2,
              borderRadius: 1,
              background: (theme) => `linear-gradient(145deg, ${theme.palette.background.paper}0D 0%, ${theme.palette.background.paper}00 100%)`,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                background: (theme) => `linear-gradient(145deg, ${theme.palette.background.paper}0D 0%, ${theme.palette.background.paper}00 100%)`,
              }
            }}
          >
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ 
                fontStyle: 'italic',
              }}
            >
              "{testimonial.quote}"
            </Typography>
            <Typography 
              variant="body2" 
              color={(theme) => theme.palette.text.primary}
              sx={{ fontWeight: 500 }}
            >
              {testimonial.author}
              {testimonial.role && (
                <Typography 
                  component="span" 
                  variant="body2" 
                  color={(theme) => theme.palette.text.secondary}
                >
                  , {testimonial.role}
                </Typography>
              )}
            </Typography>
          </Stack>
        ))}
      </Box>
    </Stack>
  </Card>
);

export const ExamplePageLayout = ({ children }: { children: React.ReactNode }) => (
  <Stack spacing={4}>
    {children}
    <Footer />
  </Stack>
);
