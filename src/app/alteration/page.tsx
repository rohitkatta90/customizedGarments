import { redirect } from "next/navigation";

/** Legacy URL — multi-item flow lives at /request */
export default function AlterationRedirectPage() {
  redirect("/request?service=alteration");
}
