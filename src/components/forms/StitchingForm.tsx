"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { useI18n } from "@/components/i18n/I18nProvider";
import type { CatalogItem } from "@/lib/types";
import { buildWhatsAppUrl, stitchingRequestTemplate } from "@/lib/whatsapp";

import { Button } from "@/components/ui/Button";

type DesignSource = "catalog" | "upload" | "describe";

type Props = {
  catalog: CatalogItem[];
};

export function StitchingForm({ catalog }: Props) {
  const { locale, dict } = useI18n();
  const d = dict.stitching;
  const router = useRouter();
  const searchParams = useSearchParams();
  const designFromQuery = searchParams.get("design") ?? "";

  const [source, setSource] = useState<DesignSource>(
    designFromQuery ? "catalog" : "describe",
  );
  const [catalogId, setCatalogId] = useState(designFromQuery);
  const [describeDesign, setDescribeDesign] = useState("");
  const [fileName, setFileName] = useState<string | undefined>();
  const [notes, setNotes] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");

  const designLabel = useMemo(() => {
    if (source === "catalog") {
      const item = catalog.find((c) => c.id === catalogId);
      return item
        ? `${item.title} (catalog ${item.id})`
        : d.designFallbackCatalog;
    }
    if (source === "upload") {
      return fileName
        ? `${d.designFallbackUploadNamed} ${fileName}`
        : d.designFallbackUpload;
    }
    return describeDesign.trim() || d.designFallbackDescribe;
  }, [source, catalog, catalogId, fileName, describeDesign, d]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!deliveryDate.trim()) {
      return;
    }
    const msg = stitchingRequestTemplate(
      {
        designLabel,
        deliveryDate,
        notes,
        referenceImageName: source === "upload" ? fileName : undefined,
      },
      locale,
    );
    window.location.href = buildWhatsAppUrl(msg);
  }

  const sources = [
    ["catalog", d.sourceCatalog],
    ["upload", d.sourceUpload],
    ["describe", d.sourceDescribe],
  ] as const;

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-2xl space-y-6 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8"
    >
      <div>
        <h2 className="font-display text-2xl font-semibold text-foreground">{d.formTitle}</h2>
        <p className="mt-2 text-sm text-muted">{d.formIntro}</p>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-foreground">{d.designSource}</legend>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {sources.map(([value, label]) => (
            <label
              key={value}
              className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
                source === value
                  ? "border-accent bg-[#fff9f8]"
                  : "border-border bg-background"
              }`}
            >
              <input
                type="radio"
                name="source"
                value={value}
                checked={source === value}
                onChange={() => setSource(value)}
                className="accent-accent"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {source === "catalog" ? (
        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="catalog-pick">
            {d.catalogItem}
          </label>
          <select
            id="catalog-pick"
            value={catalogId}
            onChange={(e) => setCatalogId(e.target.value)}
            className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none ring-accent focus:ring-2"
          >
            <option value="">{d.selectDesign}</option>
            {catalog.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="mt-2 text-sm font-medium text-accent-dark underline-offset-4 hover:underline"
            onClick={() => router.push("/gallery")}
          >
            {d.browseGallery}
          </button>
        </div>
      ) : null}

      {source === "upload" ? (
        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="file">
            {d.referenceImage}
          </label>
          <input
            id="file"
            type="file"
            accept="image/*"
            className="mt-2 block w-full text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-accent-dark"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setFileName(f?.name);
            }}
          />
          <p className="mt-2 text-xs text-muted">{d.fileHint}</p>
        </div>
      ) : null}

      {source === "describe" ? (
        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="describe">
            {d.describeLabel}
          </label>
          <textarea
            id="describe"
            value={describeDesign}
            onChange={(e) => setDescribeDesign(e.target.value)}
            rows={3}
            className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none ring-accent focus:ring-2"
            placeholder={d.describePh}
          />
        </div>
      ) : null}

      <div>
        <label className="text-sm font-medium text-foreground" htmlFor="notes">
          {d.notesLabel}
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none ring-accent focus:ring-2"
          placeholder={d.notesPh}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground" htmlFor="delivery">
          {d.deliveryLabel}
        </label>
        <input
          id="delivery"
          type="date"
          required
          value={deliveryDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
          className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none ring-accent focus:ring-2"
        />
      </div>

      <Button type="submit" className="w-full sm:w-auto">
        {d.submit}
      </Button>
    </form>
  );
}
