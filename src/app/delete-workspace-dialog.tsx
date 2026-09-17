"use client";

import { createPortal } from "react-dom";
import { TextField } from "@/app/ui/text-field";

export default function DeleteWorkspaceDialog({
  open,
  name,
  keepsAccountWorkspace,
  pending,
  error,
  confirmation,
  onConfirmationChange,
  onClose,
  onConfirm,
}: {
  open: boolean;
  name: string;
  keepsAccountWorkspace: boolean;
  pending: boolean;
  error: string;
  confirmation: string;
  onConfirmationChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open || typeof document === "undefined") return null;

  const confirmed = confirmation.trim() === name;

  return createPortal(
    <div
      className="app-compact m3-dialog-scrim m3-dialog-scrim--compact-mobile z-[220]"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-workspace-title"
        className="m3-dialog-surface m3-dialog-surface--compact-mobile"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="delete-workspace-title" className="m3-dialog-title">
          Delete {name}?
        </h2>
        <p className="m3-dialog-body">
          {keepsAccountWorkspace
            ? "This deletes the company profile, agents, leads, and campaigns. Your account and billing stay, so an empty workspace remains."
            : "This permanently deletes this workspace and everything in it: company profile, agents, leads, and campaigns. LinkedIn stays connected on your other workspaces."}
        </p>
        <div className="mt-4">
          <TextField
            label={`Type ${name} to confirm`}
            value={confirmation}
            onChange={(event) => onConfirmationChange(event.target.value)}
            autoComplete="off"
            autoFocus={
              typeof window !== "undefined" &&
              window.matchMedia("(min-width: 768px)").matches
            }
          />
        </div>
        {error ? (
          <p className="mt-3 text-sm text-[var(--md-sys-color-error)]" role="alert">
            {error}
          </p>
        ) : null}
        <div className="m3-dialog-actions">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="m3-dialog-btn m3-dialog-btn--text"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending || !confirmed}
            aria-busy={pending}
            className="m3-dialog-btn m3-dialog-btn--destructive"
          >
            {pending ? <span className="m3-dialog-btn__spinner" aria-hidden /> : null}
            {pending ? "Deleting..." : "Delete workspace"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
