"use client";

import {useState} from "react";

import {MuiMarkdownDefault} from "@/components/markdown/MuiMarkdownDefault";
import {Txt} from "@/components/typography/Txt";
import {LocalOffer as TagIcon} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  InputAdornment,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
} from "@mui/material";

interface BlogPostFormProps {
  initialData?: {
    title: string;
    description: string | null;
    content: string;
    tags: string[];
  };
  onSubmit: (data: {
    title: string;
    description: string | null;
    content: string;
    tags: string[];
  }) => Promise<void>;
  submitButtonText: string;
  isSubmitting: boolean;
  onCancel: () => void;
}

export function BlogPostForm({
  initialData,
  onSubmit,
  submitButtonText,
  isSubmitting,
  onCancel,
}: BlogPostFormProps) {
  const [previewTab, setPreviewTab] = useState(0);
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [newTag, setNewTag] = useState("");

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTag.trim()) {
      e.preventDefault();
      if (!tags.includes(newTag.trim())) {
        setTags([...tags, newTag.trim()]);
      }
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      title,
      description,
      content,
      tags,
    });
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2,
        maxWidth: "48rem",
        mx: "auto"
      }}
    >
      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            fullWidth
          />

          <TextField
            label="Short Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
          />

          <Box>
            <TextField
              label="Tags"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={handleAddTag}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Txt variant="caption" color="text.secondary">
                      Press Enter to add
                    </Txt>
                  </InputAdornment>
                ),
              }}
            />
            {tags.length > 0 && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2, mt: 1 }}>
                <TagIcon color="action" />
                <Txt variant="body2" color="text.secondary">Tags:</Txt>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {tags.map((tag) => (
                            <Chip
                                key={tag}
                                label={tag}
                                size="small"
                                sx={{
                                    color: 'text.secondary',
                                }}
                            />
                    ))}
                </Box>
              </Stack>
            )}
          </Box>

          <Box>
            <Tabs
              value={previewTab}
              onChange={(_, newValue) => setPreviewTab(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
            >
              <Tab label="Write" />
              <Tab label="Preview" />
            </Tabs>

            {previewTab === 0 ? (
              <TextField
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                fullWidth
                multiline
                rows={15}
                placeholder="Write your blog post content here. You can use markdown formatting."
              />
            ) : (
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  minHeight: '400px',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                }}
              >
                <MuiMarkdownDefault>{content}</MuiMarkdownDefault>
              </Paper>
            )}
          </Box>

          <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : submitButtonText}
            </Button>
          </Box>
        </Stack>
      </form>
    </Paper>
  );
} 