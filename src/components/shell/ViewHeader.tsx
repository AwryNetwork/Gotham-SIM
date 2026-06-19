import { ClassificationBanner } from "./ClassificationBanner";

interface ViewHeaderProps {
  title: string;
  subtitle?: string;
  classificationText?: string;
}

export function ViewHeader({ title, subtitle, classificationText }: ViewHeaderProps) {
  return (
    <div className="border-b border-border bg-bg-panel px-5 py-3">
      <ClassificationBanner variant="minimal" text={classificationText} />
      <h1 className="text-sm font-semibold tracking-wide text-text-primary">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-0.5 text-xs text-text-secondary">{subtitle}</p>
      )}
    </div>
  );
}
