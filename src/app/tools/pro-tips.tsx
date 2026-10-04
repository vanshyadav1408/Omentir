export default function ToolProTips({ tips }: { tips: readonly string[] }) {
  const split = Math.ceil(tips.length / 2);
  const columns = [tips.slice(0, split), tips.slice(split)];

  return (
    <section
      id="pro-tips"
      aria-labelledby="pro-tips-heading"
      className="omentir-primary-width relative z-10 min-w-0 pt-12 md:pt-16"
    >
      <div className="rounded-[28px] bg-[var(--cal-hero)] px-6 py-8 md:px-12 md:py-12">
        <h2
          id="pro-tips-heading"
          style={{ fontFamily: "var(--font-cal-display)" }}
          className="flex items-center justify-center gap-2 text-center text-2xl font-medium tracking-tight text-[var(--site-text)] md:text-3xl"
        >
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="text-[var(--cal-blue)]"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 18h6M10 21h4" />
            <path d="M12 3a6 6 0 0 0-3.5 10.8c.6.5 1 1.2 1.1 2h4.8c.1-.8.5-1.5 1.1-2A6 6 0 0 0 12 3Z" />
          </svg>
          Pro tips
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-x-12">
          {columns.map((column, columnIndex) => (
            <ul key={columnIndex} className="space-y-4">
              {column.map((tip) => (
                <li
                  key={tip}
                  className="flex items-start gap-3 text-[15px] leading-6 text-[var(--site-text)]"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mt-[3px] shrink-0 text-[var(--cal-blue)]"
                    aria-hidden="true"
                  >
                    <path d="m5 12.5 4.5 4.5L19 7.5" />
                  </svg>
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
