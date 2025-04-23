
import { AbsoluteFill, Audio, Img, Sequence, useCurrentFrame, useVideoConfig, interpolate } from "remotion";

export const Main = () => {
  const { fps, width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const input = getInputProps();
  
  // Parse inputs directly from workflow
  const {
    audio = '',
    captions = [],
    images = [],
    captionStyle = {}
  } = input;

  // Duration calculation
  const totalDuration = Math.max(30, Math.ceil((captions.at(-1)?.end || 5) * fps));
  const imageCount = images.length;
  const segmentDuration = totalDuration / imageCount;

  // Current caption
  const currentTime = frame / fps;
  const currentCaption = captions.find(c => 
    currentTime >= c.start && currentTime <= c.end
  )?.word;

  return (
    <AbsoluteFill>
      {/* Image sequences with crossfade */}
      {images.map((img, index) => {
        const start = index * segmentDuration;
        const end = start + segmentDuration;
        
        return (
          <Sequence key={img} from={start} durationInFrames={end - start}>
            <Img
              src={img}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: interpolate(frame, [start, start + 30], [0, 1]),
                transform: `scale(${interpolate(frame, [start, end], [1, 1.05])})`
              }}
            />
          </Sequence>
        );
      })}

      {/* Caption display */}
      <AbsoluteFill style={{
        justifyContent: 'center',
        alignItems: 'center',
        bottom: '20%',
        padding: '0 10%',
        ...captionStyle
      }}>
        <div style={{
          fontSize: '2.5em',
          textAlign: 'center',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          lineHeight: 1.3
        }}>
          {currentCaption}
        </div>
      </AbsoluteFill>

      {/* Audio track */}
      {audio && <Audio src={audio} />}
    </AbsoluteFill>
  );
};