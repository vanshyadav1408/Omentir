import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/server/auth";
import { getWorkspace } from "@/lib/server/data";
import { hasActiveSubscription } from "@/lib/server/subscription";
import { planHasApiAccess } from "@/lib/plan-limits";
import { resolveAuthorizationRequest } from "@/lib/server/oauth-authorize";
import { redirectWithError } from "@/lib/server/oauth";
import { createPageMetadata } from "@/app/seo";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Connect an app - Omentir",
  description: "Approve an AI app's request to connect to your Omentir workspace.",
  path: "/oauth/authorize",
  noIndex: true,
});

const GRANTS = [
  { icon: "group", text: "Read your leads, lead groups, and conversations" },
  { icon: "smart_toy", text: "Create and manage lead finders" },
  { icon: "send", text: "Reply to leads on your behalf" },
];

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#fbfaf6] px-4 py-10">
      <div className="w-full max-w-md rounded-md border border-zinc-200 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
        {children}
      </div>
    </main>
  );
}

function Problem({ title, message }: { title: string; message: string }) {
  return (
    <Shell>
      <span className="material-symbols-outlined text-[26px] leading-none text-[#ba3871]">error</span>
      <h1 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">{title}</h1>
      <p className="mt-2 text-[13px] leading-relaxed text-zinc-600">{message}</p>
      <Link
        href="/api-keys"
        className="mt-5 inline-block rounded-md bg-[#ba3871] px-4 py-2 text-[13px] font-semibold text-white"
      >
        Go to Omentir
      </Link>
    </Shell>
  );
}

export default async function OAuthAuthorizePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value) && value[0]) params.set(key, value[0]);
  }

  const resolved = await resolveAuthorizationRequest(params);
  if (!resolved.ok) {
    if (resolved.fatal) return <Problem title="This connection request is not valid" message={resolved.message} />;
    redirect(redirectWithError(resolved.redirectUri, resolved.error, resolved.message, resolved.state));
  }

  const { client, redirectUri, codeChallenge, state } = resolved.request;

  // Sign-in has to happen before consent, and the whole request must survive the
  // round trip or the app would have to restart the flow from scratch.
  const { userId } = await auth();
  if (!userId) {
    redirect(`/login?next=${encodeURIComponent(`/oauth/authorize?${params.toString()}`)}`);
  }

  const workspace = await getWorkspace(userId);
  const denyUrl = redirectWithError(redirectUri, "access_denied", "You declined the request.", state);

  if (!hasActiveSubscription(workspace)) {
    return (
      <Problem
        title="Your subscription is inactive"
        message={`${client.clientName} cannot connect until your Omentir subscription is active. Reactivate it, then add the connector again.`}
      />
    );
  }
  if (!planHasApiAccess(workspace.billing?.plan)) {
    return (
      <Problem
        title="App connections need the Startup plan"
        message={`Connecting ${client.clientName} to Omentir requires the Startup plan or above. Upgrade, then add the connector again.`}
      />
    );
  }

  return (
    <Shell>
      <span className="material-symbols-outlined text-[26px] leading-none text-[#ba3871]">hub</span>
      <h1 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">
        Connect {client.clientName} to Omentir
      </h1>
      <span className="mt-1.5 block h-0.5 w-8 rounded-full bg-[#ba3871]/60" />
      <p className="mt-3 text-[13px] leading-relaxed text-zinc-600">
        {client.clientName} is asking to use your Omentir workspace. If you did not just add this
        connector, close this page.
      </p>

      <ul className="mt-4 space-y-2 rounded-md border border-zinc-200 bg-[#fbfaf6] px-3 py-3">
        {GRANTS.map((grant) => (
          <li key={grant.text} className="flex items-start gap-2 text-[13px] leading-relaxed text-zinc-800">
            <span className="material-symbols-outlined mt-px text-[16px] leading-none text-[#ba3871]">
              {grant.icon}
            </span>
            {grant.text}
          </li>
        ))}
      </ul>

      <p className="mt-3 text-[12px] leading-relaxed text-zinc-500">
        Approving creates an API key named &ldquo;{client.clientName}&rdquo;. You can revoke it at any
        time from the API page, which disconnects the app immediately.
      </p>

      <form action="/api/oauth/authorize/decision" method="post" className="mt-5 flex gap-2">
        <input type="hidden" name="client_id" value={client.id} />
        <input type="hidden" name="redirect_uri" value={redirectUri} />
        <input type="hidden" name="code_challenge" value={codeChallenge} />
        <input type="hidden" name="code_challenge_method" value="S256" />
        <input type="hidden" name="response_type" value="code" />
        <input type="hidden" name="state" value={state} />
        <button
          type="submit"
          name="decision"
          value="approve"
          className="flex-1 cursor-pointer rounded-md bg-[#ba3871] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#a53164]"
        >
          Connect workspace
        </button>
        <a
          href={denyUrl}
          className="cursor-pointer rounded-md border border-zinc-200 px-4 py-2.5 text-[13px] font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Cancel
        </a>
      </form>
    </Shell>
  );
}
