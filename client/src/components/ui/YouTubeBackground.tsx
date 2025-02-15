
import { cn } from "@/lib/utils";

interface YouTubeBackgroundProps {
  className?: string;
  videoId?: string;
}

export function YouTubeBackground({
  className,
  videoId = "OdObDXBzNYk", // Default video ID
}: YouTubeBackgroundProps) {
  return (
    <div className={cn("absolute inset-0 -z-10 overflow-hidden", className)}>
      <iframe
        className="absolute top-1/2 left-1/2 w-[100vw] h-[56.25vw] min-h-screen min-w-[177.77vh] -translate-x-1/2 -translate-y-1/2"
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&playsinline=1&modestbranding=1&showinfo=0&rel=0&enablejsapi=1&origin=${window.location.origin}&version=3&iv_load_policy=3&fs=0`}
        title="Background Video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        frameBorder="0"
        allowFullScreen
      />
      <div className="absolute inset-0 bg-black/40" />
    </div>
  );
}
