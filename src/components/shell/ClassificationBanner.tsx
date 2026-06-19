interface ClassificationBannerProps {
  variant?: "full" | "minimal";
  text?: string;
}

export function ClassificationBanner({
  variant = "full",
  text = "UNCLASSIFIED // OPEN-SOURCE DATA",
}: ClassificationBannerProps) {
  if (variant === "minimal") {
    return (
      <div className="flex justify-center py-0.5">
        <span className="text-[9px] font-semibold tracking-[0.12em] text-class-green/80">
          {text}
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-[18px] w-full shrink-0 items-center justify-center bg-class-green">
      <span className="text-[10px] font-bold tracking-[0.15em] text-black">
        {text}
      </span>
    </div>
  );
}
