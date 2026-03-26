import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ design?: string }>;
};

/** Legacy URL — multi-item flow lives at /request */
export default async function StitchingRedirectPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  q.set("service", "stitching");
  if (sp.design) {
    q.set("catalog", sp.design);
  }
  redirect(`/request?${q.toString()}`);
}
