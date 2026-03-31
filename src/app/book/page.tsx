import type { Metadata } from "next";

import { BookAppointmentForm } from "@/components/forms/BookAppointmentForm";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return {
    title: dict.book.pageTitle,
    description:
      "Book a call or visit with Radha Creations. We confirm slots over WhatsApp.",
  };
}

export default async function BookPage() {
  const dict = await getDictionary();

  return (
    <div className="py-10 sm:py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h1 className="font-display text-4xl font-semibold text-foreground sm:text-5xl">
          {dict.book.pageTitle}
        </h1>
        <p className="mt-3 max-w-2xl text-muted">{dict.book.pageIntro}</p>
        <div className="mt-10">
          <BookAppointmentForm />
        </div>
      </div>
    </div>
  );
}
