"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { sendLinkedInChatMessageAction } from "@/app/actions";
import { useSidebarResource } from "@/app/use-sidebar-resource";
import {
  ContentReveal,
  MessageBubblesSkeleton,
  MessagesInboxSkeleton,
} from "@/app/app-skeletons";
import type {
  Conversation,
  ConversationMessage,
  LeadPreview,
  LinkedInInboxMessage,
  LinkedInInboxThread,
} from "@/lib/server/types";
import { TextField } from "@/app/ui/text-field";
import MobileHeaderPortal from "@/app/mobile-header-portal";

type InboxThread =
  | {
      id: string;
      kind: "linkedin";
      title: string;
      profileName: string;
      profileHeadline?: string;
      profileUrl?: string;
      avatarUrl?: string;
      status: string;
      unread: boolean;
      messages: LinkedInInboxMessage[];
      chatId: string;
      accountId: string;
      lead?: LeadPreview;
    }
  | {
      id: string;
      kind: "stored";
      title: string;
      profileName: string;
      profileHeadline?: string;
      profileUrl?: string;
      avatarUrl?: string;
      status: string;
      unread: boolean;
      messages: ConversationMessage[];
      chatId?: never;
      lead?: LeadPreview;
    };

type LocalMessage = LinkedInInboxMessage & { local: true };

function mergeWithLocalMessages<T extends ConversationMessage | LinkedInInboxMessage>(
  messages: T[],
  localMessages: LocalMessage[],
) {
  if (!localMessages.length) return messages;
  const visible = localMessages.filter((local) => {
    const localTime = new Date(local.createdAt).getTime();
    return !messages.some((message) => {
      if (message.direction !== "outbound" || message.body !== local.body) return false;
      const messageTime = new Date(message.createdAt).getTime();
      return Math.abs(messageTime - localTime) < 2 * 60 * 1000;
    });
  });
  return [...messages, ...visible];
}

function buildThreads(
  conversations: Conversation[],
  leads: LeadPreview[],
  linkedInThreads: LinkedInInboxThread[] = [],
  hydratedMessages: Record<string, LinkedInInboxMessage[]> = {},
  localMessages: Record<string, LocalMessage[]> = {},
): InboxThread[] {
  const live: InboxThread[] = linkedInThreads.map((thread) => {
    const id = `linkedin:${thread.id}`;
    const lead = leads.find(
      (item) => item.linkedInUrl && thread.profileUrl && item.linkedInUrl === thread.profileUrl,
    ) || leads.find(
      (item) =>
        item.name &&
        thread.profileName &&
        item.name.trim().toLowerCase() === thread.profileName.trim().toLowerCase(),
    );
    const leadHeadline = [lead?.title, lead?.company].filter(Boolean).join(" at ");
    const messages = hydratedMessages[id] || thread.messages;
    return {
      id,
      kind: "linkedin",
      title: thread.title,
      profileName: thread.profileName || thread.title,
      profileHeadline: thread.profileHeadline || leadHeadline,
      profileUrl: thread.profileUrl || lead?.linkedInUrl,
      avatarUrl: thread.avatarUrl || lead?.avatarUrl,
      status: thread.unread ? "unread" : "synced",
      unread: thread.unread,
      messages: mergeWithLocalMessages(
        messages,
        localMessages[id] || [],
      ),
      chatId: thread.id,
      accountId: thread.accountId,
      lead,
    };
  });
  const stored: InboxThread[] = conversations.map((thread) => {
    const lead = leads.find((item) => item.id === thread.leadId);
    const last = thread.messages[thread.messages.length - 1];
    return {
      id: `stored:${thread.id}`,
      kind: "stored",
      title: lead?.name || last?.senderName || "LinkedIn lead",
      profileName: lead?.name || last?.senderName || "LinkedIn lead",
      profileHeadline: [lead?.title, lead?.company].filter(Boolean).join(" at "),
      profileUrl: lead?.linkedInUrl,
      avatarUrl: lead?.avatarUrl,
      status: thread.status,
      unread: false,
      messages: mergeWithLocalMessages(
        thread.messages,
        localMessages[`stored:${thread.id}`] || [],
      ),
      lead,
    };
  });
  return [...live, ...stored].sort((a, b) => {
    const aDate = a.messages.at(-1)?.createdAt || "";
    const bDate = b.messages.at(-1)?.createdAt || "";
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function timeAgo(iso?: string) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

function Avatar({
  name,
  avatarUrl,
  size = "md",
}: {
  name: string;
  avatarUrl?: string;
  size?: "sm" | "md" | "lg";
}) {
  const cls =
    size === "lg"
      ? "h-12 w-12 text-[14px]"
      : size === "sm"
        ? "h-8 w-8 text-[11px]"
        : "h-10 w-10 text-[12px]";
  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatarUrl} alt="" className={`${cls} shrink-0 rounded-full object-cover`} />;
  }
  return (
    <div
      className={`${cls} grid shrink-0 place-items-center rounded-full bg-[#0a66c2] font-semibold text-white`}
    >
      {initials(name)}
    </div>
  );
}

function LinkedInProfileLink({
  href,
  size = "sm",
}: {
  href?: string;
  size?: "xs" | "sm";
}) {
  if (!href) return null;
  const cls = size === "xs" ? "h-[10px] w-[10px]" : "h-[13px] w-[13px]";
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Open LinkedIn profile"
      className={`${cls} inline-grid shrink-0 -translate-y-[2px] place-items-center rounded-sm transition-opacity hover:opacity-80`}
      onClick={(event) => event.stopPropagation()}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/linkedin-in-mark.svg" alt="" className="h-full w-full object-contain" />
    </a>
  );
}

const TABS: Array<{ id: "all" | "unread" | "interested" | "follow"; label: string }> = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "interested", label: "Interested" },
  { id: "follow", label: "Needs follow-up" },
];
const selectMessageData = (data: Record<string, unknown>) => ({
  conversations: data.conversations as Conversation[] || [],
  leads: data.leads as LeadPreview[] || [],
});
type SenderAccount = { accountId: string; displayName: string; avatarUrl?: string };
type LinkedInInboxResource = {
  threads: LinkedInInboxThread[];
  senderAccounts: SenderAccount[];
  error?: string;
};
const selectLinkedInInbox = (data: Record<string, unknown>): LinkedInInboxResource => ({
  threads: data.threads as LinkedInInboxThread[] || [],
  senderAccounts: data.senderAccounts as SenderAccount[] || [],
  error: typeof data.error === "string" ? data.error : undefined,
});

export default function MessagesView({
  conversations,
  leads,
  linkedInThreads = [],
  senderAccounts = [],
}: {
  conversations: Conversation[];
  leads: LeadPreview[];
  linkedInThreads?: LinkedInInboxThread[];
  senderAccounts?: Array<{ accountId: string; displayName: string; avatarUrl?: string }>;
}) {
  const router = useRouter();
  const messageDataResource = useSidebarResource(
    "conversations,leadPreviews",
    { conversations, leads },
    selectMessageData,
  );
  const { conversations: loadedConversations, leads: loadedLeads } = messageDataResource.value;
  const linkedInInboxResource = useSidebarResource(
    "linkedinInbox",
    { threads: linkedInThreads, senderAccounts },
    selectLinkedInInbox,
  );
  const linkedInInbox = linkedInInboxResource.value;
  const isInitialLoading = messageDataResource.loading || linkedInInboxResource.loading;
  const loadedLinkedInThreads = linkedInInbox.threads;
  const loadedSenderAccounts = linkedInInbox.senderAccounts;
  const linkedInInboxError = linkedInInbox.error;
  const [localMessages, setLocalMessages] = useState<Record<string, LocalMessage[]>>({});
  const [hydratedMessages, setHydratedMessages] = useState<
    Record<string, LinkedInInboxMessage[]>
  >({});
  const [historyCursors, setHistoryCursors] = useState<Record<string, string | undefined>>({});
  const [historyLoadingIds, setHistoryLoadingIds] = useState<Set<string>>(new Set());
  // LinkedIn threads whose message-history fetch has completed (even if it came
  // back empty). Until a thread has settled, the detail pane shows a loading
  // indicator instead of "No messages yet".
  const [hydrationSettledIds, setHydrationSettledIds] = useState<Set<string>>(new Set());
  const threads = useMemo(
    () =>
      buildThreads(
        loadedConversations || [],
        loadedLeads || [],
        loadedLinkedInThreads || [],
        hydratedMessages,
        localMessages,
      ),
    [loadedConversations, loadedLeads, loadedLinkedInThreads, hydratedMessages, localMessages],
  );
  const [tab, setTab] = useState<"all" | "unread" | "interested" | "follow">("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>(threads[0]?.id ?? "");
  const [isMobileConversationOpen, setIsMobileConversationOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (selectedId || !threads[0]) return;
    const frame = requestAnimationFrame(() => setSelectedId(threads[0].id));
    return () => cancelAnimationFrame(frame);
  }, [threads, selectedId]);

  // Surface inbox load failures in the console only - the UI shows the normal
  // empty state instead of a raw provider error.
  useEffect(() => {
    if (linkedInInboxError) console.error("LinkedIn inbox failed to load:", linkedInInboxError);
  }, [linkedInInboxError]);

  useEffect(() => {
    const refresh = () => router.refresh();
    const interval = window.setInterval(refresh, 5000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router]);

  const filtered = useMemo(() => {
    return threads.filter((thread) => {
      if (tab === "unread" && !thread.unread) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!thread.profileName.toLowerCase().includes(q)) {
          const last = thread.messages.at(-1);
          if (!last || !last.body.toLowerCase().includes(q)) return false;
        }
      }
      return true;
    });
  }, [threads, tab, search]);

  const counts = useMemo(() => {
    return {
      all: threads.length,
      unread: threads.filter((thread) => thread.unread).length,
      interested: 0,
      follow: 0,
    };
  }, [threads]);

  const selected = filtered.find((thread) => thread.id === selectedId) ?? filtered[0];
  const senderAccount =
    (selected?.kind === "linkedin"
      ? loadedSenderAccounts.find((account) => account.accountId === selected.accountId)
      : undefined) ?? loadedSenderAccounts[0];

  useEffect(() => {
    if (!selected || selected.kind !== "linkedin" || hydratedMessages[selected.id]) return;
    const controller = new AbortController();
    const threadId = selected.id;
    const params = new URLSearchParams({
      chatId: selected.chatId,
      accountId: selected.accountId,
    });

    void fetch(`/api/agent/v1/linkedin-chat-messages?${params}`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { messages?: LinkedInInboxMessage[]; cursor?: string } | null) => {
        if (!data) return;
        setHistoryCursors((current) => ({ ...current, [threadId]: data.cursor }));
        if (!data.messages?.length) return;
        setHydratedMessages((current) => ({ ...current, [threadId]: data.messages || [] }));
      })
      .catch(() => {})
      .finally(() => {
        if (controller.signal.aborted) return;
        setHydrationSettledIds((current) => new Set(current).add(threadId));
      });

    return () => controller.abort();
  }, [hydratedMessages, selected]);

  function loadMoreMessages(thread: Extract<InboxThread, { kind: "linkedin" }>) {
    const cursor = historyCursors[thread.id];
    if (!cursor || historyLoadingIds.has(thread.id)) return;
    setHistoryLoadingIds((current) => new Set(current).add(thread.id));
    const params = new URLSearchParams({
      chatId: thread.chatId,
      accountId: thread.accountId,
      cursor,
    });
    void fetch(`/api/agent/v1/linkedin-chat-messages?${params}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { messages?: LinkedInInboxMessage[]; cursor?: string } | null) => {
        if (!data) return;
        setHydratedMessages((current) => {
          const merged = [...(current[thread.id] || []), ...(data.messages || [])];
          return {
            ...current,
            [thread.id]: Array.from(new Map(merged.map((message) => [message.id, message])).values())
              .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
          };
        });
        setHistoryCursors((current) => ({ ...current, [thread.id]: data.cursor }));
      })
      .finally(() => {
        setHistoryLoadingIds((current) => {
          const next = new Set(current);
          next.delete(thread.id);
          return next;
        });
      });
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [selected?.id, selected?.messages.length]);

  function addLocalMessage(thread: Extract<InboxThread, { kind: "linkedin" }>, body: string) {
    const createdAt = new Date().toISOString();
    const message: LocalMessage = {
      id: `local:${thread.id}:${createdAt}`,
      chatId: thread.chatId,
      direction: "outbound",
      senderName: "You",
      body,
      createdAt,
      local: true,
    };
    setLocalMessages((current) => ({
      ...current,
      [thread.id]: [...(current[thread.id] || []), message],
    }));
  }

  return (
    <div className="app-x flex h-full min-h-0 min-w-0 flex-col gap-3 md:ml-4 md:mr-0.5 md:pb-3">
      {/* Header */}
      <div className="contents md:flex md:shrink-0 md:items-center md:justify-between md:gap-3 md:pt-6">
        <div className="hidden min-w-0 md:block">
          <h1 className="text-2xl font-semibold leading-none tracking-tight text-[var(--md-sys-color-on-surface)] sm:text-3xl">
            Messages
          </h1>
        </div>
        <MobileHeaderPortal>
          <div className="m3-mobile-header-action fixed right-2 z-[92] w-[152px] md:hidden">
            <TextField
              className="m3-text-field--compact [&_.m3-text-field__input]:pl-2"
              variant="filled"
              placeholder="Search messages"
              aria-label="Search messages"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              leadingIcon={
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              }
            />
          </div>
        </MobileHeaderPortal>
        <div className="hidden w-52 md:block">
          <TextField
            className="m3-text-field--compact"
            variant="filled"
            placeholder="Search conversations"
            aria-label="Search conversations"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            leadingIcon={
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Tabs */}
      <div
        className={`shrink-0 items-center gap-6 overflow-x-auto border-b border-zinc-200 pt-4 md:pt-0 ${
          isMobileConversationOpen ? "hidden lg:flex" : "flex"
        }`}
      >
        {TABS.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`relative -mb-px flex cursor-pointer items-center gap-1.5 pb-2.5 text-[13px] font-semibold transition-colors ${
                active ? "text-zinc-950" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              {item.label}
              <span
                className={`rounded-full px-1.5 text-[11px] font-semibold ${
                  active ? "bg-[#ffe8ea] text-[#e85e6b]" : "bg-zinc-100 text-zinc-700"
                }`}
              >
                {counts[item.id]}
              </span>
              {active ? (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-zinc-950" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Body card */}
      <section className="m3-card m3-card-elevated m3-card-lg m3-lateral-viewport flex min-h-0 flex-1 overflow-y-auto lg:overflow-hidden">
        {isInitialLoading ? (
          <MessagesInboxSkeleton />
        ) : threads.length === 0 ? (
          <ContentReveal className="grid flex-1 place-items-center px-6 py-10 text-center">
            <div>
              <span className="material-symbols-outlined text-3xl text-zinc-400">chat_bubble</span>
              <h2 className="mt-3 text-sm font-semibold text-zinc-900">No conversations yet</h2>
              <p className="mx-auto mt-1 max-w-sm text-xs text-zinc-500">
                Connect LinkedIn to show conversations here. Replies will also appear after a lead
                responds.
              </p>
            </div>
          </ContentReveal>
        ) : (
          <ContentReveal className="grid min-h-full flex-1 grid-cols-1 lg:min-h-0 lg:grid-cols-[320px_1fr]">
            {/* Inbox list — Pattern C lateral on peer tab switch */}
            <aside
              key={tab}
              className={`m3-lateral-panel ${
                isMobileConversationOpen ? "hidden lg:flex" : "flex"
              } h-full min-h-0 flex-col border-b border-zinc-200 lg:h-auto lg:border-b-0 lg:border-r`}
            >
              <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 bg-zinc-50/60 px-4 py-3">
                <span
                  style={{ fontFamily: "var(--font-varta)" }}
                  className="text-[11px] font-bold uppercase tracking-wider text-zinc-700"
                >
                  Inbox
                </span>
                <button
                  type="button"
                  className="flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-zinc-700 hover:text-zinc-900"
                >
                  Newest
                  <svg
                    className="h-3 w-3 text-zinc-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="grid h-full place-items-center px-4 text-center text-[12px] font-medium text-zinc-700">
                    No conversations match.
                  </div>
                ) : (
                  filtered.map((thread) => {
                    const last = thread.messages.at(-1);
                    const isActive = selected?.id === thread.id;
                    return (
                      <button
                        key={thread.id}
                        type="button"
                        onClick={() => {
                          setSelectedId(thread.id);
                          setIsMobileConversationOpen(true);
                        }}
                        className={`flex w-full items-start gap-3 border-b border-zinc-100 px-4 py-3.5 text-left transition-colors ${
                          isActive
                            ? "bg-[#fff5f6]/60 dark:bg-[var(--google-surface-high)]"
                            : "hover:bg-zinc-50/70"
                        }`}
                      >
                        <Avatar
                          name={thread.profileName}
                          avatarUrl={thread.avatarUrl}
                          size="md"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="flex min-w-0 items-center gap-[5px]">
                              <span className="truncate text-[13px] font-semibold text-zinc-950">
                                {thread.profileName}
                              </span>
                              <LinkedInProfileLink href={thread.profileUrl} size="xs" />
                            </span>
                            <span className="shrink-0 text-[11px] font-medium text-zinc-600">
                              {timeAgo(last?.createdAt)}
                            </span>
                          </div>
                          {thread.profileHeadline ? (
                            <div className="truncate text-[11px] font-medium text-zinc-700">
                              {thread.profileHeadline}
                            </div>
                          ) : null}
                          <div className="mt-1 truncate text-[12px] font-medium text-zinc-700">
                            {last
                              ? `${last.direction === "outbound" ? "You: " : ""}${last.body}`
                              : "No messages yet"}
                          </div>
                          {thread.unread ? (
                            <span className="mt-1.5 inline-flex rounded-full bg-[#ffe8ea] px-2 py-0.5 text-[10px] font-semibold text-[#e85e6b]">
                              Unread
                            </span>
                          ) : null}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </aside>

            {/* Conversation */}
            <section
              className={`${
                isMobileConversationOpen ? "flex" : "hidden lg:flex"
              } min-h-[460px] min-w-0 flex-col border-b border-zinc-200 lg:min-h-0 lg:border-b-0`}
            >
              {selected ? (
                <>
                  <div className="flex shrink-0 flex-col items-start justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3.5 sm:flex-row sm:items-center sm:px-5">
                    <div className="flex min-w-0 items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIsMobileConversationOpen(false)}
                        aria-label="Back to inbox"
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-zinc-700 transition hover:bg-zinc-100 lg:hidden"
                      >
                        <span className="material-symbols-outlined text-[20px] leading-none">arrow_back</span>
                      </button>
                      <Avatar
                        name={selected.profileName}
                        avatarUrl={selected.avatarUrl}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            style={{ fontFamily: "var(--font-varta)" }}
                            className="truncate text-[14px] font-semibold text-zinc-950"
                          >
                            {selected.profileName}
                          </span>
                          <LinkedInProfileLink href={selected.profileUrl} />
                        </div>
                        {selected.profileHeadline ? (
                          <div className="whitespace-normal text-[12px] font-medium leading-4 text-zinc-700 md:truncate">
                            {selected.profileHeadline}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#fbfaf6] p-4 sm:p-5">
                    {selected.messages.length === 0 ? (
                      selected.kind === "linkedin" && !hydrationSettledIds.has(selected.id) ? (
                        <MessageBubblesSkeleton />
                      ) : (
                        <p className="text-center text-[12px] font-medium text-zinc-700">No messages yet.</p>
                      )
                    ) : (
                      <ContentReveal className="space-y-3">
                      {selected.messages.map((message, index) => {
                        const outbound = message.direction === "outbound";
                        const previous = selected.messages[index - 1];
                        const showDate =
                          !previous ||
                          new Date(previous.createdAt).toDateString() !==
                            new Date(message.createdAt).toDateString();
                        return (
                          <div key={message.id}>
                            {showDate ? (
                              <div className="mb-3 flex justify-center">
                                <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-zinc-700">
                                  {new Date(message.createdAt).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                              </div>
                            ) : null}
                            <div
                              className={`flex ${outbound ? "justify-end" : "justify-start"} gap-2`}
                            >
                              {!outbound ? (
                                <Avatar
                                  name={selected.profileName}
                                  avatarUrl={selected.avatarUrl}
                                  size="sm"
                                />
                              ) : null}
                              <div
                                className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[13px] leading-5 shadow-sm sm:max-w-[75%] ${
                                  outbound
                                    ? "rounded-tr-md border border-[#0a66c2] bg-white text-zinc-900"
                                    : "rounded-tl-md border border-[#0a66c2] bg-white text-zinc-900"
                                }`}
                              >
                                <div className="whitespace-pre-wrap break-words">{message.body}</div>
                                <div className="mt-1 text-[10px] font-medium text-zinc-600">
                                  {timeAgo(message.createdAt)}
                                </div>
                              </div>
                              {outbound ? (
                                <Avatar
                                  name={senderAccount?.displayName || "You"}
                                  avatarUrl={senderAccount?.avatarUrl}
                                  size="sm"
                                />
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                      </ContentReveal>
                    )}
                    {selected.kind === "linkedin" && historyCursors[selected.id] ? (
                      <div className="flex justify-center pt-1">
                        <button
                          type="button"
                          onClick={() => loadMoreMessages(selected)}
                          disabled={historyLoadingIds.has(selected.id)}
                          className="h-8 rounded-md border border-zinc-200 bg-white px-3 text-[12px] font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {historyLoadingIds.has(selected.id) ? "Loading..." : "Load next 30 messages"}
                        </button>
                      </div>
                    ) : null}
                    <div ref={messagesEndRef} />
                  </div>

                  {selected.kind === "linkedin" ? (
                    <Composer
                      selected={selected}
                      onSent={(body) => {
                        addLocalMessage(selected, body);
                        router.refresh();
                      }}
                    />
                  ) : (
                    <div className="border-t border-zinc-200 bg-zinc-50/60 px-5 py-3 text-center text-[12px] font-medium text-zinc-700">
                      Replies sync from LinkedIn - open this thread there to reply.
                    </div>
                  )}
                </>
              ) : (
                <div className="grid h-full place-items-center text-[13px] font-medium text-zinc-700">
                  Select a conversation.
                </div>
              )}
            </section>
          </ContentReveal>
        )}
      </section>
    </div>
  );
}

function Composer({
  selected,
  onSent,
}: {
  selected: Extract<InboxThread, { kind: "linkedin" }>;
  onSent: (body: string) => void;
}) {
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = body.trim();
    const attachments = files;
    if ((!message && !attachments.length) || isSending) return;
    setBody("");
    setFiles([]);
    setIsSending(true);
    void (async () => {
      const formData = new FormData();
      formData.set("chatId", selected.chatId);
      formData.set("accountId", selected.accountId);
      formData.set("body", message);
      for (const file of attachments) {
        formData.append("attachments", file);
      }
      try {
        await sendLinkedInChatMessageAction(formData);
        onSent(message || `📎 ${attachments.map((file) => file.name).join(", ")}`);
      } catch (caught) {
        // Restore the draft so nothing is lost; keep the failure out of the UI.
        setBody(message);
        setFiles(attachments);
        console.error("Message failed to send:", caught);
      } finally {
        setIsSending(false);
      }
    })();
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-zinc-200 bg-white p-3">
      {files.length ? (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {files.map((file, index) => (
            <span
              key={`${file.name}-${index}`}
              className="flex items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-medium text-zinc-700"
            >
              <svg
                className="h-3 w-3 shrink-0 text-zinc-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
              <span className="max-w-40 truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                aria-label={`Remove ${file.name}`}
                className="cursor-pointer text-zinc-600 hover:text-zinc-900"
              >
                <svg
                  className="h-3 w-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <div className="flex min-h-12 items-end gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition-colors focus-within:border-zinc-900">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => {
            const picked = Array.from(event.target.files || []);
            if (picked.length) setFiles((current) => [...current, ...picked]);
            event.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending}
          aria-label="Attach file"
          className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-md text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          disabled={isSending}
          placeholder={`Reply to ${selected.profileName}...`}
          rows={1}
          className="max-h-28 min-h-8 min-w-0 flex-1 resize-none border-0 bg-transparent py-1 pl-2 text-[13px] leading-5 text-zinc-900 shadow-none outline-none placeholder:text-zinc-400 disabled:text-zinc-400"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <button
          type="submit"
          disabled={isSending || (!body.trim() && !files.length)}
          className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-md bg-[#0a66c2] text-white transition-colors hover:bg-[#004182] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#0a66c2]"
          aria-label="Send"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 19V5" />
            <path d="m5 12 7-7 7 7" />
          </svg>
        </button>
      </div>
    </form>
  );
}
