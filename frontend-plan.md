I'm building the React frontend for my notebook-style todo PWA. Vite + React + TypeScript, Zustand for state, TanStack Query for server cache, Tailwind for layout, custom CSS for the notebook aesthetic.

Backend is already running at http://localhost:8080 with these endpoints: [paste endpoint list from backend plan]

## Design language
- Off-white paper background (#fafaf7), dark ink text (#1a1a1a)
- Subtle dotted-grid background using CSS radial-gradient, ~24px spacing
- Serif font for headings (Source Serif 4), system sans for task text
- Hand-drawn feel for checkboxes (empty circles, ink fill on tick) and strikethrough (slightly wavy)
- Top 3 priority slots indicated with ① ② ③ in the left margin
- Priority 1 celebration: confetti burst from checkbox on completion. Priorities 2/3: subtle ink-spread only.

## Build order
1. Project structure, Tailwind setup, global notebook CSS (dotted grid + colors + fonts)
2. TypeScript types matching backend DTOs
3. API client (axios) with one function per endpoint
4. React Query hooks
5. Zustand store for UI state only (selected day, prompt visibility)
6. Component skeleton — Header, Sidebar, NotebookPage with mock data
7. Wire up real data
8. Carry-forward modal
9. Confetti for hero task
10. PWA manifest + service worker
11. Deploy config

Start with step 1. Show me the global styles and the notebook background — I want to see the aesthetic working before anything else.