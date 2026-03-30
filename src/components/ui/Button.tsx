import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-white shadow-[0_2px_12px_-2px_rgba(196,138,138,0.45)] hover:bg-accent-dark focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  secondary:
    "border-2 border-accent bg-transparent text-foreground hover:bg-accent/[0.08] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  ghost:
    "text-foreground hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
};

type Base = {
  children: ReactNode;
  className?: string;
  variant?: Variant;
};

type ButtonAsButton = Base &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
    href?: undefined;
  };

type ButtonAsLink = Base & {
  href: string;
  external?: boolean;
};

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { children, className = "", variant = "primary" } = props;
  const base =
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold transition-colors";

  if ("href" in props && props.href) {
    const { href, external } = props;
    const isTelOrMail =
      href.startsWith("tel:") || href.startsWith("mailto:");
    if (isTelOrMail) {
      return (
        <a href={href} className={`${base} ${variants[variant]} ${className}`}>
          {children}
        </a>
      );
    }
    if (external) {
      return (
        <a
          href={href}
          className={`${base} ${variants[variant]} ${className}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={`${base} ${variants[variant]} ${className}`}>
        {children}
      </Link>
    );
  }

  const { ...rest } = props as ButtonAsButton;
  return (
    <button
      type={rest.type ?? "button"}
      className={`${base} ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
