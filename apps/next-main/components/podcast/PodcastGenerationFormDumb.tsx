import React, {useState} from "react";

import {useRouter} from "next/navigation";

import {
  Add,
  Attachment,
  Delete,
  Podcasts,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {ReasonoteLicenseType} from "@reasonote/core";
import {typedUuidV4} from "@reasonote/lib-utils";

import {Txt} from "../typography/Txt";
import PodcastTypeSelector, {
  getPodcastTypeFriendlyTitle,
  getPodcastTypeIcon,
} from "./PodcastTypeSelector";
import {PodcastUpsellModal} from "./PodcastUpsellModal";

interface Document {
  id: string;
  name: string;
  body: string;
}

export interface PodcastGenerationFormDumbProps {
  topic: string;
  setTopic: (topic: string) => void;
  documents: Document[];
  setDocuments: (setter: ((old: Document[]) => Document[])) => void;
  numTurns: number | null;
  setNumTurns: (numTurns: number | null) => void;
  specialInstructions: string;
  setSpecialInstructions: (instructions: string) => void;
  podcastType: string;
  setPodcastType: (type: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  isOverLimit?: boolean;
  licenseType?: ReasonoteLicenseType;
  overrideComponentTitle?: string;
}

export function PodcastGenerationFormDumb({
  topic,
  setTopic,
  documents,
  setDocuments,
  numTurns,
  setNumTurns,
  specialInstructions,
  setSpecialInstructions,
  podcastType,
  setPodcastType,
  onGenerate,
  isLoading,
  isOverLimit,
  licenseType = 'Reasonote-Free',
  overrideComponentTitle,
}: PodcastGenerationFormDumbProps) {
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [isDocDialogOpen, setIsDocDialogOpen] = useState(false);
  const [isPodcastTypeDialogOpen, setIsPodcastTypeDialogOpen] = useState(false);
  const [isEditDocDialogOpen, setIsEditDocDialogOpen] = useState(false);

  const handleEditDoc = (doc: Document) => {
    setEditingDoc(doc);
    setIsEditDocDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditingDoc(null);
    setIsEditDocDialogOpen(false);
  };

  const handleSaveDoc = () => {
    if (editingDoc) {
      setDocuments(docs => docs.map(doc => doc.id === editingDoc.id ? editingDoc : doc));
    }
    handleCloseEditDialog();
  };

  const handleAddDoc = () => {
    const newDoc = { id: typedUuidV4('rsnpage'), name: `Document ${documents.length + 1}`, body: '' };
    setDocuments(docs => [...docs, newDoc]);
    handleEditDoc(newDoc);
  };

  const handleDeleteDoc = (docId: string) => {
    setDocuments(docs => docs.filter(doc => doc.id !== docId));
  };

  const handleGenerate = async () => {
    onGenerate?.();
  };

  const handleOpenPodcastTypeDialog = () => {
    setIsPodcastTypeDialogOpen(true);
  };

  const handleClosePodcastTypeDialog = () => {
    setIsPodcastTypeDialogOpen(false);
  };

  const handleOpenDocumentsDialog = () => {
    setIsDocDialogOpen(true);
  };

  const handleCloseDocumentsDialog = () => {
    setIsDocDialogOpen(false);
  };

  const router = useRouter();

  const textFieldsDisabled = isOverLimit || isLoading;
  const cardsDisabled = isOverLimit || isLoading;
  const generateIsDisabled = isOverLimit || (!topic || topic.trim() === '') || (!podcastType || podcastType.trim() === '');

  return (
    <Stack height="100%" maxHeight="100%" width="100%" sx={{ position: 'relative' }}>
      <Txt 
        startIcon={<Podcasts fontSize="medium" />} 
        variant="h5" 
        gutterBottom 
        stackOverrides={{alignItems: 'center', justifyContent: 'center'}}
      >
        {overrideComponentTitle || 'Podcast Generator'}
      </Txt>

      <PodcastUpsellModal isOverLimit={!!isOverLimit} licenseType={licenseType} />

      <Box sx={{ 
        opacity: isOverLimit ? 0.5 : 1,
        pointerEvents: isOverLimit ? 'none' : 'auto',
        transition: 'opacity 0.3s ease',
        filter: isOverLimit ? 'blur(2px)' : 'none',
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <TextField
          fullWidth
          label="Topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          margin="normal"
          InputProps={{
            style: { fontSize: '1.2rem' }
          }}
          InputLabelProps={{
            style: { fontSize: '1.2rem' }
          }}
          disabled={textFieldsDisabled}
        />
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Special Instructions (optional)"
          value={specialInstructions}
          onChange={(e) => setSpecialInstructions(e.target.value)}
          margin="normal"
          disabled={textFieldsDisabled}
        />
        <Stack direction="row" spacing={2} sx={{ my: 2 }}>
          <Card elevation={5} sx={{ 
            flexGrow: 1, 
            cursor: cardsDisabled ? 'not-allowed' : 'pointer',
            opacity: cardsDisabled ? 0.5 : 1,
          }} onClick={cardsDisabled ? undefined : handleOpenPodcastTypeDialog}>
            <CardContent sx={{ p: 1 }}>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Podcasts sx={{ mr: 1 }} fontSize="small"/> Podcast Type
              </Typography>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                {podcastType && (
                  <Box component="span" sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                    {getPodcastTypeIcon(podcastType)}
                  </Box>
                )}
                {podcastType ? getPodcastTypeFriendlyTitle(podcastType) : 'Not selected'}
              </Typography>
            </CardContent>
          </Card>
          <Card elevation={5} sx={{ 
            flexGrow: 1, 
            cursor: cardsDisabled ? 'not-allowed' : 'pointer',
            opacity: cardsDisabled ? 0.5 : 1,
          }} onClick={cardsDisabled ? undefined : handleOpenDocumentsDialog}>
            <CardContent sx={{ p: 1 }}>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Attachment sx={{ mr: 1 }} fontSize="small"/> References
              </Typography>
              {
                documents.length > 0 ? (
                  <Typography variant="h6">{documents.length} reference(s) attached</Typography>
                ) : (
                  <Typography variant="caption" color="text.secondary">No references attached. <br/>Click here to add references.</Typography>
                )
              }
            </CardContent>
          </Card>
        </Stack>
        <Button
          variant="contained"
          onClick={handleGenerate}
          disabled={generateIsDisabled}
          sx={{ 
            marginTop: 2,
            opacity: generateIsDisabled ? 0.5 : 1,
          }}
          size="large"
        >
          Generate Podcast
        </Button>

        {/* Podcast Type Dialog */}
        <Dialog open={isPodcastTypeDialogOpen} onClose={handleClosePodcastTypeDialog}>
          <DialogTitle>Select Podcast Type</DialogTitle>
          <DialogContent>
            <PodcastTypeSelector
              selectedType={podcastType}
              onSelectType={(type) => {
                setPodcastType(type);
                handleClosePodcastTypeDialog();
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClosePodcastTypeDialog}>Cancel</Button>
          </DialogActions>
        </Dialog>

        {/* Documents Dialog */}
        <Dialog open={isDocDialogOpen} onClose={handleCloseDocumentsDialog} maxWidth="md" fullWidth>
          <DialogTitle>Reference Documents</DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              {documents.map((doc) => (
                <Grid item xs={12} sm={6} md={4} key={doc.id}>
                  <Card sx={{ height: '100%', position: 'relative', p: 0 }}>
                    <CardActionArea onClick={() => handleEditDoc(doc)} sx={{ height: '100%' }}>
                      <CardContent sx={{ height: '100%', pr: 7 }}>
                        <Typography variant="subtitle2" gutterBottom>{doc.name}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                        }}>
                          {doc.body}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                    <IconButton
                      onClick={() => handleDeleteDoc(doc.id)}
                      sx={{
                        position: 'absolute',
                        top: 5,
                        right: 5,
                        '&:hover': { color: 'error.main' }
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </Card>
                </Grid>
              ))}
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ height: '100%', p: 0 }}>
                  <CardActionArea onClick={handleAddDoc} sx={{ height: '100%' }}>
                    <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <Add sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="subtitle2">Add New Document</Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDocumentsDialog}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Edit Document Dialog */}
        <Dialog open={isEditDocDialogOpen} onClose={handleCloseEditDialog}>
          <DialogTitle>Edit Document</DialogTitle>
          <DialogContent>
            {editingDoc && (
              <Box sx={{ pt: 2 }}>
                <TextField
                  fullWidth
                  label="Document Name"
                  value={editingDoc.name}
                  onChange={(e) => setEditingDoc({ ...editingDoc, name: e.target.value })}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Document Content"
                  value={editingDoc.body}
                  onChange={(e) => setEditingDoc({ ...editingDoc, body: e.target.value })}
                  margin="normal"
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEditDialog}>Cancel</Button>
            <Button onClick={handleSaveDoc}>Save</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Stack>
  );
}
