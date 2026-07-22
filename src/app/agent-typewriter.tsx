"use client";

import { useEffect, useState } from "react";
import AgentBrandIcon from "./agent-brand-icons";

const defaultAgents = ["OpenClaw", "Hermes Agent", "Codex", "Claude Code", "Cursor"];

export default function AgentTypewriter({ agents = defaultAgents }: { agents?: string[] }) {
  const [agentIndex, setAgentIndex] = useState(0);
  const [visibleLength, setVisibleLength] = useState(agents[0].length);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const currentAgent = agents[agentIndex];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) return;

    const delay = deleting ? 130 : visibleLength === currentAgent.length ? 2400 : 190;
    const timeout = window.setTimeout(() => {
      if (!deleting && visibleLength === currentAgent.length) {
        setDeleting(true);
        return;
      }

      if (deleting && visibleLength === 0) {
        setAgentIndex((index) => (index + 1) % agents.length);
        setVisibleLength(1);
        setDeleting(false);
        return;
      }

      setVisibleLength((length) => length + (deleting ? -1 : 1));
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [agentIndex, deleting, visibleLength]);

  const currentAgent = agents[agentIndex].slice(0, visibleLength);

  return (
    <span
      className="inline-block max-w-full min-w-0 text-left text-gradient-brand md:min-w-[12ch]"
      aria-label={agents[agentIndex]}
    >
      <AgentBrandIcon agent={agents[agentIndex]} />
      <span aria-hidden="true">{currentAgent}</span>
      <span aria-hidden="true" className="ml-0.5 animate-pulse">
        |
      </span>
    </span>
  );
}
