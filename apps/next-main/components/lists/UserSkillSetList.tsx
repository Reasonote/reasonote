"use client";

import React, {useRef} from "react";

import {
  motion,
  useInView,
} from "framer-motion";
import {useRouter} from "next/navigation";

import {useUserSkills} from "@/clientOnly/hooks/useUserSkills";
import {UserSkillCard} from "@/components/cards/UserSkillCard";
import {Txt} from "@/components/typography/Txt";
import {
  Box,
  Grid,
  Skeleton,
  Stack,
} from "@mui/material";

import {SkillIcon} from "../icons/SkillIcon";

const SkillCardSkeleton = () => {
  return (
    <Stack spacing={1} sx={{ p: 2 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Skeleton variant="circular" width={40} height={40} />
        <Stack spacing={0.5} flex={1}>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
        </Stack>
      </Stack>
    </Stack>
  );
};

export const UserSkillSetList = () => {
  const { skills, loading, error } = useUserSkills();
  const router = useRouter();
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true });

  if (error) {
    return (
      <Stack spacing={3} width="100%" maxWidth={800} sx={{ mb: 4 }}>
        <Txt color="error" sx={{ textAlign: 'center', width: '100%' }}>
          Error loading skills
        </Txt>
      </Stack>
    );
  }

  return (
    <Stack width="100%" ref={containerRef}>
      <Stack spacing={2}>
        {!loading && skills.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: .5 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Txt 
                startIcon={<SkillIcon className="animate-draw-in-7s" />} 
                variant="h5" 
                fontWeight={'bold'} 
                sx={{ mb: 2 }}
              >
                Your Skills
              </Txt>
            </motion.div>

            <Box sx={{ maxHeight: "700px", overflow: "auto" }}>
              <Grid container spacing={2} p={.5}>
                {loading ? (
                  [...Array(4)].map((_, index) => (
                    <Grid item xs={12} sm={6} key={`skeleton-${index}`}>
                      <SkillCardSkeleton />
                    </Grid>
                  ))
                ) : (
                  skills.map((skill, index) => (
                    <Grid item xs={12} sm={6} key={skill.id}>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                        transition={{
                          duration: 0.5,
                          delay: index > 10 ? .25 : Math.min(index * 0.1, 1.0),
                          ease: "easeOut"
                        }}
                      >
                        <UserSkillCard
                          name={skill.name || "Unnamed Skill"}
                          emoji={skill.emoji}
                          lastStudied={skill.updatedDate ? new Date(skill.updatedDate) : undefined}
                          onClick={() => skill.id && router.push(`/app/skills/${skill.id}`)}
                        />
                      </motion.div>
                    </Grid>
                  ))
                )}
              </Grid>
            </Box>
          </motion.div>
        ) : null}
      </Stack>
    </Stack>
  );
};
