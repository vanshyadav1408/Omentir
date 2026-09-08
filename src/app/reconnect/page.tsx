import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Old reconnect bookmarks used a separate AuthShell. New and returning users
// now reconnect from the same Overview setup checklist.
export default function ReconnectPage() {
  redirect("/overview");
}
