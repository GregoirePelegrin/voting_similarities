# Frontend Plan

## Overview

A single-page React application for exploring and comparing how individuals and groups vote on yes/no questions. The UI should feel serious and premium — clean typography, generous spacing, subtle transitions, and a refined color palette.

## Skeleton Cleanup

- Remove irrelevant dependencies from `package.json` (deck.gl, mapbox, keycloak, turf, redux, react-redux, country-flag-icons, etc.)
- Keep: `react`, `react-dom`, `react-router-dom`, `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`, `mobx`, `mobx-react-lite`, `recharts`, `@mui/x-data-grid`
- Add: `@types/react-router-dom` (if not already in devDeps)
- Update `public/index.html` title to "Groups Comparison"
- Update `public/manifest.json` accordingly

## Directory Structure

```
src/
  app.tsx                  # Root: ThemeProvider + Router + CssBaseline
  index.tsx                # Entry point
  static/
    index.css              # Minimal global CSS (font, resets)
  theme.ts                 # MUI createTheme (palette, typography, transitions)
  api/
    client.ts              # Base fetch wrapper with API_URL from env
    types.ts               # TypeScript interfaces mirroring backend schemas
    people.ts              # getPeople, getPerson
    groups.ts              # getGroups, getGroup
    categories.ts          # getCategories
    questions.ts           # getQuestions
  stores/
    root-store.ts          # RootStore composing sub-stores
    people-store.ts        # People list + selected person + pagination
    groups-store.ts        # Groups list + selected group
    categories-store.ts    # Category list (fetched once)
    questions-store.ts     # Questions list (fetched once)
    ui-store.ts            # Category filter, loading states, snackbar
  pages/
    people-list-page.tsx
    person-detail-page.tsx
    groups-list-page.tsx
    group-detail-page.tsx
  components/
    layout/
      app-shell.tsx         # AppBar + sidebar/drawer + main content area
      nav-drawer.tsx        # Navigation sidebar with links
    people/
      people-table.tsx      # DataGrid with pagination + group filter
      similar-people-card.tsx  # Top 5 similar/dissimilar list
      answer-grid.tsx       # Person's answers (filterable by category)
      group-comparison-bars.tsx  # Horizontal bars: person vs each group
    groups/
      groups-table.tsx      # Table with member count, cohesivity
      cohesivity-gauge.tsx  # Visual gauge for cohesivity score
      similar-groups-list.tsx  # Ranked list of similar groups
      category-heatmap.tsx  # Per-category similarity heatmap (Recharts)
    shared/
      category-filter.tsx   # Dropdown to filter by category
      similarity-bar.tsx    # Reusable horizontal bar for similarity scores
      loading-skeleton.tsx  # MUI Skeleton wrappers
      animated-page.tsx     # Fade/slide transition wrapper for route changes
```

## Theming

**Palette**: Dark slate base with a warm accent (e.g., deep indigo or teal). Light surface cards on a slightly darker background. This gives a "serious dashboard" feel.

```
Primary:    #2D3A4A (dark slate)
Secondary:  #4A90D9 (steel blue)
Accent:     #E8B931 (muted gold, for highlights)
Background: #1A1F2B (near-black slate)
Surface:    #242B38 (card backgrounds)
Text:       #E8ECF1 (off-white)
```

**Typography**: Roboto (already included via `@fontsource/roboto`). Tighter letter-spacing on headings, generous line-height on body.

**Transitions**:
- Page transitions: `<Slide>` or `<Fade>` from MUI on route changes (via `animated-page.tsx`)
- Card hover: subtle `translateY(-2px)` + box-shadow elevation
- Data loading: MUI `<Skeleton>` with pulse animation
- List item expansion: `<Collapse>` with smooth timing
- Score bars: CSS `transition: width 0.6s ease-out` for animated bar fills

**MUI components used**: `<Card>`, `<Table>`, `<DataGrid>`, `<AppBar>`, `<Drawer>`, `<Chip>`, `<LinearProgress>`, `<Tooltip>`, `<Select>`, `<Skeleton>`

## API Layer

**`client.ts`**:
```ts
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
```

**`types.ts`**: TypeScript interfaces mirroring the Pydantic schemas exactly (`CategoryOut`, `QuestionOut`, `PersonOut`, `PersonDetailOut`, `GroupListOut`, `GroupDetailOut`, etc.)

## MobX Stores

### `ui-store.ts`
- `selectedCategory: number | null` — null = global
- `loading: boolean`
- `snackbar: { open, message, severity }`

### `categories-store.ts`
- `categories: CategoryOut[]`
- `fetchCategories()` — called once on app load

### `questions-store.ts`
- `questions: QuestionOut[]`
- `fetchQuestions()` — called once on app load

### `people-store.ts`
- `people: PersonOut[]`
- `total: number`
- `page: number`
- `groupId: number | null`
- `selectedPerson: PersonDetailOut | null`
- `fetchPeople(page, groupId?)`
- `fetchPerson(id, category?)`

### `groups-store.ts`
- `groups: GroupListOut[]`
- `selectedGroup: GroupDetailOut | null`
- `fetchGroups()`
- `fetchGroup(id, category?)`

### `root-store.ts`
Composes all stores, passed via React context.

## Routing

```
/                  → Redirect to /people
/people            → PeopleListPage
/people/:id        → PersonDetailPage
/groups            → GroupsListPage
/groups/:id        → GroupDetailPage
```

## Pages

### PeopleListPage
- `<DataGrid>` with columns: ID, Name, Group
- Pagination controls synced with store
- `<Select>` filter by group (from categories-store)
- Click row → navigate to `/people/:id`

### PersonDetailPage
- **Header card**: Name, Group badge, member count
- **Category filter** dropdown at top
- **Answer grid**: Compact table of question_id + Yes/No chip, filtered by category
- **Similar/Dissimilar cards** side by side: two `<Card>` components each with 5 `<ListItem>` rows showing name, similarity score (animated bar), confidence
- **Group comparisons**: Horizontal bar chart (Recharts `<BarChart>` horizontal) showing person's similarity to each group, sorted descending. On hover: confidence + shared_count tooltip

### GroupsListPage
- `<Table>` with columns: Name, Members, Cohesivity (mini bar)
- Click row → navigate to `/groups/:id`

### GroupDetailPage
- **Header card**: Name, Member count, Cohesivity gauge
- **Category filter** dropdown
- **Similar groups list**: Ranked table with similarity score + per-category mini heatmap
- **Category heatmap**: Recharts `<HeatMap>` or custom `<BarChart>` showing per-category similarity breakdown across all other groups

## Implementation Order

1. **Foundation**: Clean skeleton, theme, app shell with drawer + router, API client, types
2. **Stores**: All 5 stores + root store + React context provider
3. **PeopleListPage**: DataGrid + pagination + group filter
4. **PersonDetailPage**: Answer grid + similar/dissimilar cards + group comparison bars
5. **GroupsListPage**: Table with cohesivity bars
6. **GroupDetailPage**: Cohesivity gauge + similar groups + category heatmap
7. **Polish**: Transitions, loading skeletons, responsive layout, error states

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `REACT_APP_API_URL` | `http://localhost:8000` | Backend API base URL |
