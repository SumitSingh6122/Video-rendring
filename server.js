// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import express from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
  secure: true
});


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Enhanced validation middleware
const validateInput = (req, res, next) => {
  const { audio, captions, images, captionStyle } = req.body;
  
  const errors = [];
  
  if (!audio?.match(/^(https?|data):/)) errors.push('Invalid audio URL format');
  if (!Array.isArray(captions) || captions.length === 0) errors.push('Invalid captions format');
  if (!Array.isArray(images) || images.length === 0) errors.push('Invalid images format');
  if (typeof captionStyle !== 'object') errors.push('Invalid caption style format');

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  
  next();
};
app.use(fileUpload({
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  abortOnLimit: true
}));

// Upload Endpoint
app.post('/upload', async (req, res) => {
  try {
    if (!req.files?.video) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const videoFile = req.files.video;
    
    const result = await cloudinary.uploader.upload(videoFile.tempFilePath, {
      resource_type: "video",
      folder: "renders",
      overwrite: true
    });

    res.json({
      success: true,
      url: result.secure_url,
      duration: result.duration,
      bytes: result.bytes
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ 
      error: 'Upload failed',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

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
          'Content-Type': 'application/json'
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

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('GitHub API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorBody
      });
      throw new Error(`GitHub API Error: ${response.status} ${response.statusText}`);
    }

    res.json({ 
      status: 'queued',
      message: 'Render job started successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    console.error('Server Error:', err);
    res.status(500).json({
      error: 'Render trigger failed',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));