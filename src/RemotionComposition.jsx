"use client";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  getInputProps,
} from "remotion";

const RemotionComposition = () => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const { videoData } = getInputProps();
  
  const captions = videoData?.captionJson || [];
  const images = videoData?.image || [];
  const audioURL = videoData?.audioURL || "";
  const captionStyle = videoData?.caption_Style || {};

  // Duration calculation
  const totalDuration = Math.ceil((captions.at(-1)?.end || 5) * fps);
  const imageCount = images.length;
  const segmentDuration = totalDuration / imageCount;
  const overlapFrames = Math.floor(0.5 * fps);

  // Current caption calculation
  const currentTime = frame / fps;
  const currentCaption = captions.find(
    (c) => currentTime >= c.start && currentTime <= c.end
  )?.word;

  // Image animation parameters
  const getImageProps = (index) => {
    const sequenceStart = index * segmentDuration - overlapFrames;
    const sequenceEnd = sequenceStart + segmentDuration + overlapFrames * 2;
    
    return {
      opacity: interpolate(
        frame,
        [sequenceStart, sequenceStart + overlapFrames, sequenceEnd - overlapFrames, sequenceEnd],
        [0, 1, 1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      ),
      scale: interpolate(
        frame,
        [sequenceStart, sequenceEnd],
        [0.95, 1.05],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      ),
      from: Math.max(0, sequenceStart),
      duration: segmentDuration + overlapFrames * 2,
    };
  };

  return (
    <AbsoluteFill>
      {/* Image sequences with crossfade */}
      {images.map((img, index) => {
        const { opacity, scale, from, duration } = getImageProps(index);
        
        return (
          <Sequence key={index} from={from} durationInFrames={duration}>
            <Img
              src={img}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity,
                transform: `scale(${scale})`,
              }}
            />
          </Sequence>
        );
      })}

      {/* Caption display */}
      <AbsoluteFill style={{
        justifyContent: 'center',
        alignItems: 'center',
        bottom: '10%',
        textAlign: 'center',
        padding: '0 20%',
      }}>
        <h2 className={captionStyle} style={{
      
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          fontSize: '2.5em',
        }}>
          {currentCaption}
        </h2>
      </AbsoluteFill>

      {/* Audio handling */}
      {audioURL && <Audio src={audioURL} />}
    </AbsoluteFill>
  );
};

export default RemotionComposition;