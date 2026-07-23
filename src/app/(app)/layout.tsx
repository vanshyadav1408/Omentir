import { auth } from "@/lib/server/auth";
import type { Metadata } from "next";
import Sidebar from "@/app/sidebar";
import { noIndexRobots } from "@/app/seo";
import AppPageTransition from "@/app/app-page-transition";
import { isLocalMode } from "@/lib/runtime-mode";

export const metadata: Metadata = {
  robots: noIndexRobots,
};

// Shared shell for the authenticated app pages. Living in a layout (instead of
// per-page) keeps the sidebar mounted across navigations, so only the content
// pane swaps while the sidebar keeps its collapse state and animations.
// Content pane uses M3 Pattern A fade-through between top-level routes.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) {
    await auth.protect({ unauthenticatedUrl: "/login" });
  }

  return (
    <div className="dashboard-shell flex h-screen max-w-full overflow-hidden overflow-x-hidden bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]">
      <Sidebar localMode={isLocalMode()} />
      <main className="h-screen w-full min-w-0 flex-1 overflow-hidden">
        {/* Mobile: 56px compact app bar; navigation stays in the drawer. */}
        <section className="flex h-full w-full flex-col pt-14 md:pt-0">
          <div className="min-h-0 flex-1">
            <AppPageTransition>{children}</AppPageTransition>
          </div>
        </section>
      </main>
    </div>
  );
}
