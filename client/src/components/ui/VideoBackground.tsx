
import { cn } from "@/lib/utils";

interface VideoBackgroundProps {
  className?: string;
}

export function VideoBackground({ className }: VideoBackgroundProps) {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden" style={{ zIndex: -1 }}>
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover"
      >
        <source src="/videos/soccer1.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/40" />
    </div>
  );
}
