'use client'
import {useState} from "react";

import {MainMobileLayout} from "@/components/positioning/MainMobileLayout";
import MobileContentMain
  from "@/components/positioning/mobile/MobileContentMain";
import {
  Button,
  Card,
  CardContent,
  CircularProgress,
  Typography,
} from "@mui/material";

export default function Page() {
  const [resp, setResp] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('apkgFile', file);

    setLoading(true);
    try {
      const response = await fetch('/api/integrations/anki/ingest', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setResp(data.cards);
    } catch (error) {
      console.error('Error:', error);
      setResp(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainMobileLayout>
      <MobileContentMain>
        <h1>Upload Anki .apkg File</h1>
        <input type="file" accept=".apkg" onChange={handleFileUpload} />
        <Button onClick={handleSubmit} disabled={loading || !file}>
          {loading ? <CircularProgress size={24} /> : "Upload and Process"}
        </Button>
        <div>
          {resp && resp.length > 0 ? (
            resp.map((card: any) => (
              <Card key={card.id} variant="outlined" style={{ margin: '16px 0' }}>
                <CardContent>
                  <Typography variant="h6">Front</Typography>
                  <Typography>{card.front}</Typography>
                  <Typography variant="h6">Back</Typography>
                  <Typography>{card.back}</Typography>
                </CardContent>
              </Card>
            ))
          ) : (
            <Typography>No cards available</Typography>
          )}
        </div>
      </MobileContentMain>
    </MainMobileLayout>
  );
}
