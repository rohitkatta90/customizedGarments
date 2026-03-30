"use client";

type Props = {
  text: string;
  className?: string;
};

/** Renders `**phrase**` in review copy as bold. */
export function ReviewComment({ text, className }: Props) {
  const segments = text.split(/(\*\*[^*]+\*\*)/g);

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (seg.startsWith("**") && seg.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-foreground">
              {seg.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{seg}</span>;
      })}
    </span>
  );
}
