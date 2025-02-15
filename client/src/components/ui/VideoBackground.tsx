
import { cn } from "@/lib/utils";

interface VideoBackgroundProps {
  className?: string;
}

export function VideoBackground({ className }: VideoBackgroundProps) {
  const videos = [
    "/videos/soccer1.mp4",
    "/videos/soccer2.mp4"
  ];

  return (
    <div className={cn("fixed inset-0 overflow-hidden", className)} style={{ zIndex: -1 }}>
      <video
        autoPlay
        muted={true}
        loop
        playsInline
        preload="auto"
        className="absolute top-0 left-0 w-full h-full object-cover"
        style={{ minWidth: '100%', minHeight: '100%' }}
      >
        <source src={videos[0]} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/30" />
    </div>
  );
}
