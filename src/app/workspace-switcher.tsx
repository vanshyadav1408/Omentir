"use client";

import { unwrapAction } from "@/lib/action-result";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
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

function PlusIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M10 4.5v11M4.5 10h11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function WorkspaceSwitcher({
  workspaces,
  activeWorkspaceId,
  canCreateWorkspace,
  collapsed = false,
  active = false,
  className = "",
  onNavigate,
}: {
  workspaces: WorkspaceSwitcherItem[];
  activeWorkspaceId: string;
  canCreateWorkspace: boolean;
  collapsed?: boolean;
  active?: boolean;
  className?: string;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const hydrated = useHydrated();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const [pending, startTransition] = useTransition();
  useBodyScrollLock(creating);

  const activeWorkspace =
    workspaces.find((workspace) => workspace.id === activeWorkspaceId) || workspaces[0];
  const activeName = workspaceDisplayName(
    activeWorkspace || { id: activeWorkspaceId, name: "Workspace" },
  );
  const showSwitcher = workspaces.length > 1 || canCreateWorkspace;

  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      const rect = menuRef.current?.getBoundingClientRect();
      if (!rect) return;
      if (collapsed) {
        setMenuStyle({
          left: rect.right + 8,
          bottom: window.innerHeight - rect.bottom,
          width: 224,
        });
      } else {
        setMenuStyle({
          left: rect.left,
          bottom: window.innerHeight - rect.top + 4,
          width: Math.max(rect.width, 176),
        });
      }
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, collapsed]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Node && menuRef.current?.contains(target)) return;
      if (target instanceof Element && target.closest('[role="listbox"]')) return;
      setOpen(false);
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

  function goToWorkspace() {
    setOpen(false);
    onNavigate?.();
  }

  function switchTo(workspaceId: string) {
    if (workspaceId === activeWorkspaceId) {
      goToWorkspace();
      router.push("/workspace");
      return;
    }
    startTransition(async () => {
      try {
        unwrapAction(await switchWorkspaceAction(workspaceId));
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
        unwrapAction(await createWorkspaceAction(formData));
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

  if (!activeWorkspace) return null;

  const menu =
    open && hydrated
      ? createPortal(
          <div
            role="listbox"
            aria-label="Workspaces"
            style={menuStyle}
            onMouseDown={(event) => event.stopPropagation()}
            className="fixed z-[120] max-h-[min(24rem,calc(100vh-1rem))] overflow-y-auto rounded-md border border-zinc-200 bg-white py-1 shadow-[0_8px_24px_rgba(15,23,42,0.12)]"
          >
            {workspaces.map((workspace) => {
              const name = workspaceDisplayName(workspace);
              const selected = workspace.id === activeWorkspaceId;
              const rowClassName =
                "flex w-full items-center gap-2.5 px-2.5 py-1.5 text-left text-[13px] text-zinc-800 hover:bg-zinc-50 disabled:opacity-60";
              const content = (
                <>
                  <WorkspaceAvatar name={name} faviconUrl={workspace.faviconUrl} />
                  <span className="min-w-0 flex-1 truncate">{name}</span>
                  {selected ? (
                    <span className="material-symbols-outlined ms-size-20 text-[#ba3871]">check</span>
                  ) : null}
                </>
              );
              if (selected) {
                return (
                  <Link
                    key={workspace.id}
                    href="/workspace"
                    role="option"
                    aria-selected="true"
                    onClick={goToWorkspace}
                    className={rowClassName}
                  >
                    {content}
                  </Link>
                );
              }
              return (
                <button
                  key={workspace.id}
                  type="button"
                  role="option"
                  aria-selected="false"
                  disabled={pending}
                  onClick={() => switchTo(workspace.id)}
                  className={rowClassName}
                >
                  {content}
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
                <PlusIcon />
                New workspace
              </button>
            ) : null}
          </div>,
          document.body,
        )
      : null;

  const identity = (
    <Link
      href="/workspace"
      title={collapsed ? activeName : undefined}
      aria-label={collapsed ? activeName : undefined}
      aria-current={active ? "page" : undefined}
      onClick={goToWorkspace}
      className={
        collapsed
          ? "grid h-full w-full place-items-center"
          : "flex min-w-0 flex-1 items-center gap-2.5"
      }
    >
      <WorkspaceAvatar name={activeName} faviconUrl={activeWorkspace.faviconUrl} />
      {collapsed ? null : <span className="min-w-0 flex-1 truncate text-left">{activeName}</span>}
    </Link>
  );

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      {collapsed && showSwitcher ? (
        <button
          type="button"
          title={activeName}
          aria-label={activeName}
          aria-current={active ? "page" : undefined}
          aria-expanded={open}
          aria-haspopup="listbox"
          disabled={pending}
          onClick={() => setOpen((value) => !value)}
          className="grid h-full w-full place-items-center"
        >
          <WorkspaceAvatar name={activeName} faviconUrl={activeWorkspace.faviconUrl} />
        </button>
      ) : (
        identity
      )}
      {!collapsed && showSwitcher ? (
        <button
          type="button"
          aria-label="Switch workspace"
          aria-expanded={open}
          aria-haspopup="listbox"
          disabled={pending}
          onClick={() => setOpen((value) => !value)}
          className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-nav-item-active)]"
        >
          <span className="material-symbols-outlined ms-size-20">expand_more</span>
        </button>
      ) : null}
      {menu}
      {createDialog}
    </div>
  );
}
