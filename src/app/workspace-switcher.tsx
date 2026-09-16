"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createWorkspaceAction, switchWorkspaceAction } from "@/app/actions";
import { isNextNavigationError, userFacingError } from "@/app/toast";
import { useBodyScrollLock } from "@/app/use-body-scroll-lock";
import { useHydrated } from "@/app/use-hydrated";
import { TextField } from "@/app/ui/text-field";
import { clearSidebarResourceCache } from "@/app/use-sidebar-resource";
import { workspaceDisplayName } from "@/lib/workspace-ownership";

export type WorkspaceSwitcherItem = {
  id: string;
  name: string;
  faviconUrl?: string;
};

export function WorkspaceAvatar({
  name,
  faviconUrl,
  size = 20,
}: {
  name: string;
  faviconUrl?: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const letter = (name.trim()[0] || "W").toUpperCase();

  if (faviconUrl && !failed) {
    return (
      // External site favicons are not in next/image remotePatterns.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={faviconUrl}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-[5px] object-cover"
        style={{ width: size, height: size }}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-[5px] bg-zinc-200 text-[10px] font-semibold text-zinc-700"
      style={{ width: size, height: size }}
    >
      {letter}
    </span>
  );
}

export default function WorkspaceSwitcher({
  workspaces,
  activeWorkspaceId,
  canCreateWorkspace,
  collapsed = false,
  onNavigate,
}: {
  workspaces: WorkspaceSwitcherItem[];
  activeWorkspaceId: string;
  canCreateWorkspace: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const hydrated = useHydrated();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [pending, startTransition] = useTransition();
  useBodyScrollLock(creating);

  const active =
    workspaces.find((workspace) => workspace.id === activeWorkspaceId) || workspaces[0];
  const activeName = workspaceDisplayName(active || { id: activeWorkspaceId, name: "Workspace" });

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function switchTo(workspaceId: string) {
    if (workspaceId === activeWorkspaceId) {
      setOpen(false);
      onNavigate?.();
      return;
    }
    startTransition(async () => {
      try {
        await switchWorkspaceAction(workspaceId);
        clearSidebarResourceCache();
        setOpen(false);
        onNavigate?.();
        router.refresh();
      } catch (error) {
        if (isNextNavigationError(error)) {
          clearSidebarResourceCache();
          setOpen(false);
          onNavigate?.();
          router.refresh();
          return;
        }
        console.error(error);
      }
    });
  }

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError("");
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        await createWorkspaceAction(formData);
        clearSidebarResourceCache();
      } catch (error) {
        if (isNextNavigationError(error)) {
          clearSidebarResourceCache();
          setCreating(false);
          setOpen(false);
          onNavigate?.();
          router.refresh();
          return;
        }
        setCreateError(userFacingError(error, "Could not create the workspace. Try again."));
      }
    });
  }

  const createDialog =
    creating && hydrated
      ? createPortal(
          <div
            className="app-compact m3-modal-scrim z-[200]"
            role="presentation"
            onClick={() => {
              if (!pending) setCreating(false);
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="new-workspace-title"
              className="m3-modal-surface"
              onClick={(event) => event.stopPropagation()}
            >
              <h2 id="new-workspace-title" className="m3-dialog-title">
                New workspace
              </h2>
              <p className="m3-dialog-body">
                Each workspace has its own company profile, agents, and leads. Paid
                plans can add as many as you need.
              </p>
              <form onSubmit={handleCreate} className="mt-4 grid gap-3">
                <TextField
                  name="websiteUrl"
                  label="Landing page"
                  placeholder="https://yourproduct.com"
                  required
                />
                <TextField name="name" label="Name" placeholder="Optional. Defaults to the site name." />
                {createError ? (
                  <p className="text-sm text-[#c62828]" role="alert">
                    {createError}
                  </p>
                ) : null}
                <div className="mt-1 flex justify-end gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => setCreating(false)}
                    className="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="m3-btn m3-btn-filled h-9 px-3 text-sm disabled:opacity-60"
                  >
                    {pending ? "Creating..." : "Create workspace"}
                  </button>
                </div>
              </form>
            </section>
          </div>,
          document.body,
        )
      : null;

  if (!active) return null;

  return (
    <div ref={menuRef} className="relative mb-1">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        title={collapsed ? activeName : undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`flex items-center rounded-md py-1.5 text-[13px] font-normal text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-nav-item-active)] ${
          collapsed ? "h-8 w-8 justify-center self-center p-0" : "min-h-8 w-full gap-2.5 px-2"
        }`}
      >
        <WorkspaceAvatar name={activeName} faviconUrl={active.faviconUrl} />
        {collapsed ? null : (
          <>
            <span className="min-w-0 flex-1 truncate text-left">{activeName}</span>
            <span className="material-symbols-outlined ms-size-20 shrink-0 text-[var(--md-sys-color-on-surface-variant)]">
              expand_more
            </span>
          </>
        )}
      </button>
      {open ? (
        <div
          role="listbox"
          aria-label="Workspaces"
          className={`absolute z-[120] rounded-md border border-zinc-200 bg-white py-1 shadow-[0_8px_24px_rgba(15,23,42,0.12)] ${
            collapsed ? "left-full top-0 ml-2 w-56" : "inset-x-0 top-full mt-1"
          }`}
        >
          {workspaces.map((workspace) => {
            const name = workspaceDisplayName(workspace);
            const selected = workspace.id === activeWorkspaceId;
            return (
              <button
                key={workspace.id}
                type="button"
                role="option"
                aria-selected={selected}
                disabled={pending}
                onClick={() => switchTo(workspace.id)}
                className="flex w-full items-center gap-2.5 px-2.5 py-1.5 text-left text-[13px] text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
              >
                <WorkspaceAvatar name={name} faviconUrl={workspace.faviconUrl} />
                <span className="min-w-0 flex-1 truncate">{name}</span>
                {selected ? (
                  <span className="material-symbols-outlined ms-size-20 text-[#ba3871]">check</span>
                ) : null}
              </button>
            );
          })}
          {canCreateWorkspace ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setCreateError("");
                setCreating(true);
              }}
              className="mt-1 flex w-full items-center gap-2.5 border-t border-zinc-100 px-2.5 py-1.5 text-left text-[13px] text-zinc-700 hover:bg-zinc-50"
            >
              <span className="material-symbols-outlined ms-size-20">add</span>
              New workspace
            </button>
          ) : null}
        </div>
      ) : null}
      {createDialog}
    </div>
  );
}
