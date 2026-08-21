import { redirect } from "next/navigation";

/** Outreach details now live on the Leads page. */
export default function ActivityPage() {
  redirect("/leads");
}
