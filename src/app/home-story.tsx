import type { CSSProperties } from "react";
import HeroCta from "./hero-cta";
import { LogoGlyph } from "./logo-mark";

/** The pinned scroll story at the top of the homepage: photo hero, four
 *  outbound chores, one statement, then the wordmark and what Omentir does.
 *  HomeScrollActs sets `--p` and `data-step` on each act; the layout and
 *  motion live in the "Homepage story" block of globals.css. The mock cards
 *  are decoration and hidden from assistive tech. */

const PROBLEMS: Array<[lead: string, rest: string]> = [
  ["Looking for buyers,", "one profile at a time?"],
  ["Typing the same opener", "for the fortieth time?"],
  ["Follow-ups you meant", "to send last week?"],
  ["A real reply, buried", "under everything else?"],
];

const WHY = "You should be talking to buyers. Omentir does the part before that.".split(" ");

const NOTES = ["leads found", "invites sent", "follow-ups sent", "call booked"];

function SearchScene() {
  return (
    <div className="nx-prop">
      <div className="nx-card nx-win nx-win-b1" />
      <div className="nx-card nx-win nx-win-b2" />
      <div className="nx-card nx-win">
        <div className="nx-tabs">
          {Array.from({ length: 9 }, (_, i) => (
            <i key={i} className={i === 3 ? "on" : undefined} />
          ))}
        </div>
        <div className="nx-bar">
          <b>People search: head of growth, fintech</b>
        </div>
        <div className="nx-rows">
          <div>
            <u />
            <span>
              <b>Priya Shah</b>Head of Growth, fintech
            </span>
            <strong>
              2nd<small>312 mutual</small>
            </strong>
          </div>
          <div>
            <u />
            <span>
              <b>Marcus Lee</b>VP Sales, SaaS
            </span>
            <strong>
              3rd<small>no mutual</small>
            </strong>
          </div>
          <div>
            <u />
            <span>
              <b>Ana Costa</b>Founder, devtools
            </span>
            <strong>
              2nd<small>18 mutual</small>
            </strong>
          </div>
        </div>
      </div>
      <p className="nx-hand" style={{ right: -6, top: -46 }}>
        which of these would buy?
      </p>
    </div>
  );
}

function OpenerScene() {
  return (
    <div className="nx-prop">
      <div className="nx-card nx-chat">
        <p className="me">Hi Priya, I came across your profile and wanted to reach out.</p>
        <p className="me">Hi Marcus, I came across your profile and wanted to reach out.</p>
        <p className="me">Hi Ana, I came across your profile and wanted to reach out.</p>
        <p className="ai">
          <b>Seen</b>
          <i />
        </p>
      </div>
      <p className="nx-hand" style={{ left: -14, top: -44 }}>
        copy, paste, again
      </p>
    </div>
  );
}

function FollowUpScene() {
  return (
    <div className="nx-prop">
      <div className="nx-card nx-list">
        <p>
          <span>Priya Shah</span>
          <span className="no">No reply, 9 days</span>
        </p>
        <p>
          <span>Marcus Lee</span>
          <span className="no">No reply, 12 days</span>
        </p>
        <p>
          <span>Ana Costa</span>
          <span className="no">No reply, 6 days</span>
        </p>
        <p>
          <span>James Okonkwo</span>
          <span className="no">No reply, 15 days</span>
        </p>
      </div>
      <div className="nx-card nx-blank">
        <b>To do</b>
        <p>
          Follow up <span>.....</span>
        </p>
        <p>
          Follow up <span>.....</span>
        </p>
      </div>
      <p className="nx-hand" style={{ left: 8, top: -44 }}>
        meant to do this Tuesday
      </p>
    </div>
  );
}

function InboxScene() {
  return (
    <div className="nx-prop nx-prop-phone">
      <div className="nx-phone">
        <div className="nx-isl" />
        <div className="nx-scr">
          <div className="nx-phead">
            Messages <small>27 unread</small>
          </div>
          <div className="nx-fav">
            <u style={{ background: "#dbe7f5" }} />
            <span>
              Weekly digest<small>12 posts you may have missed</small>
            </span>
          </div>
          <div className="nx-fav">
            <u style={{ background: "#d3effa" }} />
            <span>
              Recruiter<small>An exciting opportunity for you</small>
            </span>
          </div>
          <div className="nx-fav nx-fav-hit">
            <u style={{ background: "#e2e3ff" }} />
            <span>
              Priya Shah<small>Sounds useful. Free Thursday?</small>
            </span>
          </div>
          <div className="nx-fav">
            <u style={{ background: "#d6e6ff" }} />
            <span>
              Webinar invite<small>Join 400 other leaders live</small>
            </span>
          </div>
          <div className="nx-fav">
            <u style={{ background: "#dfe6f0" }} />
            <span>
              Sponsored<small>Grow your pipeline 10x</small>
            </span>
          </div>
        </div>
      </div>
      <i className="nx-ring" style={{ left: -8, top: 208, width: 252, height: 68 }} />
      <p className="nx-hand" style={{ left: 244, top: 190 }}>
        almost missed this
      </p>
    </div>
  );
}

export default function HomeStory() {
  return (
    <>
      <section
        id="nx-hero"
        data-nx-act=""
        data-nx-steps={4}
        data-step="0"
        className="nx-act nx-hero"
      >
        <div className="nx-pin">
          <div className="nx-frame">
            <div className="nx-sky">
              <i className="nx-cloud nx-cloud-1" />
              <i className="nx-cloud nx-cloud-2" />
              <i className="nx-cloud nx-cloud-3" />
              <i className="nx-cloud nx-cloud-4" />
            </div>
            <div className="nx-grain" />
            <div className="nx-title nx-title-1">
              <h1>
                <span>Omentir will find you customers</span> <span>or you pay nothing.</span>
              </h1>
              <div className="nx-hero-cta">
                <HeroCta />
              </div>
            </div>
            <p className="nx-title nx-title-2">
              Your next customer is already on LinkedIn.
            </p>
            <div className="nx-disc" />
            <a href="#nx-problems" className="nx-down">
              Scroll
              <svg viewBox="0 0 14 14" aria-hidden="true">
                <path d="M3 5l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      <section
        id="nx-problems"
        data-nx-act=""
        data-nx-steps={PROBLEMS.length}
        data-step="0"
        className="nx-act nx-problems"
      >
        <div className="nx-pin">
          <div className="nx-stage">
            <div className="nx-say">
              {PROBLEMS.map(([lead, rest]) => (
                <h2 key={lead}>
                  {lead} <em>{rest}</em>
                </h2>
              ))}
              <div className="nx-ticks" aria-hidden="true">
                {PROBLEMS.map(([lead]) => (
                  <i key={lead} />
                ))}
              </div>
            </div>
            <div className="nx-reel" aria-hidden="true">
              <div className="nx-strip">
                <svg viewBox="0 0 100 400" preserveAspectRatio="none">
                  <path
                    pathLength={1}
                    d="M-10 62 C 30 20, 96 10, 92 60 S 20 110, 14 160 S 92 190, 88 250 S 10 290, 16 340 S 70 380, 110 372"
                  />
                </svg>
                <div className="nx-scene">
                  <SearchScene />
                </div>
                <div className="nx-scene">
                  <OpenerScene />
                </div>
                <div className="nx-scene">
                  <FollowUpScene />
                </div>
                <div className="nx-scene">
                  <InboxScene />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section data-nx-act="" className="nx-act nx-why-act">
        <div className="nx-pin">
          <p className="nx-why" style={{ "--n": WHY.length } as CSSProperties}>
            {WHY.map((word, i) => (
              <span key={i} style={{ "--i": i } as CSSProperties}>
                {word}
              </span>
            ))}
          </p>
        </div>
      </section>

      <section data-nx-act="" data-nx-steps={4} data-step="0" className="nx-act nx-brand">
        <div className="nx-pin">
          <div className="nx-frame nx-above">
            <p className="nx-intro">So we built</p>
            <div className="nx-markwrap" aria-hidden="true">
              <span className="nx-mark">
                Omentir
                <LogoGlyph className="nx-mark-glyph" />
              </span>
            </div>
            <div className="nx-claim">
              <p>
                Omentir finds people who fit your buyer profile, connects from{" "}
                <mark>your own LinkedIn account</mark>, and <u>follows up when they go quiet</u>.
                When someone wants to talk, you book the call.
              </p>
            </div>
            {NOTES.map((note, i) => (
              <span key={note} className={`nx-note nx-note-${i + 1}`} aria-hidden="true">
                {note}
              </span>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
