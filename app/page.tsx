import { redirect } from "next/navigation";

/** The dashboard has no separate landing page — Overview is the home route. */
export default function RootPage() {
  redirect("/overview");
}
