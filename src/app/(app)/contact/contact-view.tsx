"use client";

import type { ReactNode } from "react";
import { useState, useTransition } from "react";
import { LinkedInMark, TelegramMark, WhopMark, XMark } from "@/app/brand-marks";
import { TextAreaField, TextField } from "@/app/ui/text-field";
import { hostedContactEmail, hostedSupportEmail } from "@/lib/hosted-identity";

type ContactChannel = {
  id: string;
  label: string;
  description: string;
  href: string;
  /** Official brand mark where the channel has one, else a Material glyph. */
  icon: ReactNode;
  external: boolean;
};

/** Material Symbols fallback for channels with no brand mark of their own. */
function GlyphIcon({ name }: { name: string }) {
  return (
    <span className="material-symbols-outlined brand-mono text-[22px]" aria-hidden="true">
      {name}
    </span>
  );
}

function hostedChannels(): ContactChannel[] {
  const contact = hostedContactEmail();
  return [
    {
      id: "linkedin",
      label: "LinkedIn",
      description: "Message Vansh on LinkedIn",
      href: "https://www.linkedin.com/in/vanshyadav1408/",
      icon: <LinkedInMark className="brand-mono text-[21px]" />,
      external: true,
    },
    {
      id: "twitter",
      label: "X (Twitter)",
      description: "@omentirai",
      href: "https://x.com/omentirai",
      icon: <XMark className="brand-mono text-[18px]" />,
      external: true,
    },
    {
      id: "email",
      label: "Email",
      description: contact,
      href: `mailto:${contact}`,
      icon: <GlyphIcon name="mail" />,
      external: false,
    },
    {
      id: "telegram",
      label: "Telegram",
      description: "@vansh14b",
      href: "https://t.me/vansh14b",
      icon: <TelegramMark className="brand-mono text-[22px]" />,
      external: true,
    },
    {
      id: "whop",
      label: "Whop support",
      description: "Chat via your Whop membership",
      href: "https://whop.com/joined/omentir/",
      icon: <WhopMark className="brand-mono text-[12px]" />,
      external: true,
    },
  ];
}

type ContactViewProps = {
  defaultEmail?: string;
  localMode?: boolean;
  submitAction: (formData: FormData) => Promise<{ ok: true }>;
};

export default function ContactView({
  defaultEmail = "",
  localMode = false,
  submitAction,
}: ContactViewProps) {
  const [title, setTitle] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();
  const supportMailto = `mailto:${hostedSupportEmail()}`;
  const channels = hostedChannels();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSent(false);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        await submitAction(formData);
        setSent(true);
        setTitle("");
        setQuery("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not send your message.");
      }
    });
  }

  if (localMode) {
    return (
      <div className="flex h-full min-h-0 min-w-0 flex-col gap-3 md:ml-4 md:mr-0.5">
        <div className="app-x hidden shrink-0 items-center justify-between gap-3 pt-6 md:flex">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold leading-none tracking-tight text-[var(--md-sys-color-on-surface)]">
              Contact
            </h1>
          </div>
        </div>
        <div className="mt-2 min-h-0 flex-1 overflow-hidden md:mt-0">
          <div className="app-x h-full overflow-y-auto">
            <div className="max-w-5xl pb-8 pt-1 sm:pb-10 sm:pt-2 md:pb-3">
              <section className="m3-card m3-card-elevated rounded-2xl bg-[var(--md-sys-color-surface-container)] p-5 sm:p-6">
                <h2
                  style={{ fontFamily: "var(--font-varta)" }}
                  className="text-lg font-semibold text-[var(--md-sys-color-on-surface)]"
                >
                  Self-hosted support
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">
                  This instance is running in local mode. The hosted Omentir contact form and team
                  channels are not available here. Use your own support process, or file an issue on
                  the public repository for product bugs.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-3 md:ml-4 md:mr-0.5">
      {/* Header — same dimensions as My Product; Feedback opens email */}
      <div className="app-x hidden shrink-0 items-center justify-between gap-3 pt-6 md:flex">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold leading-none tracking-tight text-[var(--md-sys-color-on-surface)]">
            Contact
          </h1>
        </div>
        <a
          href={supportMailto}
          className="m3-btn m3-btn-filled h-8 shrink-0 gap-1 px-2.5 text-xs"
        >
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
            mail
          </span>
          Feedback
        </a>
      </div>

      {/* Scrollable content — same width shell as My Product (max-w-5xl) */}
      <div className="mt-2 min-h-0 flex-1 overflow-hidden md:mt-0">
        <div className="app-x h-full overflow-y-auto">
          <div className="max-w-5xl pb-8 pt-1 sm:pb-10 sm:pt-2 md:pb-3">
            <div className="mb-8">
              <p className="text-sm leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">
                Send a message, or reach out on any of the channels below.
              </p>
            </div>

            <section className="m3-card m3-card-elevated mb-10 rounded-2xl bg-[var(--md-sys-color-surface-container)] p-5 sm:p-6">
              <h2
                style={{ fontFamily: "var(--font-varta)" }}
                className="text-lg font-semibold text-[var(--md-sys-color-on-surface)]"
              >
                Send a message
              </h2>
              <p className="mt-1 text-sm text-[var(--md-sys-color-on-surface-variant)]">
                We&apos;ll get back to you at the email on your account.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                <input type="hidden" name="contactEmail" value={defaultEmail} />
                <TextField
                  name="title"
                  label="Title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Short subject"
                  required
                  maxLength={200}
                />
                <TextAreaField
                  name="query"
                  label="Your message"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="What do you need help with?"
                  required
                  rows={5}
                  maxLength={5000}
                />

                {error ? (
                  <p className="rounded-lg bg-[var(--md-sys-color-error-container)] px-3 py-2 text-sm text-[var(--md-sys-color-on-error-container)]">
                    {error}
                  </p>
                ) : null}
                {sent ? (
                  <p className="rounded-lg bg-[var(--md-sys-color-primary-container)] px-3 py-2 text-sm text-[var(--md-sys-color-on-primary-container)]">
                    Message sent. We&apos;ll contact you soon.
                  </p>
                ) : null}

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={pending}
                    className="m3-btn m3-btn-filled h-10 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {pending ? "Sending…" : "Send"}
                  </button>
                </div>
              </form>
            </section>

            <section>
              <h2
                style={{ fontFamily: "var(--font-varta)" }}
                className="text-lg font-semibold text-[var(--md-sys-color-on-surface)]"
              >
                Other ways to reach us
              </h2>
              <p className="mt-1 text-sm text-[var(--md-sys-color-on-surface-variant)]">
                Opens in a new tab where needed so you can message right away.
              </p>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {channels.map((channel) => (
                  <li key={channel.id}>
                    <a
                      href={channel.href}
                      target={channel.external ? "_blank" : undefined}
                      rel={channel.external ? "noopener noreferrer" : undefined}
                      className="m3-card flex min-h-16 items-center gap-3 rounded-2xl bg-[var(--md-sys-color-surface-container)] px-4 py-3 transition-[background-color,box-shadow] duration-150 hover:bg-[var(--md-sys-color-surface-container-high)]"
                    >
                      {/* Neutral chip, not the pink primary container: these
                          are brand marks now, and each carries its own colour. */}
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--md-sys-color-surface-container-high)]">
                        {channel.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
                          {channel.label}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-[var(--md-sys-color-on-surface-variant)]">
                          {channel.description}
                        </span>
                      </span>
                      <span
                        className="material-symbols-outlined shrink-0 text-[var(--md-sys-color-on-surface-variant)]"
                        aria-hidden="true"
                      >
                        open_in_new
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
