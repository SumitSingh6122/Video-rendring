import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Input validation middleware
const validateInput = (req, res, next) => {
  const { audio, captions, images, captionStyle } = req.body;
  
  if (!audio || !captions || !images || !captionStyle) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  if (!Array.isArray(captions) || captions.length === 0) {
    return res.status(400).json({ error: 'Captions must be a non-empty array' });
  }
  
  if (!Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ error: 'Images must be a non-empty array' });
  }
  
  next();
};

app.post('/trigger-render', validateInput, async (req, res) => {
  try {
    const { audio, captions, images, captionStyle } = req.body;

    const response = await fetch(
      `https://api.github.com/repos/${process.env.GITHUB_USER}/${process.env.GITHUB_REPO}/actions/workflows/render.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            audio,
            captions: JSON.stringify(captions),
            images: JSON.stringify(images),
            captionStyle: JSON.stringify(captionStyle)
          }
        }),
      }
    );

    if (!response.ok) throw new Error('GitHub API error');
    res.json({ status: 'queued', id: Date.now() });
    
  } catch (err) {
    console.error('Trigger error:', err);
    res.status(500).json({ 
      error: 'Failed to queue render',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));