"use client";

import { useState, useTransition } from "react";
import { setOutreachPausedAction } from "@/app/actions";
import { unwrapAction } from "@/lib/action-result";
import { userFacingError, useToast } from "@/app/toast";
import { ToggleRow } from "@/app/ui/toggle-row";

// The outreach switch for one workspace. Saved the moment it is flipped, not
// with the page's Save button: switching outreach off has to take effect now.
// Shown in Settings and on the Workspace page; both write the same setting.
export default function OutreachSwitch({
  workspaceName,
  initialPaused,
}: {
  workspaceName: string;
  initialPaused: boolean;
}) {
  const [on, setOn] = useState(!initialPaused);
  const [saving, startSave] = useTransition();
  const { showError } = useToast();
  const name = workspaceName.trim() || "this workspace";

  function toggle(next: boolean) {
    setOn(next);
    startSave(async () => {
      try {
        unwrapAction(await setOutreachPausedAction(!next));
      } catch (error) {
        setOn(!next);
        showError(userFacingError(error, "Could not change the outreach switch."));
      }
    });
  }

  return (
    <ToggleRow
      title="Outreach"
      description={
        on
          ? `On for ${name}. Turn it off to pause every invite, message and AI reply from this workspace. Other workspaces keep running.`
          : `Off for ${name}. No invites, messages or AI replies go out from this workspace, whatever its agents are set to. Agents still find leads and replies still show up in Messages. Other workspaces keep running.`
      }
      enabled={on}
      onChange={toggle}
      disabled={saving}
    />
  );
}
