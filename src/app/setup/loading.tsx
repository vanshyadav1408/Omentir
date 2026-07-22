export default function Loading() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--md-sys-color-surface)] px-5 py-10 text-[var(--md-sys-color-on-surface)]">
      <section className="w-full max-w-xl text-center">
        <h1
          style={{ fontFamily: "var(--font-varta)" }}
          className="text-4xl font-semibold tracking-tight sm:text-5xl"
        >
          Welcome to Omentir
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base font-medium leading-7 text-zinc-600">
          Let&apos;s help you setup your first AI Agent.
        </p>
        <button
          type="button"
          disabled
          style={{ fontFamily: "var(--font-varta)" }}
          className="mt-8 inline-flex h-11 cursor-pointer items-center justify-center rounded-md bg-[#ba3871] px-7 text-sm font-semibold text-white shadow-[0_12px_35px_rgba(186,56,113,0.28)]"
        >
          Get started
        </button>
      </section>
    </main>
  );
}
