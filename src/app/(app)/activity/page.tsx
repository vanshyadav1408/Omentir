import { redirect } from "next/navigation";

/** Permanent alias: outreach details live on /leads. */
export default function ActivityAliasPage() {
  redirect("/leads");
}
