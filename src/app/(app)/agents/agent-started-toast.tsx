"use client";

import { useEffect } from "react";
import { consumeAgentStartedNotice, useToast } from "@/app/toast";

// Setup opens a new agent's page after launch. The notice it left in
// sessionStorage becomes the "agent started" toast here, as on the Agents list.
export function AgentStartedToast() {
  const { showAgentStarted } = useToast();
  useEffect(() => {
    const notice = consumeAgentStartedNotice();
    if (notice) showAgentStarted(notice.name || undefined, notice.kind);
  }, [showAgentStarted]);
  return null;
}
