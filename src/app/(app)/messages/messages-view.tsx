"use client";

import { unwrapAction } from "@/lib/action-result";
import { userFacingError } from "@/app/toast";
import { FormEvent, useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  completeConversationManualFollowUpAction,
  sendLeadReplyAction,
  sendLinkedInChatMessageAction,
} from "@/app/actions";
import { useSidebarResource } from "@/app/use-sidebar-resource";
import { ContentReveal, MessagesInboxSkeleton, Skeleton } from "@/app/app-skeletons";
import type {
  Conversation,
  ConversationMessage,
  LeadPreview,
  LinkedInInboxAttachment,
  LinkedInInboxMessage,
  LinkedInInboxThread,
} from "@/lib/server/types";
import { TextField } from "@/app/ui/text-field";
import MobileHeaderPortal from "@/app/mobile-header-portal";
import { useWorkspaceTimeZone } from "@/app/workspace-time-zone";
import { formatZonedDate, formatZonedDateTime, zonedDayKey } from "@/lib/time-zone";
import {
  conversationCategory,
  conversationHasMeetingBooked,
  type ConversationCategory,
} from "@/lib/conversation-category";
import { pickLeadForProviderIdentity } from "@/lib/linkedin-identity";
import {
  dedupeLinkedInInboxThreads,
  storedConversationIsLiveMirror,
} from "@/lib/inbox-threads";
import { LeadAvatar } from "@/app/lead-avatar";

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
      // Newest message id from the polled inbox list; a change means the
      // loaded history is behind and must be refetched.
      latestMessageId?: string;
      chatId: string;
      accountId: string;
      lead?: LeadPreview;
      conversation?: Conversation;
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
      conversation: Conversation;
    };

type LocalMessage = LinkedInInboxMessage & { local: true };

// Chat history fetched this session. Kept outside the component so returning
// to Messages paints each opened chat in full at once, instead of the preview
// line first and the history popping in after a refetch.
const chatHistoryCache = {
  messages: {} as Record<string, LinkedInInboxMessage[]>,
  cursors: {} as Record<string, string | undefined>,
  settledIds: new Set<string>(),
  leadChats: {} as Record<string, LeadChat>,
};

// The live LinkedIn chat found for a stored conversation that is older than
// the inbox page. Once found, the thread shows LinkedIn's history, not the
// stored copy, which misses anything Omentir did not record.
type LeadChat = { chatId: string; accountId: string };
type HistoryPage = {
  messages?: LinkedInInboxMessage[];
  cursor?: string;
  chatId?: string | null;
  accountId?: string;
};

function mergeMessagesById(messages: LinkedInInboxMessage[], incoming: LinkedInInboxMessage[]) {
  return Array.from(new Map([...messages, ...incoming].map((message) => [message.id, message])).values())
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

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
  leadChats: Record<string, LeadChat> = {},
): InboxThread[] {
  const uniqueLive = dedupeLinkedInInboxThreads(linkedInThreads);
  const live: InboxThread[] = uniqueLive.map((thread) => {
    const id = `linkedin:${thread.id}`;
    const lead = pickLeadForProviderIdentity(leads, {
      providerProfileId: thread.attendeeProviderId,
      linkedInUrl: thread.profileUrl,
      name: thread.profileName,
    }) || undefined;
    const leadHeadline = [lead?.title, lead?.company].filter(Boolean).join(" at ");
    // The inbox poll carries each chat's newest message. Merge it into the
    // loaded history so a new message shows right away instead of waiting for
    // the history refetch.
    const hydrated = hydratedMessages[id];
    const messages = hydrated
      ? mergeMessagesById(hydrated, thread.messages.filter((message) => message.body))
      : thread.messages;
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
      latestMessageId: thread.messages.at(-1)?.id,
      chatId: thread.id,
      accountId: thread.accountId,
      lead,
      conversation: lead
        ? conversations.find((conversation) => conversation.leadId === lead.id)
        : undefined,
    };
  });
  const stored: InboxThread[] = conversations.flatMap((thread): InboxThread[] => {
    const lead = leads.find((item) => item.id === thread.leadId);
    if (storedConversationIsLiveMirror(uniqueLive, lead, thread.messages)) return [];
    const id = `stored:${thread.id}`;
    const last = thread.messages[thread.messages.length - 1];
    const base = {
      id,
      title: lead?.name || last?.senderName || "LinkedIn lead",
      profileName: lead?.name || last?.senderName || "LinkedIn lead",
      profileHeadline: [lead?.title, lead?.company].filter(Boolean).join(" at "),
      profileUrl: lead?.linkedInUrl,
      avatarUrl: lead?.avatarUrl,
      status: thread.status,
      unread: false,
      lead,
      conversation: thread,
    };
    const leadChat = leadChats[id];
    const hydrated = hydratedMessages[id];
    if (leadChat && hydrated) {
      return [{
        ...base,
        kind: "linkedin",
        messages: mergeWithLocalMessages(hydrated, localMessages[id] || []),
        // A new stored message means LinkedIn has one too; refetch on change.
        latestMessageId: last?.id,
        chatId: leadChat.chatId,
        accountId: leadChat.accountId,
      }];
    }
    return [{
      ...base,
      kind: "stored",
      messages: mergeWithLocalMessages(thread.messages, localMessages[id] || []),
    }];
  });
  return [...live, ...stored].sort((a, b) => {
    const aDate = a.messages.at(-1)?.createdAt || "";
    const bDate = b.messages.at(-1)?.createdAt || "";
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });
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
  leadId,
  size = "md",
}: {
  name: string;
  avatarUrl?: string;
  leadId?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "lg"
      ? "h-12 w-12"
      : size === "sm"
        ? "h-8 w-8"
        : "h-10 w-10";
  const textClass =
    size === "lg"
      ? "text-[14px]"
      : size === "sm"
        ? "text-[11px]"
        : "text-[12px]";
  return (
    <LeadAvatar
      name={name}
      avatarUrl={avatarUrl}
      leadId={leadId}
      className={`${sizeClass} bg-[#0a66c2]`}
      initialsClassName={`${textClass} font-semibold text-white`}
    />
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

type DisplayMessage = ConversationMessage &
  Partial<
    Pick<LinkedInInboxMessage, "subject" | "attachments" | "reactions" | "event" | "deleted">
  >;

const DELETED_MESSAGE = "This message has been deleted.";

const ATTACHMENT_LABELS: Record<string, string> = {
  img: "Photo",
  video: "Video",
  audio: "Voice message",
  linkedin_post: "LinkedIn post",
};

function attachmentLabel(attachment: LinkedInInboxAttachment) {
  return attachment.name || ATTACHMENT_LABELS[attachment.type] || "Attachment";
}

function messagePreview(message: DisplayMessage) {
  if (message.deleted) return DELETED_MESSAGE;
  return message.body || (message.attachments?.[0] ? attachmentLabel(message.attachments[0]) : "");
}

function attachmentSrc(messageId: string, attachment: LinkedInInboxAttachment, accountId: string) {
  const params = new URLSearchParams({ messageId, attachmentId: attachment.id, accountId });
  if (attachment.name) params.set("name", attachment.name);
  return `/api/agent/v1/linkedin-chat-attachment?${params}`;
}

// A message as LinkedIn shows it: InMail subject, text, photos and files,
// then the reactions it received.
function MessageContent({ message, accountId }: { message: DisplayMessage; accountId?: string }) {
  const reactionCounts = new Map<string, number>();
  for (const reaction of message.reactions || []) {
    reactionCounts.set(reaction, (reactionCounts.get(reaction) || 0) + 1);
  }
  return (
    <>
      {message.subject ? <div className="font-semibold">{message.subject}</div> : null}
      {message.deleted ? <div className="italic text-zinc-600">{DELETED_MESSAGE}</div> : null}
      {message.body ? <div className="whitespace-pre-wrap break-words">{message.body}</div> : null}
      {message.attachments?.map((attachment) => {
        const label = attachmentLabel(attachment);
        const href =
          attachment.url ||
          (accountId && !attachment.unavailable
            ? attachmentSrc(message.id, attachment, accountId)
            : undefined);
        if (!href) {
          return (
            <div key={attachment.id} className="mt-1 text-[12px] italic text-zinc-600">
              {label} unavailable
            </div>
          );
        }
        if (attachment.type === "img" && !attachment.url) {
          return (
            <a key={attachment.id} href={href} target="_blank" rel="noreferrer" className="mt-1 block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={href} alt={label} className="max-h-64 max-w-full rounded-lg" loading="lazy" />
            </a>
          );
        }
        if (attachment.type === "video" && !attachment.url) {
          return <video key={attachment.id} src={href} controls className="mt-1 max-h-64 max-w-full rounded-lg" />;
        }
        if (attachment.type === "audio" && !attachment.url) {
          return <audio key={attachment.id} src={href} controls className="mt-1 max-w-full" />;
        }
        return (
          <a
            key={attachment.id}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="mt-1 flex items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-[12px] font-medium text-zinc-800 hover:bg-zinc-100"
          >
            <span className="material-symbols-outlined text-[16px] leading-none">attach_file</span>
            <span className="truncate">{label}</span>
          </a>
        );
      })}
      {reactionCounts.size ? (
        <div className="mt-1 flex flex-wrap gap-1">
          {Array.from(reactionCounts, ([emoji, count]) => (
            <span
              key={emoji}
              className="rounded-full border border-zinc-200 bg-zinc-50 px-1.5 text-[11px] leading-5"
            >
              {emoji}
              {count > 1 ? ` ${count}` : ""}
            </span>
          ))}
        </div>
      ) : null}
    </>
  );
}

type MessageTab = "all" | "booked" | ConversationCategory;

const TABS: Array<{ id: MessageTab; label: string }> = [
  { id: "all", label: "All" },
  { id: "successful", label: "Successful" },
  { id: "booked", label: "Meetings booked" },
  { id: "interested", label: "Interested" },
  { id: "follow", label: "Needs a follow up" },
  { id: "denied", label: "Denied" },
];
const selectConversations = (data: Record<string, unknown>) =>
  (data.conversations as Conversation[]) || [];
const selectLeads = (data: Record<string, unknown>) => (data.leads as LeadPreview[]) || [];
// Conversations and the live inbox refresh every few seconds. Leads rarely
// change and reading all of them is the expensive query (12 MB on the largest
// workspace), so they refresh every 5 minutes, or on return to the tab once
// they are a minute old.
const POLL_INTERVAL_MS = 5000;
const LEAD_REFRESH_MS = 5 * 60_000;
const LEAD_RETURN_REFRESH_MS = 60_000;
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
  const timeZone = useWorkspaceTimeZone();
  const conversationsResource = useSidebarResource(
    "conversations",
    conversations,
    selectConversations,
  );
  const leadsResource = useSidebarResource("leadPreviews", leads, selectLeads);
  const loadedConversations = conversationsResource.value;
  const loadedLeads = leadsResource.value;
  const reloadConversations = conversationsResource.reload;
  const reloadLeads = leadsResource.reload;
  const linkedInInboxResource = useSidebarResource(
    "linkedinInbox",
    { threads: linkedInThreads, senderAccounts },
    selectLinkedInInbox,
  );
  const linkedInInbox = linkedInInboxResource.value;
  const reloadLinkedInInbox = linkedInInboxResource.reload;
  const isInitialLoading =
    conversationsResource.loading || leadsResource.loading || linkedInInboxResource.loading;
  const loadedLinkedInThreads = linkedInInbox.threads;
  const loadedSenderAccounts = linkedInInbox.senderAccounts;
  const linkedInInboxError = linkedInInbox.error;
  const [localMessages, setLocalMessages] = useState<Record<string, LocalMessage[]>>({});
  const [hydratedMessages, setHydratedMessages] = useState<
    Record<string, LinkedInInboxMessage[]>
  >(chatHistoryCache.messages);
  const [historyCursors, setHistoryCursors] = useState<Record<string, string | undefined>>(
    chatHistoryCache.cursors,
  );
  const [historyLoadingIds, setHistoryLoadingIds] = useState<Set<string>>(new Set());
  // Chats whose last history fetch failed. They show the preview they have and
  // a retry link, instead of quietly looking like a one-message conversation.
  const [historyErrorIds, setHistoryErrorIds] = useState<Set<string>>(new Set());
  const [historyRetry, setHistoryRetry] = useState(0);
  // LinkedIn threads whose message-history fetch has completed (even if it came
  // back empty). Until a thread has settled, the detail pane stays blank
  // instead of showing "No messages yet".
  const [hydrationSettledIds, setHydrationSettledIds] = useState<Set<string>>(
    chatHistoryCache.settledIds,
  );
  const [leadChats, setLeadChats] = useState<Record<string, LeadChat>>(
    chatHistoryCache.leadChats,
  );
  useEffect(() => {
    chatHistoryCache.messages = hydratedMessages;
    chatHistoryCache.cursors = historyCursors;
    chatHistoryCache.settledIds = hydrationSettledIds;
    chatHistoryCache.leadChats = leadChats;
  }, [hydratedMessages, historyCursors, hydrationSettledIds, leadChats]);
  const threads = useMemo(
    () =>
      buildThreads(
        loadedConversations || [],
        loadedLeads || [],
        loadedLinkedInThreads || [],
        hydratedMessages,
        localMessages,
        leadChats,
      ),
    [
      loadedConversations,
      loadedLeads,
      loadedLinkedInThreads,
      hydratedMessages,
      localMessages,
      leadChats,
    ],
  );
  const [tab, setTab] = useState<MessageTab>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>(threads[0]?.id ?? "");
  const [isMobileConversationOpen, setIsMobileConversationOpen] = useState(false);
  const [isCompletingFollowUp, startCompletingFollowUp] = useTransition();
  const [followUpError, setFollowUpError] = useState("");
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
    let leadsLoadedAt = Date.now();
    const refresh = (leadsMaxAgeMs: number) => {
      // A background tab needs no live inbox; it refreshes when shown again.
      if (document.hidden) return;
      reloadConversations();
      reloadLinkedInInbox();
      if (Date.now() - leadsLoadedAt < leadsMaxAgeMs) return;
      leadsLoadedAt = Date.now();
      reloadLeads();
    };
    const poll = () => refresh(LEAD_REFRESH_MS);
    const refreshAll = () => refresh(LEAD_RETURN_REFRESH_MS);
    const interval = window.setInterval(poll, POLL_INTERVAL_MS);
    window.addEventListener("focus", refreshAll);
    document.addEventListener("visibilitychange", refreshAll);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshAll);
      document.removeEventListener("visibilitychange", refreshAll);
    };
  }, [reloadConversations, reloadLeads, reloadLinkedInInbox]);

  const filtered = useMemo(() => {
    return threads.filter((thread) => {
      if (tab === "booked" && !conversationHasMeetingBooked(thread.conversation)) return false;
      if (
        tab !== "all" &&
        tab !== "booked" &&
        conversationCategory(thread.conversation) !== tab
      ) return false;
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
      successful: threads.filter(
        (thread) => conversationCategory(thread.conversation) === "successful",
      ).length,
      booked: threads.filter((thread) => conversationHasMeetingBooked(thread.conversation)).length,
      interested: threads.filter(
        (thread) => conversationCategory(thread.conversation) === "interested",
      ).length,
      follow: threads.filter(
        (thread) => conversationCategory(thread.conversation) === "follow",
      ).length,
      denied: threads.filter(
        (thread) => conversationCategory(thread.conversation) === "denied",
      ).length,
    };
  }, [threads]);

  const selected = filtered.find((thread) => thread.id === selectedId) ?? filtered[0];
  const selectedCategory = conversationCategory(selected?.conversation);
  const senderAccount =
    (selected?.kind === "linkedin"
      ? loadedSenderAccounts.find((account) => account.accountId === selected.accountId)
      : undefined) ?? loadedSenderAccounts[0];

  // Loads the newest page of history when a chat is opened, and again whenever
  // the inbox poll reports a newer message. Fetched once and never refreshed,
  // the history froze and hid every message sent or received after opening.
  // Primitive deps keep the 5s poll from re-running (and aborting) this.
  // Stored conversations ask by lead, and keep doing so after their live chat
  // is found, so finding it does not load the history a second time.
  const historyQuery = !selected
    ? ""
    : selected.id.startsWith("stored:")
      ? selected.lead
        ? new URLSearchParams({ leadId: selected.lead.id }).toString()
        : ""
      : selected.kind === "linkedin"
        ? new URLSearchParams({ chatId: selected.chatId, accountId: selected.accountId }).toString()
        : "";
  const historyThreadId = historyQuery ? selected?.id : undefined;
  const historyLatestId =
    selected?.kind === "linkedin"
      ? selected.latestMessageId
      : selected?.conversation?.messages.at(-1)?.id;
  useEffect(() => {
    if (!historyThreadId || !historyQuery) return;
    const controller = new AbortController();
    const threadId = historyThreadId;

    const markHistoryError = (failed: boolean) =>
      setHistoryErrorIds((current) => {
        if (current.has(threadId) === failed) return current;
        const next = new Set(current);
        if (failed) next.add(threadId);
        else next.delete(threadId);
        return next;
      });

    void fetch(`/api/agent/v1/linkedin-chat-messages?${historyQuery}`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`History request failed: ${response.status}`);
        return response.json();
      })
      .then((data: HistoryPage) => {
        markHistoryError(false);
        const { chatId, accountId } = data;
        if (chatId && accountId) {
          setLeadChats((current) =>
            current[threadId]?.chatId === chatId && current[threadId]?.accountId === accountId
              ? current
              : { ...current, [threadId]: { chatId, accountId } },
          );
        }
        // Keep the cursor from the first load so "Load next 30" still pages
        // past history the user already loaded.
        setHistoryCursors((current) =>
          current[threadId] ? current : { ...current, [threadId]: data.cursor },
        );
        if (!data.messages?.length) return;
        const page = data.messages;
        setHydratedMessages((current) => ({
          ...current,
          [threadId]: mergeMessagesById(current[threadId] || [], page),
        }));
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error("LinkedIn chat history failed to load:", error);
        markHistoryError(true);
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setHydrationSettledIds((current) => new Set(current).add(threadId));
      });

    return () => controller.abort();
  }, [historyThreadId, historyQuery, historyLatestId, historyRetry]);

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
      .then((response) => {
        if (!response.ok) throw new Error(`History request failed: ${response.status}`);
        return response.json();
      })
      .then((data: HistoryPage) => {
        setHydratedMessages((current) => ({
          ...current,
          [thread.id]: mergeMessagesById(current[thread.id] || [], data.messages || []),
        }));
        setHistoryCursors((current) => ({ ...current, [thread.id]: data.cursor }));
      })
      .catch((error) => {
        console.error("Older LinkedIn messages failed to load:", error);
        setHistoryErrorIds((current) => new Set(current).add(thread.id));
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

  function addLocalMessage(thread: InboxThread, body: string) {
    const createdAt = new Date().toISOString();
    const message: LocalMessage = {
      id: `local:${thread.id}:${createdAt}`,
      chatId: thread.chatId || "",
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

  function completeSelectedFollowUp() {
    if (!selected?.conversation || isCompletingFollowUp) return;
    const formData = new FormData();
    formData.set("leadId", selected.conversation.leadId);
    setFollowUpError("");
    startCompletingFollowUp(async () => {
      try {
        unwrapAction(await completeConversationManualFollowUpAction(formData));
        reloadConversations();
        router.refresh();
      } catch (error) {
        setFollowUpError(userFacingError(error, "Could not mark this follow-up done."));
      }
    });
  }

  return (
    <div className="app-x flex h-full min-h-0 min-w-0 flex-col gap-3 md:mr-0.5 md:pb-3">
      {/* Header */}
      <div className="contents md:flex md:shrink-0 md:items-center md:justify-between md:gap-3 md:pt-6">
        <div className="hidden min-w-0 md:block">
          <h1 className="text-2xl font-semibold leading-none tracking-tight text-[var(--md-sys-color-on-surface)]">
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
                  className="h-3.5 w-3.5"
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
                className="h-3.5 w-3.5"
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
              className={`relative -mb-px flex cursor-pointer items-center gap-1.5 pb-2.5 text-[13px] font-semibold ${
                active ? "text-zinc-950" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              {item.label}
              {/* Counts from half-loaded data read as real zeros, so they wait. */}
              {isInitialLoading ? (
                <Skeleton className="h-[11px] w-5 rounded-full" />
              ) : (
                <span
                  className={`rounded-full px-1.5 text-[11px] font-semibold ${
                    active ? "bg-[#ffe8ea] text-[#e85e6b]" : "bg-zinc-100 text-zinc-700"
                  }`}
                >
                  {counts[item.id]}
                </span>
              )}
              {active ? (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-zinc-950" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Body card */}
      <section className="m3-card m3-card-elevated m3-card-lg flex min-h-0 flex-1 overflow-y-auto lg:overflow-hidden">
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
            <aside
              className={`${
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
                        className={`flex w-full items-start gap-3 border-b border-zinc-100 px-4 py-3.5 text-left ${
                          isActive
                            ? "bg-[#fff5f6]/60 dark:bg-[var(--google-surface-high)]"
                            : "hover:bg-zinc-50/70"
                        }`}
                      >
                        <Avatar
                          name={thread.profileName}
                          avatarUrl={thread.avatarUrl}
                          leadId={thread.lead?.id}
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
                              ? `${last.direction === "outbound" ? "You: " : ""}${messagePreview(last)}`
                              : "No messages yet"}
                          </div>
                          {thread.unread || conversationHasMeetingBooked(thread.conversation) ? (
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {thread.unread ? (
                                <span className="inline-flex rounded-full bg-[#ffe8ea] px-2 py-0.5 text-[10px] font-semibold text-[#e85e6b]">
                                  Unread
                                </span>
                              ) : null}
                              {conversationHasMeetingBooked(thread.conversation) ? (
                                <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                                  Meeting booked
                                </span>
                              ) : null}
                            </div>
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
                  <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3.5 sm:px-5">
                    {/* The follow-up banner wraps under the name when the pane
                        is too narrow, instead of squeezing and clipping. */}
                    <div className="flex min-w-[12rem] flex-1 items-center gap-3">
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
                        leadId={selected.lead?.id}
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
                          {conversationHasMeetingBooked(selected.conversation) ? (
                            <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                              Meeting booked
                            </span>
                          ) : null}
                        </div>
                        {selected.profileHeadline ? (
                          <div className="whitespace-normal text-[12px] font-medium leading-4 text-zinc-700 md:truncate">
                            {selected.profileHeadline}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    {selectedCategory === "follow" ? (
                      <div className="flex w-full max-w-full items-center justify-between gap-3 rounded-lg bg-amber-50 px-3 py-2 sm:w-auto">
                        <span className="min-w-0 text-[11px] font-medium text-amber-900">
                          {followUpError || "Follow up manually, then clear this task."}
                        </span>
                        <button
                          type="button"
                          onClick={completeSelectedFollowUp}
                          disabled={isCompletingFollowUp}
                          className="shrink-0 cursor-pointer rounded-md bg-amber-900 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isCompletingFollowUp ? "Saving..." : "Mark follow-up done"}
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#fbfaf6] p-4 sm:p-5">
                    {selected.messages.length === 0 ? (
                      selected.kind === "linkedin" && !hydrationSettledIds.has(selected.id) ? null : (
                        <p className="text-center text-[12px] font-medium text-zinc-700">No messages yet.</p>
                      )
                    ) : (
                      <ContentReveal className="space-y-3">
                      {selected.messages.map((message, index) => {
                        const outbound = message.direction === "outbound";
                        const previous = selected.messages[index - 1];
                        const showDate =
                          !previous ||
                          zonedDayKey(previous.createdAt, timeZone) !==
                            zonedDayKey(message.createdAt, timeZone);
                        return (
                          <div key={message.id}>
                            {showDate ? (
                              <div className="mb-3 flex justify-center">
                                <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-zinc-700">
                                  {formatZonedDate(message.createdAt, timeZone, {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                              </div>
                            ) : null}
                            {"event" in message && message.event ? (
                              <p className="text-center text-[11px] font-medium text-zinc-600">
                                {message.body}
                              </p>
                            ) : (
                            <div
                              className={`flex ${outbound ? "justify-end" : "justify-start"} gap-2`}
                            >
                              {!outbound ? (
                                <Avatar
                                  name={selected.profileName}
                                  avatarUrl={selected.avatarUrl}
                                  leadId={selected.lead?.id}
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
                                <MessageContent
                                  message={message}
                                  accountId={selected.kind === "linkedin" ? selected.accountId : undefined}
                                />
                                <div
                                  className="mt-1 text-[10px] font-medium text-zinc-600"
                                  title={formatZonedDateTime(message.createdAt, timeZone)}
                                >
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
                            )}
                          </div>
                        );
                      })}
                      </ContentReveal>
                    )}
                    {historyErrorIds.has(selected.id) ? (
                      <div className="flex items-center justify-center gap-2 pt-1 text-[12px] font-medium text-zinc-700">
                        <span>Could not load the full conversation from LinkedIn.</span>
                        <button
                          type="button"
                          onClick={() => setHistoryRetry((current) => current + 1)}
                          className="cursor-pointer font-semibold text-zinc-900 underline underline-offset-2"
                        >
                          Retry
                        </button>
                      </div>
                    ) : null}
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

                  {selected.kind === "linkedin" || selected.lead ? (
                    <Composer
                      selected={selected}
                      onSent={(body) => {
                        addLocalMessage(selected, body);
                        router.refresh();
                      }}
                    />
                  ) : (
                    <div className="border-t border-zinc-200 bg-zinc-50/60 px-5 py-3 text-center text-[12px] font-medium text-zinc-700">
                      This lead was deleted, so replies can only be sent from LinkedIn.
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
  selected: InboxThread;
  onSent: (body: string) => void;
}) {
  // Threads outside the live LinkedIn inbox list have no chat id. They reply
  // through the lead instead, which only carries text.
  const canAttach = selected.kind === "linkedin";
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Grow with the draft up to max-h-28, then scroll, instead of scrolling a
  // single 32px line.
  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [body]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = body.trim();
    const attachments = files;
    if ((!message && !attachments.length) || isSending) return;
    setBody("");
    setFiles([]);
    setSendError("");
    setIsSending(true);
    void (async () => {
      const formData = new FormData();
      if (selected.lead?.id) formData.set("leadId", selected.lead.id);
      formData.set("body", message);
      try {
        if (selected.kind === "linkedin") {
          formData.set("chatId", selected.chatId);
          formData.set("accountId", selected.accountId);
          for (const file of attachments) {
            formData.append("attachments", file);
          }
          unwrapAction(await sendLinkedInChatMessageAction(formData));
        } else {
          unwrapAction(await sendLeadReplyAction(formData));
        }
        onSent(message || `📎 ${attachments.map((file) => file.name).join(", ")}`);
      } catch (caught) {
        // Restore the draft so nothing is lost, and say why it did not send.
        setBody(message);
        setFiles(attachments);
        setSendError(userFacingError(caught, "Message did not send. Try again."));
        console.error("Message failed to send:", caught);
      } finally {
        setIsSending(false);
      }
    })();
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-zinc-200 bg-white p-3">
      {sendError ? (
        <p role="alert" className="mb-2 text-[12px] font-medium text-[var(--md-sys-color-error)]">
          {sendError}
        </p>
      ) : null}
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
      {/* A pill like the app's other fields: 32px controls inset 5px, so the
          bar is 44px tall with the buttons evenly spaced from its edge. Items
          sit at the bottom so the buttons stay put while the draft grows. */}
      <div className="flex items-end gap-1 rounded-[22px] border border-[var(--app-field-border)] bg-white px-1.5 py-[5px] transition-colors focus-within:border-[var(--app-field-border-focus)]">
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
        {canAttach ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
            aria-label="Attach file"
            className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
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
        ) : null}
        <textarea
          ref={textareaRef}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          disabled={isSending}
          placeholder={`Reply to ${selected.profileName}...`}
          rows={1}
          // No text-zinc-4xx variants here: the dark theme matches
          // [class*="text-zinc-4"] with !important, which greyed out the typed
          // text. Placeholders take the theme's own ::placeholder color.
          className={`max-h-28 min-h-8 min-w-0 flex-1 resize-none border-0 bg-transparent py-1.5 text-[13px] leading-5 text-zinc-900 shadow-none outline-none disabled:opacity-60 ${
            canAttach ? "px-1" : "px-2.5"
          }`}
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
          className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Send"
        >
          <svg
            className="h-4 w-4 translate-x-px"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M3.714 3.048a.498.498 0 0 0-.683.627l2.843 7.627a2 2 0 0 1 0 1.396l-2.842 7.627a.498.498 0 0 0 .682.627l18-8.5a.5.5 0 0 0 0-.904z" />
          </svg>
        </button>
      </div>
    </form>
  );
}
