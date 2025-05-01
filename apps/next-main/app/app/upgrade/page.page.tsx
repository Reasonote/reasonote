"use client";
import React, {
  useEffect,
  useState,
} from "react";

import {useRouter} from "next/navigation";
import posthog from "posthog-js";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {useReasonoteLicense} from "@/clientOnly/hooks/useReasonoteLicense";
import VoronoiBackgroundDefault
  from "@/components/backgrounds/VoronoiBackgroundDefault";
import {ScreenLoader} from "@/components/loaders/ScreenLoader";
import FullCenter from "@/components/positioning/FullCenter";
import {
  Check,
  CheckBox,
  DevicesOther,
  ShoppingCart,
  Star,
  Update,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from "@mui/material";
import {
  ReasonoteFeatureDescriptions,
  ReasonoteLicensePlans,
} from "@reasonote/core";

import {useStripeCheckoutBrowser} from "../../../utils/stripe/checkoutBrowser";

function UpgradePanel({
  badgeType,
  costNode,
  featureNode,
  elevation,
  buyButtonNode,
  cardPropOverrides
}: {
  badgeType: React.ReactNode;
  costNode: React.ReactNode;
  featureNode: React.ReactNode;
  elevation: number;
  buyButtonNode: React.ReactNode;
  cardPropOverrides?: any;
}) {
  const isSmallDevice = useIsSmallDevice()
  return (
    <Card
      elevation={elevation}
      {...cardPropOverrides}
      sx={{
        height: "auto",
        width: "100%",
        borderRadius: "16px",
        transition: "transform 0.3s ease-in-out",
        ...cardPropOverrides?.sx,
        "&:hover": {
          transform: "translateY(-10px)",
          ...cardPropOverrides?.sx?.['&:hover'],
        },
      }}
    >
      <CardContent>
        <Stack alignItems="center">
          <Stack direction="row" alignItems="center" gap={isSmallDevice ? 1 : 2}>
            <Typography variant={'h6'}>
              <b>Reasonote</b>
            </Typography>
            {badgeType}
            <Divider orientation="vertical" flexItem />
            <div style={{ justifySelf: "flex-end" }}>{costNode}</div>
          </Stack>
          <Typography variant="h6">{featureNode}</Typography>
          <Stack
            direction="row"
            justifyItems={"center"}
            justifyContent={"center"}
            alignItems={"center"}
            alignContent={"center"}
          >
            {buyButtonNode}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function Section({ title, children }) {
  return (
    <Box display='flex' flexDirection='column' width="100%" alignSelf={'center'} maxWidth="800px" alignItems="center" sx={{ p: 0, m: 0 }}>
      <Typography variant="h4" textAlign="center" marginBottom={3}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function BenefitItem({ icon, title, description }) {
  const isSmallDevice = useIsSmallDevice()
  const theme = useTheme();
  const iconIsImage = React.isValidElement(icon) && icon.type === 'img';

  return (
    <Box textAlign="center" display="flex" flexDirection="column" alignItems="center" sx={{ p: 0 }}>
      <Box maxWidth="80%" height="250px" alignItems="center" justifyContent="center" display="flex">
        {iconIsImage ? icon : React.createElement(icon, { style: { fontSize: isSmallDevice ? 32 : 48, color: theme.palette.primary.main } })}
      </Box>
      <Typography variant="h6" marginY={2} fontWeight="bold">
        {title}
      </Typography>
      <Typography variant="body2">{description}</Typography>
    </Box>
  );
}

function LevelUpSection() {
  const isSmallDevice = useIsSmallDevice()

  return (
    <Card elevation={5} sx={{ width: '100%', borderRadius: '16px', pb: 4 }}>
      <Stack sx={{ alignItems: 'center', width: '100%' }}>
        <Box sx={{ 
          position: 'relative', 
          width: isSmallDevice ? '95%' : '80%', 
          height: isSmallDevice ? 300 : 300,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          mt: 4,
          mb: isSmallDevice ? 2 : 4
        }}>
          <img 
            src="/images/illustrations/undraw_explore_re_8l4v.svg"
            alt="Join our community"
            style={{ 
              maxWidth: isSmallDevice ? '80%' : '100%',
              maxHeight: '100%',
              width: '100%',
              objectFit: 'contain'
            }}
          />
        </Box>
        <Stack alignItems="center" gap={2}>
          <Typography variant="h4" fontWeight="bold" textAlign="center">Level up with Reasonote</Typography>
          <Typography variant="body1" textAlign="center" marginBottom={4}>
            Reasonote offers multiple learning approaches to suit your style and preferences.
          </Typography>
        </Stack>
        <Stack width="100%">
          <Grid 
            container 
            width="100%" 
            justifyContent="center" 
            justifyItems="center" 
            gap={isSmallDevice ? 8 : 3} 
            alignContent={'center'} 
            alignItems="center"
          >
            <Grid item display="flex" xs={12} sm={5.5} justifyContent="center" alignItems="center">
              <BenefitItem
                icon={<img src="/images/illustrations/undraw_adventure_map_hnin.svg" alt="Learn efficiently" style={{ height: '100%' }} />}
                title="Learn efficiently"
                description="Master concepts faster with our AI-powered learning system"
              />
            </Grid>
            <Grid item display="flex" xs={12} sm={5.5}  justifyContent="center" alignItems="center">
              <BenefitItem
                icon={<img src="/images/illustrations/undraw_career_development_re_sv91.svg" alt="Adaptive learning" style={{ height: '100%' }} />}
                title="Adaptive learning"
                description="Personalized lessons that adapt to your progress and learning style"
              />
            </Grid>
            <Grid item display="flex" xs={12} sm={5.5} justifyContent="center" alignItems="center">
              <BenefitItem
                icon={<img src="/images/illustrations/undraw_walking_outside_re_56xo.svg" alt="Learn anywhere" style={{ height: '100%' }} />}
                title="Learn anywhere"
                description="Access your lessons on any device, anytime, anywhere"
              />
            </Grid>
            <Grid item display="flex" xs={12} sm={5.5}  justifyContent="center" alignItems="center">
              <BenefitItem
                icon={<img src="/images/illustrations/undraw_environmental_study_re_q4q8.svg" alt="Active Learning" style={{ height: '100%' }} />}
                title="Active Learning" 
                description="Engage with our interactive classroom and AI-generated lessons for hands-on learning experiences."
              />
            </Grid>
            <Grid item display="flex" xs={12} sm={5.5} justifyContent="center" alignItems="center">
              <BenefitItem
                icon={<img src="/images/illustrations/audio_conversation.svg" alt="Passive Learning" style={{ height: '100%' }} />}
                title="Passive Learning"
                description="Listen to AI-generated podcasts on your chosen topics, perfect for learning on-the-go."
              />
            </Grid>
            <Grid item display="flex" xs={12} sm={5.5}  justifyContent="center" alignItems="center">
              <BenefitItem
                icon={<img src="/images/illustrations/undraw_chat_bot_re_e2gj.svg" alt="Conversational Learning" style={{ height: '100%' }} />}
                title="Conversational Learning"
                description="Chat with our AI tutor to ask questions and deepen your understanding through dialogue."
              />
            </Grid>
            <Grid item display="flex" xs={12} sm={5.5}  justifyContent="center" alignItems="center">
              <BenefitItem
                icon={<img src="/images/illustrations/true_friends.svg" alt="Roleplay Activities" style={{ height: '100%' }} />}
                title="Roleplay Activities"
                description="Immerse yourself in interactive scenarios to practice real-world applications."
              />
            </Grid>
            <Grid item display="flex" xs={12} sm={5.5} justifyContent="center" alignItems="center">
              <BenefitItem
                icon={<img src="/images/illustrations/undraw_educator_re_ju47.svg" alt="Teach-The-AI" style={{ height: '100%' }} />}
                title="Teach-The-AI"
                description="Solidify your understanding by explaining concepts to our AI."
              />
            </Grid>
            <Grid item display="flex" xs={12} sm={5.5} justifyContent="center" alignItems="center">
              <BenefitItem
                icon={<img src="/images/illustrations/undraw_professor_re_mj1s.svg" alt="Visual Learning" style={{ height: '100%' }} />}
                title="Visual Learning"
                description="Enhance comprehension with AI-generated visual diagrams."
              />
            </Grid>
          </Grid>
        </Stack>
      </Stack>
    </Card>
  );
}

export default function Page() {
  const isSmallDevice = useIsSmallDevice()
  const theme = useTheme();
  const { stripeCheckoutBrowser } = useStripeCheckoutBrowser();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = (lookupKey: string) => {
    // Set loader
    setIsLoading(true);

    // Use the new Elements checkout page
    router.push(`/app/stripe/elements-checkout?lookupKey=${lookupKey}`);
  }

  const {data: subData} = useReasonoteLicense();
  const licenseType = subData?.currentPlan.type;

  useEffect(() => {
    posthog.capture('upgrade_view', {}, { send_instantly: true });
  }, []);

  const hasFreePlan = licenseType === "Reasonote-Free" || licenseType === "Reasonote-Basic";
  const hasBasicPlan = licenseType === "Reasonote-Basic";

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100dvh', overflow: 'hidden' }}>
      <VoronoiBackgroundDefault />
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 1,
        overflowY: 'auto',
        background: theme.palette.background.default,
        backdropFilter: 'blur(2px)',
      }}>
        {isLoading ? (
          <FullCenter>
            <ScreenLoader
              icon={<ShoppingCart />}
              title="Preparing Your Checkout"
              subtitle="This should only take a few seconds..."
            />
          </FullCenter>
        ) : (
          <Stack gap={isSmallDevice ? 1 : 4} alignItems="center" justifyItems="center" padding={isSmallDevice ? 2 : 4} width="100%" maxWidth="1000px">
            {
              isSmallDevice ? (
                null
              ) : (
                <Box maxWidth="100%" height={isSmallDevice ? '100px' : '300px'} alignItems="center" justifyContent="center" display="flex">
                  <img src="/images/illustrations/undraw_cabin_hkfr.svg" alt="True Friends" style={{ height: '300px' }} />
                </Box>
              )
            }
            

            {/* Pricing cards */}
            <Grid container justifyContent="center" gap={2} alignItems="start" justifyItems="center" mt={isSmallDevice ? 12 : 3} mb={isSmallDevice ? 12 : 3}>
              <Grid item xs={12} minWidth="350px" alignItems="start">
                {/* <UpgradePanel
                  elevation={hasFreePlan ? 3 : 10}
                  badgeType={<Chip label={<>Free</>} size={isSmallDevice ? "small" : "medium"} />}
                  costNode={<Typography variant="h6">Free</Typography>}
                  featureNode={null}
                  buyButtonNode={
                    <Button disabled>
                      <Check />
                      Subscribed
                    </Button>
                  }
                  cardPropOverrides={{
                    sx: {
                      background: 'linear-gradient(141deg, #555, #999)',
                      opacity: 0.8,
                      height: 'fit-content'
                    }
                  }}
                /> */}
              </Grid>
              <Typography variant={isSmallDevice ? 'h6' : 'h4'} fontWeight="bold" textAlign="center" mt={0}>
              Unlock the full learning experience
            </Typography>
              <Grid item xs={11} md={8} minWidth="350px" alignItems="center">
                <div style={{
                  zoom: isSmallDevice ? 1.2 : 1.5
                }}>
                <UpgradePanel
                  cardPropOverrides={{
                    sx: {
                      background: 'linear-gradient(141deg, #1A6F5F, #AAFAAA)',
                      zIndex: 1,
                      border: `2px solid ${theme.palette.text.primary}`,
                      '&:hover': {
                        border: `3px solid ${theme.palette.text.primary}`,
                        cursor: 'pointer',
                      }
                    },
                    onClick: () => {
                      const lookupKey = process.env.NEXT_PUBLIC_REASONOTE_BASIC_MONTHLY_DEFAULT_LOOKUP_KEY!;
                      if (lookupKey) {
                        handleCheckout(lookupKey);
                      } else {
                        console.error('No lookup key found for Reasonote Basic Monthly Plan');
                      }
                    }
                  }}
                  elevation={hasBasicPlan ? 3 : 10}
                  badgeType={<Chip color="primary" label={<>Basic</>} size={isSmallDevice ? "small" : "medium"} />}
                  costNode={
                    <Stack>
                      <Typography variant="body1" fontWeight={'bold'}>7 Days Free</Typography>
                      <Typography variant="body2">Then $14 / month</Typography>
                    </Stack>
                  }
                  featureNode={
                    <List>
                      {/* {basicFeatures.map((feature, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={feature} />
                    </ListItem>
                  ))} */}
                    </List>
                  }
                  buyButtonNode={
                    hasBasicPlan ? (
                      <Button disabled>
                        <Check />
                        Subscribed
                      </Button>
                    ) : (
                      <Stack gap={2}>
                        <Button
                          variant={"contained"}
                          color="primary"
                          onClick={() => {
                            const lookupKey = process.env.NEXT_PUBLIC_REASONOTE_BASIC_MONTHLY_DEFAULT_LOOKUP_KEY!;
                            if (lookupKey) {
                              handleCheckout(lookupKey);
                            } else {
                              console.error('No lookup key found for Reasonote Basic Monthly Plan');
                            }
                          }}
                          sx={{
                            filter: "brightness(125%)",
                          }}
                        >
                          <b>Try Basic</b>
                        </Button>
                      </Stack>
                    )
                  }
                />
                </div>
              </Grid>
            </Grid>

            {/* Level up with Reasonote section */}
            <LevelUpSection />

            {/* Features comparison */}
            <Section title="Compare plans">
              <TableContainer component={Paper} sx={{ maxWidth: '100%', overflowX: 'auto' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: theme.palette.gray.dark, color: theme.palette.text.primary }}>Feature</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: theme.palette.gray.dark, color: theme.palette.text.primary }}>Free</TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          cursor: 'pointer', fontWeight: 'bold', backgroundColor: theme.palette.primary.main, color: theme.palette.text.primary,

                          '&:hover': {
                            backgroundColor: theme.palette.primary.light,
                          }
                        }}
                        onClick={() => {
                          const lookupKey = process.env.NEXT_PUBLIC_REASONOTE_BASIC_MONTHLY_DEFAULT_LOOKUP_KEY!;
                          if (lookupKey) {
                            handleCheckout(lookupKey);
                          } else {
                            console.error('No lookup key found for Reasonote Basic Monthly Plan');
                          }
                        }}
                      >Basic</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(ReasonoteFeatureDescriptions).map(([featureId, featureDesc]) => {
                      const freeFeature = ReasonoteLicensePlans['Reasonote-Free'].features[featureId];
                      const basicFeature = ReasonoteLicensePlans['Reasonote-Basic'].features[featureId];
                      
                      // Skip if neither plan has this feature
                      if (!freeFeature && !basicFeature) return null;

                      return (
                        <TableRow key={featureId}>
                          <TableCell sx={{ fontWeight: 'bold' }}>
                            {featureDesc.name}
                          </TableCell>
                          <TableCell align="center">
                            {freeFeature?.limit ? 
                              `${freeFeature.limit.perPeriod} / ${freeFeature.limit.period}` 
                              : freeFeature ? <CheckBox color="success" /> : '-'}
                          </TableCell>
                          <TableCell align="center">
                            {basicFeature?.limit ? 
                              basicFeature.limit.isUnlimitedPerPeriod ? 
                                '∞' 
                                : `${basicFeature.limit.perPeriod} / ${basicFeature.limit.period}`
                              : basicFeature ? <CheckBox color="success" /> : '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Section>

            {/* Additional selling points */}
            <Section title="Supercharge your learning">
              <Stack sx={{ width: '30vw' }}>
                <List sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <ListItem sx={{ justifyContent: 'center', minWidth: '300px' }}>
                    <ListItemIcon><Star color="primary" /></ListItemIcon>
                    <ListItemText primary="Courses made just for you." />
                  </ListItem>
                  <ListItem sx={{ justifyContent: 'center', minWidth: '300px' }}>
                    <ListItemIcon><Update color="primary" /></ListItemIcon>
                    <ListItemText primary="New content types added regularly." />
                  </ListItem>
                  <ListItem sx={{ justifyContent: 'center', minWidth: '300px' }}>
                    <ListItemIcon><DevicesOther color="primary" /></ListItemIcon>
                    <ListItemText primary="One subscription across all devices" />
                  </ListItem>
                </List>
              </Stack>
            </Section>

            {/* Call to action */}
            <Button
              variant="contained"
              size="large"
              onClick={() => {
                const lookupKey = process.env.NEXT_PUBLIC_REASONOTE_BASIC_MONTHLY_DEFAULT_LOOKUP_KEY!;
                if (lookupKey) {
                  handleCheckout(lookupKey);
                } else {
                  console.error('No lookup key found for Reasonote Basic Monthly Plan');
                }
              }}
            >
              Get started now
            </Button>
          </Stack>
        )}
      </div>
    </div>
  );
}
