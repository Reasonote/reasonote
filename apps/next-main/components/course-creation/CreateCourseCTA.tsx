import React, {useState} from "react";

import {
  BookOpen,
  Plus,
} from "lucide-react";

import {Txt} from "@/components/typography/Txt";
import {
  Button,
  Stack,
  useTheme,
} from "@mui/material";

import {CreateCourseModal} from "./CreateCourseModal";

export function CreateCourseCTA() {
  const theme = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Stack 
        alignItems="center" 
        gap={2}
        sx={{
          p: 4,
          textAlign: 'center',
          borderRadius: 2,
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          maxWidth: '48rem',
          width: '100%',
          mx: 'auto',
        }}
      >
        <Stack gap={1} alignItems="center">
          <BookOpen size={48} color={theme.palette.primary.main} />
          
          <Txt variant="h5" color="text.primary" sx={{ fontWeight: 600 }}>
            Create Your Course
          </Txt>
          
          <Txt variant="body1" color="text.secondary" sx={{ maxWidth: '24rem' }}>
            Upload documents, import Anki decks, or build content manually to create a personalized learning experience.
          </Txt>
        </Stack>

        <Button
          variant="contained"
          size="large"
          startIcon={<Plus size={20} />}
          onClick={handleOpenModal}
          sx={{
            py: 2,
            px: 4,
            borderRadius: 2,
            fontSize: '1.1rem',
            fontWeight: 600,
            textTransform: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transform: 'translateY(-1px)',
            },
            '&:active': {
              transform: 'translateY(0px)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            },
          }}
        >
          Get Started
        </Button>

        <Txt variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          Supports PDF, Word documents, text files, and Anki decks
        </Txt>
      </Stack>

      <CreateCourseModal 
        open={isModalOpen} 
        onClose={handleCloseModal}
      />
    </>
  );
} 