import { auth } from "@/lib/server/auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createPageMetadata } from "@/app/seo";
import { getAgent, getWorkspace, listLinkedInAccounts } from "@/lib/server/data";
import { listScheduledActions } from "@/lib/server/scheduled-actions";
import { hasActiveSubscription } from "@/lib/server/subscription";
import ActivityDashboard from "../../actions/activity-dashboard";

export const metadata = createPageMetadata({
  title: "Agent Actions - Omentir",
  description: "Review every upcoming action for an Omentir agent.",
  path: "/agents",
  noIndex: true,
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AgentActionsPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const { userId } = await auth();
  if (!userId) {
    await auth.protect();
    throw new Error("Unauthorized");
  }

  const workspace = await getWorkspace(userId);
  if (!hasActiveSubscription(workspace)) redirect("/upgrade");
  const [accounts, agent, items] = await Promise.all([
    listLinkedInAccounts(workspace.id),
    getAgent(workspace.id, id),
    listScheduledActions(workspace.id, { agentId: id }),
  ]);
  if (!accounts.length) redirect("/connect");
  if (!agent) return notFound();
  const serverNow = new Date().getTime();

  return (
    <ActivityDashboard
      items={items}
      title={agent.name || agent.targetGroupName || "Agent actions"}
      serverNow={serverNow}
      timezone={workspace.timezone}
      headerActions={
        <>
          <Link href="/agents" className="inline-flex h-8 items-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700">Back</Link>
          <Link href={`/agents/new?id=${agent.id}`} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#ba3871] px-3 text-xs font-semibold text-white">
            <span className="material-symbols-outlined text-[13px]">edit</span>Edit
          </Link>
        </>
      }
      intro={
        <section className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-600">
          <span><strong className="text-zinc-950">Agent:</strong> {agent.status}</span>
          <span><strong className="text-zinc-950">Lead group:</strong> {agent.targetGroupName}</span>
          <span><strong className="text-zinc-950">Upcoming:</strong> {items.length}</span>
        </section>
      }
    />
  );
}
