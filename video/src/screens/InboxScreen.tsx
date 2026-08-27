import { useCurrentFrame, useVideoConfig } from "remotion";
import { Face, LinkedInMark, Shell } from "../components/Chrome";
import { THREADS, type ChatEvent, type Thread } from "../data";
import { pop } from "../motion";

function Line({ event, thread, delay }: { event: ChatEvent; thread: Thread; delay: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (event.kind === "sys") {
    return (
      <p className="home-mock-sys" style={pop(frame, fps, delay, 8)}>
        {event.text}
      </p>
    );
  }
  const you = event.kind === "you";
  return (
    <div className={`home-mock-line${you ? " is-you" : " is-them"}`} style={pop(frame, fps, delay, 12)}>
      {you ? null : <Face name={thread.name} size="sm" />}
      {you && event.when ? <time className="home-mock-when">{event.when}</time> : null}
      <p className="home-mock-bubble">{event.text}</p>
      {you ? <Face name="You" size="sm" /> : null}
      {!you && event.when ? <time className="home-mock-when">{event.when}</time> : null}
    </div>
  );
}

export function InboxScreen() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const selected = THREADS[0];
  const bookedCount = THREADS.filter((thread) => thread.booked).length;
  const interestedCount = THREADS.filter((thread) => thread.interested).length;
  const badgeOn = frame > 8 + selected.log.length * 6 + 4;

  return (
    <Shell page="messages" title="Messages" search="Search conversations">
      <div className="home-mock-tabs" style={pop(frame, fps, 2, 6)}>
        {(["All", "Meetings booked", "Interested"] as const).map((item) => (
          <span key={item} className={item === "All" ? "is-on" : undefined}>
            {item}
            <b>
              {item === "All" ? THREADS.length : item === "Meetings booked" ? bookedCount : interestedCount}
            </b>
          </span>
        ))}
      </div>
      <div className="home-mock-split is-inbox">
        <div className="home-mock-threadcol">
          <ul className="home-mock-threads">
            {THREADS.map((thread, index) => (
              <li
                key={thread.name}
                className={thread.name === selected.name ? "is-on" : undefined}
                style={pop(frame, fps, 4 + index * 2, 10)}
              >
                <Face name={thread.name} />
                <span>
                  <strong>
                    {thread.name}
                    {thread.booked && badgeOn ? <em>Meeting booked</em> : null}
                  </strong>
                  {thread.title}
                  <small>{thread.preview}</small>
                </span>
                <time>{thread.time}</time>
              </li>
            ))}
          </ul>
        </div>
        <div className="home-mock-chat" style={pop(frame, fps, 8, 10)}>
          <header>
            <Face name={selected.name} />
            <div>
              <strong>
                {selected.name}
                <LinkedInMark />
                {badgeOn ? <em>Meeting booked</em> : null}
              </strong>
              <p>{selected.title}</p>
            </div>
          </header>
          <div className="home-mock-log">
            <div className="home-mock-log-stack">
              {selected.log.map((event, index) => (
                <Line key={index} event={event} thread={selected} delay={10 + index * 6} />
              ))}
            </div>
          </div>
          <p className="home-mock-composer">Write a message</p>
        </div>
      </div>
    </Shell>
  );
}
