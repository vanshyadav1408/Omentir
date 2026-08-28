# One localhost only

Never start a second `bun run dev`, `next dev`, or `next start`.

Check terminals and ports 3000/3001/3002 first. If a Next.js server is already running, use that URL. Do not spawn another.

Two processes share `.next` and corrupt the Turbopack cache (missing `.sst` files, `/_app` panics, 500s).

If the existing server is dead: stop every `next` process, wipe `.next` only if the cache is corrupt, then start exactly one server.
