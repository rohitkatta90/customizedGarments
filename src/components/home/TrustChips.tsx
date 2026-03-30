import { getDictionary } from "@/lib/i18n/server";

type Props = {
  className?: string;
  /** Hero shows two trust lines only (replies + no hidden charges). */
  variant?: "full" | "hero";
};

export async function TrustChips({ className = "", variant = "full" }: Props) {
  const dict = await getDictionary();
  const chips =
    variant === "hero"
      ? [dict.homeTrustChips.fastReply, dict.homeTrustChips.noHidden]
      : [
          dict.homeTrustChips.fastReply,
          dict.homeTrustChips.noHidden,
          dict.homeTrustChips.trusted,
        ];

  return (
    <ul className={`flex flex-wrap gap-2 text-xs font-medium text-muted ${className}`}>
      {chips.map((label) => (
        <li
          key={label}
          className="rounded-2xl border border-border/80 bg-card px-3 py-2 text-xs text-foreground/90 shadow-sm"
        >
          {label}
        </li>
      ))}
    </ul>
  );
}
