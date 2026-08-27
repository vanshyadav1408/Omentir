import { useCurrentFrame, useVideoConfig } from "remotion";
import { Face, FitRing, LinkedInMark, Shell } from "../components/Chrome";
import { FILTERS, PRODUCT_FIELDS } from "../data";
import { pop } from "../motion";

const PREVIEWS = [
  { name: "Priya Nair", title: "Head of Growth", score: 94 },
  { name: "Elena Voss", title: "VP Sales", score: 88 },
  { name: "Chris Pell", title: "Sales intern", score: 41, dim: true },
] as const;

export function ProductScreen() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Shell page="product" title="My Product" action="Save changes">
      <div className="home-mock-product">
        <div className="home-mock-fields">
          {PRODUCT_FIELDS.map((field, index) => (
            <label
              key={field.label}
              className={field.wide ? "is-wide" : undefined}
              style={pop(frame, fps, 4 + index * 2, 12)}
            >
              <span>{field.label}</span>
              <b>{field.value}</b>
            </label>
          ))}
          <div className="home-mock-connected" style={pop(frame, fps, 20, 10)}>
            <Face name="You" size="sm" />
            <span>
              <strong>
                Your LinkedIn
                <LinkedInMark />
              </strong>
              Invites and messages go out as you
            </span>
            <em>Connected</em>
          </div>
        </div>
        <aside className="home-mock-target" style={pop(frame, fps, 8, 14)}>
          <p className="home-mock-kicker">Who you want</p>
          <ul className="home-mock-chips">
            {FILTERS.map((chip) => (
              <li key={chip}>{chip}</li>
            ))}
          </ul>
          <p className="home-mock-kicker">How people score against it</p>
          <ul className="home-mock-preview">
            {PREVIEWS.map((person, index) => (
              <li
                key={person.name}
                className={person.dim ? "is-dim" : undefined}
                style={pop(frame, fps, 14 + index * 3, 10)}
              >
                <Face name={person.name} />
                <span>
                  <strong>
                    {person.name}
                    {person.dim ? null : <LinkedInMark />}
                  </strong>
                  {person.title}
                </span>
                <FitRing
                  score={person.score}
                  low={person.dim}
                  frame={frame}
                  fps={fps}
                  delay={16 + index * 3}
                />
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </Shell>
  );
}
