import { redirect } from "next/navigation";

/** Permanent alias: Actions UI lives at /actions. */
export default function ActivityRedirectPage() {
  redirect("/actions");
}
