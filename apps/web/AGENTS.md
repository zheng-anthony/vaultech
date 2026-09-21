<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Frontend development

These instructions apply to `apps/web/` and its descendants. This is a learning
project: keep implementations readable and explain unfamiliar framework decisions.

## Stack and conventions

- Use the existing Next.js App Router, React functional components, strict
  TypeScript, and Tailwind CSS. At the time of writing, the project uses Next.js
  16.2.6, React 19.2.4, and Tailwind 4; check `package.json` before using new APIs.
- Keep routes in the existing `app/` directory; do not introduce a Pages Router
  or move the application into `src/` as part of unrelated work.
- Use `pnpm` and maintain `pnpm-lock.yaml`. Prefer existing dependencies and
  framework features over adding libraries for simple tasks.
- Use the configured `@/` alias for shared imports; it resolves to `apps/web/`.
- Type component props and API boundaries. Avoid `any`; narrow unknown external
  data and handle invalid responses explicitly.

## Folder structure and reuse

Next.js supports both shared folders and route-local colocation. The names below
are this project's conventions, not special Next.js routing keywords. Create each
directory when code needs it, rather than adding empty scaffolding.

```text
app/                    Routes, layouts, loading/error boundaries, global CSS
  files/                Example feature route
    page.tsx             Route composition
    _components/         Components used only by this route
    _lib/                Functions used only by this route
components/             Components shared across routes
  ui/                    Reusable UI primitives, such as buttons and inputs
hooks/                  Reusable React hooks, such as useFileSelection.ts
lib/                    Reusable plain functions, validation, and API helpers
  api/                   Shared API request functions and associated types
public/                 Static assets
```

- Extract reusable functions into focused files in `lib/`, such as
  `lib/format-file-size.ts`; import them wherever needed instead of duplicating
  logic or exporting helpers from `page.tsx` or `layout.tsx`.
- Extract shared stateful React logic into `hooks/useSomething.ts`. Plain
  functions that do not use hooks belong in `lib/`, not in custom hooks.
- Extract reusable presentation into `components/`; keep route-specific
  components and helpers in that route's `_components/` and `_lib/` folders.
- Keep pages focused on fetching and composing UI. Group related helpers by
  purpose instead of growing a miscellaneous `utils.ts` file. Keep trivial
  one-off event handlers local; do not build abstractions without a concrete use.

## Next.js and React

- Keep pages and layouts as Server Components by default. Add `"use client"`
  only at boundaries that need state, event handlers, effects, or browser APIs;
  keep those boundaries small to limit browser JavaScript.
- Fetch initial data in Server Components when practical. Put reusable request
  logic in `lib/api/`, check HTTP errors, and choose caching/revalidation based on
  the data's freshness requirements. Check installed docs for caching behavior.
- Keep credentials and privileged data access on the server. Mark modules that
  must not enter the client bundle with `import "server-only"`; never put secrets
  in `NEXT_PUBLIC_*` variables or import server-only helpers into Client Components.
- Follow the installed version's async request APIs: await server-side `params`,
  `searchParams`, `cookies()`, and `headers()` where applicable.
- Use `next/link` for internal navigation, `next/navigation` for App Router hooks,
  `next/image` for suitable image assets, and `next/font` for fonts. Use the
  Metadata API for page metadata.
- Provide loading, empty, error, and success states for asynchronous UI. Use
  `loading.tsx`, `error.tsx`, `not-found.tsx`, and Suspense where appropriate.
- Keep rendering pure and state updates immutable. Use stable list keys. Call
  ordinary hooks at the top level of components or custom hooks.
- Derive values during rendering when possible; use effects to synchronize with
  external systems, with cleanup for subscriptions. Handle user actions in event
  handlers rather than effects. Add memoization only for a concrete need.
- When forms need them, use supported React 19 APIs such as `useActionState` and
  `useFormStatus` for pending/error feedback. Validate inputs and authorize any
  privileged mutation on the server.

## Tailwind and accessible UI

- Use Tailwind utilities as the default styling approach. Build responsive layouts
  with mobile-first breakpoints and include keyboard focus and disabled states.
- Preserve Tailwind 4's `@import "tailwindcss"` setup. Define shared design tokens
  in `app/globals.css` with CSS variables and `@theme`/`@theme inline`; avoid
  introducing Tailwind 3 configuration or legacy `@tailwind` directives.
- Reuse theme tokens for colors, spacing, and typography. Extract repeated UI into
  components; reserve custom CSS for styles that utilities cannot express cleanly.
- Write complete class names that Tailwind can detect. Map variants to literal
  strings instead of constructing names such as `bg-${color}-500` dynamically.
- Use semantic elements, labeled inputs, descriptive alternative text, visible
  focus indicators, and sufficient contrast. Support keyboard use and reduced
  motion; preserve the existing light/dark theme behavior.

## Development and verification

Run commands from `apps/web/`:

- `pnpm dev`: start local development on port 3000 by default.
- `pnpm lint`: check ESLint rules after frontend code changes.
- `pnpm build`: validate production compilation and types for meaningful code,
  routing, dependency, or configuration changes. Run lint separately.
- For UI changes, check affected screens at narrow and wide widths and exercise
  relevant interactions. Add behavior-focused tests when the complexity warrants
  them; there is currently no test script. Documentation-only edits need no build.

The Python API runs separately via SAM on port 3001; see
`../../services/api/README.md`. Configure API endpoints through environment
settings when implementing integration rather than hardcoding deployment URLs.

## References

- [Next.js project structure](https://nextjs.org/docs/app/getting-started/project-structure)
- [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [React custom hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [Tailwind theme variables](https://tailwindcss.com/docs/theme)
- [Tailwind class detection](https://tailwindcss.com/docs/detecting-classes-in-source-files)

Use the installed Next.js documentation first when it differs from online examples.
