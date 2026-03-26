import Link from "next/link";

import { getDictionary } from "@/lib/i18n/server";

export default async function NotFound() {
  const dict = await getDictionary();

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-20 text-center">
      <h1 className="font-display text-4xl font-semibold text-foreground">
        {dict.notFound.title}
      </h1>
      <p className="mt-3 max-w-md text-muted">{dict.notFound.body}</p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent-dark"
      >
        {dict.notFound.home}
      </Link>
    </div>
  );
}
