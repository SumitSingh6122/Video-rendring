import express from 'express';
import cors from 'cors';
import { bundle } from '@remotion/bundler';
import { renderMedia } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { v2 as cloudinary } from 'cloudinary';
import puppeteer from 'puppeteer'; 
import dotenv from 'dotenv';
dotenv.config();

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});


const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const outDir = path.resolve(process.cwd(), 'out');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Validate input middleware
const validateInput = (req, res, next) => {
  if (!req.body.inputProps?.videoData) {
    return res.status(400).json({
      error: "Invalid request format. Expected { inputProps: { videoData: {...} } }",
      example: {
        inputProps: {
          videoData: {
            audioURL: "string",
            captionJson: [{ start: 0, end: 2, word: "Hello" }],
            image: ["https://example.com/image.jpg"],
            CaptionStyle:"jjjjwjjwjw"
          }
        }
      }
    });
  }
  next();
};

app.post('/api/render', validateInput, async (req, res) => {
  let outputPath;
  try {
    const { inputProps } = req.body;
    const { videoData } = inputProps;
   
    console.log("Starting render with:", {
      audio: videoData.audioURL ? "Exists" : "Missing",
      captions: videoData.captionJson?.length || 0,
      images: videoData.image?.length || 0
    });
    process.env.PUPPETEER_EXECUTABLE_PATH = puppeteer.executablePath(); 

    // Bundle and render video
    const bundleLocation = await bundle(
      path.resolve(process.cwd(), "src", "index.js"),
      () => undefined,
      { webpackOverride: (config) => config }
    );

    const outputFilename = `${uuidv4()}.mp4`;
    outputPath = path.join(outDir, outputFilename);

    await renderMedia({
      serveUrl: bundleLocation,
      composition: {
        id: "MyVideo",
        width: 720,
        height: 1280,
        fps: 30,
        durationInFrames: Math.ceil(
          videoData.captionJson[videoData.captionJson.length - 1].end * 30
        )
      },
      codec: "h264",
      outputLocation: outputPath,
      inputProps: { videoData },
      chromiumOptions: {
        headless: true,
        disableWebSecurity: true
      },
      timeoutInMilliseconds: 1000000
    });
  
    // Upload to Cloudinary
    const cloudinaryResponse = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        outputPath,
        {
          resource_type: "video",
          folder: "rendered-videos",
          public_id: outputFilename.replace('.mp4', ''),
          overwrite: true,
          chunk_size: 6000000 
        },
        (error, result) => {
          if (error) reject(error);
          resolve(result);
        }
      );
    });

    // Cleanup local file
    fs.unlinkSync(outputPath);

    res.json({
      success: true,
      downloadUrl: cloudinaryResponse.secure_url,
      duration: cloudinaryResponse.duration,
      bytes: cloudinaryResponse.bytes
    });

  } catch (err) {
    // Cleanup on error
    if (outputPath && fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
    
    console.error('Render failed:', err);
    res.status(500).json({
      success: false,
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});