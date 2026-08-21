import { redirect } from "next/navigation";

// LinkedIn connect for new users lives on Overview. Kept as a redirect so
// old /connect links and the LinkedIn auth failure URL still land correctly.
export default async function ConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  redirect(params.error ? "/overview?linkedin=error" : "/overview");
}
