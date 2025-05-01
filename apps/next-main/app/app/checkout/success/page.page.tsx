"use client";
import {
  useEffect,
  useState,
} from "react";

import {useRouter} from "next/navigation";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HomeIcon from "@mui/icons-material/Home";
import Twitter from "@mui/icons-material/Twitter";
import {
  Box,
  Button,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import FullCenter from "../../../../components/positioning/FullCenter";

export default function CheckoutSuccess() {
  const router = useRouter();
  const [catGifUrl, setCatGifUrl] = useState<string | null>("https://giphy.com/embed/axdG5dnKJ9MtO");

  useEffect(() => {
    fetchCatGif();
  }, []);

  const fetchCatGif = async () => {
    // try {
    //   const response = await fetch(
    //     `https://api.giphy.com/v1/gifs/random?api_key=4QGGMNyOksNw5kHzQwg3spw8Df46DYIR&tag=cat+hug&rating=g`
    //   );
    //   const data = await response.json();
    //   setCatGifUrl(data.data.images.fixed_height.url);
    // } catch (error) {
    //   console.error("Error fetching cat GIF:", error);
    // }
  };

  const tweetText = encodeURIComponent("I just signed up for @reasonote!🎉\n Check it out at https://reasonote.com ");
  const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;

  return (
    <FullCenter>
      <Paper elevation={15}>
        <Stack padding={"24px"} spacing={2} alignItems="center">
          <CheckCircleIcon color="success" sx={{ fontSize: 64 }} />
          <Typography variant="h4" align="center">Checkout Success!</Typography>
          <Typography variant="body1" align="center">💖 Thank you for your purchase.</Typography>
          <Box width="240px" height="180px" position="relative" sx={{scale: 0.5}} display="flex" flexDirection="column" justifyContent="center" alignItems="center">
            <iframe src="https://giphy.com/embed/axdG5dnKJ9MtO" width="240" height="180" frameBorder="0" className="giphy-embed" allowFullScreen></iframe><p style={{fontSize: "8px"}}><a href="https://giphy.com/gifs/my-cat-axdG5dnKJ9MtO">via GIPHY</a></p>
          </Box>
          <Typography variant="body1" align="center">
            We hope you enjoy using Reasonote!
          </Typography>
          
          <Box display="flex" justifyContent="center" gap={2}>
            <Button
              variant="outlined"
              startIcon={<Twitter/>}
              href={tweetUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Share on Twitter
            </Button>
          </Box>
          <Button
            variant="contained"
            startIcon={<HomeIcon />}
            onClick={() => router.push('/app')}
          >
            Back to Home
          </Button>
        </Stack>
      </Paper>
    </FullCenter>
  );
}
