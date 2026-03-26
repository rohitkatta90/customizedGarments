type Props = {
  rating: number;
  className?: string;
  size?: "sm" | "md";
  /** Use `{{n}}` for the star count, e.g. "{{n}} out of 5 stars" */
  ariaLabelTemplate?: string;
};

export function StarRating({
  rating,
  className = "",
  size = "md",
  ariaLabelTemplate = "{{n}} out of 5 stars",
}: Props) {
  const star = size === "sm" ? "text-sm" : "text-base";
  const full = Math.round(Math.min(5, Math.max(0, rating)));
  const aria = ariaLabelTemplate.replace("{{n}}", String(full));
  return (
    <span className={`inline-flex text-amber-500 ${star} ${className}`} aria-label={aria}>
      {"★★★★★".split("").map((_, i) => (
        <span key={i} className={i < full ? "opacity-100" : "opacity-20"}>
          ★
        </span>
      ))}
    </span>
  );
}
