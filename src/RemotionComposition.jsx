// src/index.js (Remotion component)
import { AbsoluteFill, Audio, Img, Sequence, useCurrentFrame, useVideoConfig, interpolate } from "remotion";

export const Main = () => {
  const { fps, width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const input = getInputProps();
  
  // Safe input parsing
  const {
    audio = '',
    captions = [],
    images = [],
    captionStyle = {}
  } = typeof input === 'object' ? input : {};

  // Duration calculation
  const totalDuration = Math.max(30, Math.ceil(
    (captions[captions.length - 1]?.end || 5) * fps
  ));

  return (
    <AbsoluteFill>
      {/* Image sequences */}
      {images.map((img, index) => {
        const start = (totalDuration / images.length) * index;
        const duration = totalDuration / images.length;
        
        return (
          <Sequence key={img} from={start} durationInFrames={duration}>
            <Img
              src={img}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: interpolate(frame, [start, start + 30], [0, 1]),
                transform: `scale(${interpolate(
                  frame, 
                  [start, start + duration],
                  [1, 1.05]
                )})`
              }}
            />
          </Sequence>
        );
      })}

      {/* Captions */}
      <AbsoluteFill style={{
        justifyContent: 'center',
        alignItems: 'center',
        bottom: '20%',
        ...captionStyle
      }}>
        <div style={{
          fontSize: '2.5em',
          textAlign: 'center',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
        }}>
          {captions.find(c => 
            (frame/fps) >= c.start && 
            (frame/fps) <= c.end
          )?.word}
        </div>
      </AbsoluteFill>

      {audio && <Audio src={audio} />}
    </AbsoluteFill>
  );
};