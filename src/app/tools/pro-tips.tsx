export default function ToolProTips({ tips }: { tips: readonly string[] }) {
  const split = Math.ceil(tips.length / 2);
  const columns = [tips.slice(0, split), tips.slice(split)];

  return (
    <section
      id="pro-tips"
      aria-labelledby="pro-tips-heading"
      className="omentir-primary-width relative z-10 min-w-0 pt-12 md:pt-16"
    >
      <div className="rounded-2xl border border-[#2a3324] bg-[#12160f] px-6 py-8 md:px-10 md:py-10">
        <h2
          id="pro-tips-heading"
          className="flex items-center justify-center gap-2 text-center text-xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)] md:text-2xl"
        >
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="#c2d0aa"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 18h6M10 21h4" />
            <path d="M12 3a6 6 0 0 0-3.5 10.8c.6.5 1 1.2 1.1 2h4.8c.1-.8.5-1.5 1.1-2A6 6 0 0 0 12 3Z" />
          </svg>
          Pro tips
        </h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-x-12 sm:gap-y-3">
          {columns.map((column, columnIndex) => (
            <ul key={columnIndex} className="space-y-3">
              {column.map((tip) => (
                <li
                  key={tip}
                  className="flex items-start gap-3 text-sm leading-6 text-[var(--md-sys-color-on-surface)]"
                >
                  <span
                    className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#c2d0aa]"
                    aria-hidden="true"
                  />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
