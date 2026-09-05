import { redirect } from "next/navigation";

/** `AI Growth` is a section, not a page — send it to its first child route. */
export default function GrowthPage() {
  redirect("/growth/opportunities");
}
