import { useCurrentFrame, useVideoConfig } from "remotion";
import { CheckMark, Face, FitRing, LinkedInMark, ScoreCell, Shell } from "../components/Chrome";
import { FILTERS, LEADS, MATCHES, SCAN_FACES } from "../data";
import { pop } from "../motion";

function ScanStrip({ frame, fps }: { frame: number; fps: number }) {
  return (
    <div className="home-mock-scan" style={pop(frame, fps, 2, 8)}>
      <span className="home-mock-scan-faces" aria-hidden="true">
        {SCAN_FACES.map((name) => (
          <Face key={name} name={name} size="sm" />
        ))}
        <span className="home-mock-scan-more">+2k</span>
      </span>
      <p>
        <b>2,184 profiles scanned</b>9 match who you sell to
      </p>
    </div>
  );
}

function OutreachSteps({ status }: { status: (typeof LEADS)[number]["status"] }) {
  const inviteOn = status === "Invited";
  const inviteDone = status === "Messaged" || status === "Replied";
  const messageOn = status === "Messaged";
  const messageDone = status === "Replied";
  const repliedOn = status === "Replied";
  return (
    <ol className="home-mock-steps">
      <li className={inviteDone ? "is-done" : inviteOn ? "is-on" : undefined}>Invite sent</li>
      <li className={messageDone ? "is-done" : messageOn ? "is-on" : undefined}>Message sent</li>
      <li className={repliedOn ? "is-on" : undefined}>Replied</li>
    </ol>
  );
}

export function LeadsScreen() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const selected = LEADS[2];

  return (
    <Shell page="leads" title="Leads" action="Add leads">
      <ScanStrip frame={frame} fps={fps} />
      <ul className="home-mock-chips is-bar" style={pop(frame, fps, 6, 8)}>
        {FILTERS.map((chip) => (
          <li key={chip}>{chip}</li>
        ))}
      </ul>
      <div className="home-mock-tabs" style={pop(frame, fps, 8, 6)}>
        <span>All contacts</span>
        <span className="is-on">High-intent SaaS leaders</span>
      </div>
      <div className="home-mock-split">
        <ul className="home-mock-people">
          {LEADS.map((lead, index) => (
            <li
              key={lead.name}
              className={lead.name === selected.name ? "is-on" : lead.status === "Low fit" ? "is-dim" : undefined}
              style={pop(frame, fps, 10 + index * 2, 10)}
            >
              <Face name={lead.name} />
              <span>
                <strong>
                  {lead.name}
                  <LinkedInMark />
                </strong>
                {lead.title}
              </span>
              <ScoreCell score={lead.score} frame={frame} fps={fps} delay={12 + index * 2} />
              <em data-status={lead.status}>{lead.status}</em>
            </li>
          ))}
        </ul>
        <div className="home-mock-detail is-fill" style={pop(frame, fps, 16, 12)}>
          <div className="home-mock-person">
            <Face name={selected.name} />
            <div>
              <strong>
                {selected.name}
                <LinkedInMark />
              </strong>
              <p>{selected.title}</p>
            </div>
            <FitRing score={selected.score} frame={frame} fps={fps} delay={20} />
          </div>
          <div className="home-mock-sect">
            <p className="home-mock-kicker">Why this score</p>
            <ul className="home-mock-match">
              {MATCHES.map((row) => (
                <li key={row.label}>
                  <CheckMark />
                  {row.label}
                  <b>{row.label === "Title" ? selected.title : row.value}</b>
                </li>
              ))}
            </ul>
          </div>
          <div className="home-mock-sect">
            <p className="home-mock-kicker">Outreach so far</p>
            <OutreachSteps status={selected.status} />
          </div>
          <p className="home-mock-note">Continue the thread in Messages.</p>
        </div>
      </div>
    </Shell>
  );
}
