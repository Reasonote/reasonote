import React from "react";

import {
  Diversity3,
  EmojiObjects,
  Group,
  Psychology,
  QuestionAnswer,
  School,
} from "@mui/icons-material";
import {
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Typography,
} from "@mui/material";

export interface PodcastType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactElement;
}

const podcastTypes: PodcastType[] = [
  {
    id: 'layman-expert',
    name: 'Expert Interview',
    description: 'A curious host asks questions to an expert in the field.',
    icon: <School fontSize="medium" />,
  },
  {
    id: 'two-enthusiasts',
    name: 'Two Enthusiasts',
    description: 'Two passionate individuals discuss and explore the topic together.',
    icon: <Group fontSize="medium" />,
  },
  {
    id: 'debate',
    name: 'Friendly Debate',
    description: 'Two hosts with different viewpoints discuss and debate the topic.',
    icon: <QuestionAnswer fontSize="medium" />,
  },
  {
    id: 'storytelling',
    name: 'Storytelling',
    description: 'One host narrates a story while the other provides commentary and asks questions.',
    icon: <EmojiObjects fontSize="medium" />,
  },
  {
    id: 'panel-discussion',
    name: 'Panel Discussion',
    description: 'Multiple experts discuss the topic from different angles.',
    icon: <Diversity3 fontSize="medium" />,
  },
  {
    id: 'socratic-dialogue',
    name: 'Socratic Dialogue',
    description: 'One host asks probing questions to guide the other through a topic.',
    icon: <Psychology fontSize="medium" />,
  },
];

export function getPodcastTypeFriendlyTitle(typeId: string): string {
  const podcastType = podcastTypes.find(type => type.id === typeId);
  return podcastType ? podcastType.name : 'Unknown Type';
}

export function getPodcastTypeIcon(typeId: string): React.ReactElement {
  const podcastType = podcastTypes.find(type => type.id === typeId);
  return podcastType ? podcastType.icon : <School fontSize="large" />;
}

interface PodcastTypeSelectorProps {
  selectedType: string;
  onSelectType: (typeId: string) => void;
}

export default function PodcastTypeSelector({ selectedType, onSelectType }: PodcastTypeSelectorProps) {
  return (
    <Grid container spacing={1} flexGrow={1} height="100%" overflow="auto">
      {podcastTypes.map((type) => (
        <Grid item xs={6} sm={4} md={4} key={type.id}>
          <Card 
            raised={selectedType === type.id}
            sx={{ 
              height: '100%',
              transition: 'all 0.3s',
              '&:hover': { transform: 'scale(1.05)' },
              p: 0
            }}
          >
            <CardActionArea onClick={() => onSelectType(type.id)} sx={{ height: '100%' }}>
              <CardContent sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                height: '100%',
                padding: '8px', // Reduced padding
              }}>
                {React.cloneElement(type.icon, { fontSize: "medium" })} {/* Smaller icon */}
                <Typography variant="subtitle2" component="div" align="center" sx={{ mt: 1, fontWeight: 'bold' }}>
                  {type.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 0.5 }}>
                  {type.description}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}