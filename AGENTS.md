# ConfiDentist Admin Dashboard

## Cursor Cloud specific instructions

### What this is
A single Next.js 15 (App Router, React 19) admin dashboard named `confidentist-dashboard`. It is a **frontend-only** app with **no backend, database, or external services** — all data is served statically from the JSON files in `lib/` (`orders-data.json`, `students-data.json`, `course-stats.json`, `monthly-data.json`) and re-exported through `lib/data.ts`. Styling is Tailwind CSS v4 (via `@tailwindcss/postcss`); charts use `recharts`; icons use `lucide-react`.

### Package manager & Node
Uses `pnpm` (see `pnpm-lock.yaml`). Node 22 and pnpm are already available. The update script runs `pnpm install`.

### Running / building (standard commands, see `package.json`)
- Dev server: `pnpm dev` → serves on `http://localhost:3000`.
- Production build (also runs full TypeScript type-checking): `pnpm build`.
- Start built app: `pnpm start`.

### Non-obvious gotchas
- **Lint is not configured.** `pnpm lint` runs `next lint`, which is deprecated in Next 15.5 and, because no ESLint config is committed, drops into an **interactive setup prompt** — it will hang/fail in a non-interactive shell. Do not treat lint failures as build breakage. Type safety is instead verified by `pnpm build` ("Linting and checking validity of types" step).
- On install, pnpm reports `Ignored build scripts: sharp`. This is expected and fine — `sharp` is only used for production image optimization and is not needed for dev.
- Routes `/orders`, `/orders/[id]`, and `/students` are server-rendered on demand; the rest are statically prerendered.
