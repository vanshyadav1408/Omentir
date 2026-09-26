"use client";

import { unwrapAction, type ActionFailure } from "@/lib/action-result";
import { useCallback, useEffect, useState, useTransition } from "react";
import { isNextNavigationError, userFacingError } from "@/app/toast";
import { useBodyScrollLock } from "@/app/use-body-scroll-lock";
import DeleteWorkspaceDialog from "@/app/delete-workspace-dialog";
import { clearSidebarResourceCache } from "@/app/use-sidebar-resource";
import { isOriginalWorkspace, workspaceDisplayName } from "@/lib/workspace-ownership";

export default function DeleteWorkspaceCard({
  workspace,
  deleteAction,
}: {
  workspace: { id: string; ownerId?: string; name?: string };
  deleteAction: (workspaceId: string) => Promise<void | ActionFailure>;
}) {
  const keepsAccountWorkspace = isOriginalWorkspace(workspace);
  const name = workspaceDisplayName(workspace);
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  useBodyScrollLock(open);

  const close = useCallback(() => {
    if (pending) return;
    setOpen(false);
    setConfirmation("");
    setError("");
  }, [pending]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, pending, close]);

  const confirmDelete = () => {
    if (confirmation.trim() !== name || pending) return;
    setError("");
    startTransition(async () => {
      try {
        unwrapAction(await deleteAction(workspace.id));
        clearSidebarResourceCache();
      } catch (err) {
        if (isNextNavigationError(err)) {
          clearSidebarResourceCache();
          return;
        }
        setError(userFacingError(err, "Could not delete this workspace. Try again."));
      }
    });
  };

  return (
    <>
      <div className="m3-card m3-card-outlined flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
            Delete this workspace
          </p>
          <p className="mt-1 text-[13px] leading-5 text-[var(--md-sys-color-on-surface-variant)]">
            {keepsAccountWorkspace
              ? "Deletes the company profile, agents, leads, and campaigns. Your account and billing stay, so an empty workspace remains."
              : "Removes this workspace from the switcher, along with its agents and leads. LinkedIn is kept on your other workspaces."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setError("");
            setConfirmation("");
            setOpen(true);
          }}
          className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border border-[var(--md-sys-color-error)] bg-transparent px-4 text-sm font-semibold text-[var(--md-sys-color-error)] transition hover:bg-[var(--md-sys-color-error-container)] hover:text-[var(--md-sys-color-on-error-container)]"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4h6v2" />
          </svg>
          Delete workspace
        </button>
      </div>
      <DeleteWorkspaceDialog
        open={open}
        name={name}
        keepsAccountWorkspace={keepsAccountWorkspace}
        pending={pending}
        error={error}
        confirmation={confirmation}
        onConfirmationChange={setConfirmation}
        onClose={close}
        onConfirm={confirmDelete}
      />
    </>
  );
}
