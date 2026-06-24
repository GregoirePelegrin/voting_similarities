# Frontend Plan

## Overview

A single-page React application for exploring and comparing how individuals and groups vote on yes/no questions. The UI should feel serious and premium — clean typography, generous spacing, subtle transitions, and a refined color palette. The **landing page** is a similarity map showing 2D MDS scatter plots.

## Skeleton Cleanup

- Remove irrelevant dependencies from `package.json` (deck.gl, mapbox, keycloak, turf, redux, react-redux, country-flag-icons, etc.)
- Keep: `react`, `react-dom`, `react-router-dom`, `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`, `mobx`, `mobx-react-lite`, `recharts`, `@mui/x-data-grid`
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
    embeddings.ts          # getPeopleEmbeddings, getGroupsEmbeddings
  stores/
    root-store.ts          # RootStore composing sub-stores
    people-store.ts        # People list + selected person + pagination
    groups-store.ts        # Groups list + selected group
    categories-store.ts    # Category list (fetched once)
    questions-store.ts     # Questions list (fetched once)
    embeddings-store.ts    # People + groups embeddings, stress
    ui-store.ts            # Category filter, loading states, snackbar
  pages/
    map-page.tsx           # LANDING PAGE: MDS scatter plots stacked vertically
    people-list-page.tsx
    person-detail-page.tsx
    groups-list-page.tsx
    group-detail-page.tsx
  components/
    layout/
      app-shell.tsx         # AppBar + sidebar/drawer + main content area
    map/
      people-scatter.tsx    # Recharts ScatterChart: people + barycenters
      groups-scatter.tsx    # Recharts ScatterChart: groups only
      methodology-panel.tsx # Expandable panel explaining MDS + stress
    people/
      people-table.tsx      # DataGrid with pagination + group filter
      similar-people-card.tsx  # Top 5 similar/dissimilar list
      answer-grid.tsx       # Person's answers (filterable by category)
      group-comparison-bars.tsx  # Horizontal bars: person vs each group
    groups/
      groups-table.tsx      # Table with member count, cohesivity
      cohesivity-gauge.tsx  # Visual gauge for cohesivity score
      similar-groups-list.tsx  # Ranked list of similar groups
      category-heatmap.tsx  # Per-category similarity heatmap
    shared/
      category-filter.tsx   # Dropdown to filter by category
      similarity-bar.tsx    # Reusable horizontal bar for similarity scores
      loading-skeleton.tsx  # MUI Skeleton wrappers
      animated-page.tsx     # Fade/slide transition wrapper for route changes
```

## Theming

**Palette**: Dark slate base with a warm accent. Light surface cards on a slightly darker background. This gives a "serious dashboard" feel.

```
Primary:    #4A90D9 (steel blue)
Secondary:  #E8B931 (muted gold, for highlights)
Background: #1A1F2B (near-black slate)
Surface:    #242B38 (card backgrounds)
Text:       #E8ECF1 (off-white)
```

**Typography**: Roboto. Tighter letter-spacing on headings, generous line-height on body.

**Transitions**:
- Page transitions: `<Fade>` from MUI on route changes (via `animated-page.tsx`)
- Card hover: subtle `translateY(-2px)` + box-shadow elevation
- Data loading: MUI `<Skeleton>` with pulse animation
- Score bars: CSS `transition: width 0.6s ease-out` for animated bar fills

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

**`types.ts`**: TypeScript interfaces mirroring the Pydantic schemas exactly, including:
- `CategoryOut`, `QuestionOut`, `PersonOut`, `PersonDetailOut`
- `GroupListOut`, `GroupDetailOut`
- `PeopleEmbeddingOut`, `GroupsEmbeddingOut`
- `EmbeddingPointOut`, `BarycenterOut`

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
- `total: number`, `page: number`, `groupId: number | null`
- `selectedPerson: PersonDetailOut | null`
- `fetchPeople(page, groupId?)`, `fetchPerson(id, category?)`

### `groups-store.ts`
- `groups: GroupListOut[]`
- `selectedGroup: GroupDetailOut | null`
- `fetchGroups()`, `fetchGroup(id, category?)`

### `embeddings-store.ts`
- `peopleEmbedding: PeopleEmbeddingOut | null`
- `groupsEmbedding: GroupsEmbeddingOut | null`
- `fetchPeopleEmbedding(category?)`
- `fetchGroupsEmbedding(category?)`

### `root-store.ts`
Composes all stores, passed via React context.

## Routing

```
/                  → MapPage (landing — MDS scatter plots)
/people            → PeopleListPage
/people/:id        → PersonDetailPage
/groups            → GroupsListPage
/groups/:id        → GroupDetailPage
```

## Pages

### MapPage (landing page)
- **Category filter** dropdown at top
- **People scatter plot** (stacked on top):
  - 700 points colored by `group_color`
  - Group barycenters as larger diamond markers
  - Hover tooltip: person name + group name
  - Click → `/people/:id`
  - Stress badge showing MDS fidelity
- **Groups scatter plot** (below):
  - 12 points colored by `group_color`
  - Hover tooltip: group name + member count
  - Click → `/groups/:id`
  - Stress badge
- **Methodology panel**: expandable/collapsible section explaining:
  - What MDS is and why it's used (vs PCA)
  - How distances relate to the custom similarity metric
  - What the stress value means (with thresholds)
  - How to interpret group barycenters
  - Per-category interpretation caveats

### PeopleListPage
- `<DataGrid>` with columns: ID, Name, Group
- Pagination controls synced with store
- `<Select>` filter by group
- Click row → navigate to `/people/:id`

### PersonDetailPage
- **Header card**: Name, Group badge (colored), member count
- **Category filter** dropdown
- **Answer grid**: Compact chips of question_id + Yes/No
- **Similar/Dissimilar cards** side by side
- **Group comparisons**: Horizontal bar chart with group colors

### GroupsListPage
- `<Table>` with columns: Name (with color dot), Members, Cohesivity (mini bar)
- Click row → `/groups/:id`

### GroupDetailPage
- **Header card**: Name (with color), Member count, Cohesivity gauge
- **Category filter** dropdown
- **Similar groups list**: Ranked with similarity bars
- **Category heatmap**: Per-category similarity across groups

## Methodology Panel Content

The methodology panel (`methodology-panel.tsx`) is accessible from the MapPage and contains:

### What you're seeing
This map uses **Classical Multidimensional Scaling (MDS)** to project the full similarity structure into two dimensions. Each point represents a person (or group), and the distance between points reflects how dissimilar they are according to the custom weighted asymmetric similarity metric.

### Why MDS, not PCA?
PCA operates on the raw answer matrix and would ignore the asymmetric weighting that makes Yes-Yes agreement more meaningful than No-No agreement. MDS works directly on the similarity matrix, so the 2D layout faithfully reflects **your** metric.

### The similarity metric
The underlying similarity between two people is a weighted asymmetric overlap:
- **Yes-Yes** agreement: weight 1.0 (strong signal of shared conviction)
- **No-No** agreement: weight 0.2 (weaker signal — may agree for different reasons)
- **Disagreement**: penalty −0.5

Bayesian shrinkage blends each pair's raw score with the global mean, weighted by how many questions they share (parameter m=10). This prevents spurious high/low scores between people who barely overlap.

### Stress
The **stress** value measures how much information is lost in the 2D projection:
- **< 0.1**: Good fit — the dominant structure is well captured
- **0.1–0.2**: Fair fit — main patterns visible, some distortion
- **≥ 0.2**: Poor fit — 2D is a significant reduction; interpret with caution

### Group barycenters
The larger diamond markers on the people map show each group's **barycenter** — the mean (x, y) position of all members. This is not a separate analysis; it's simply the center of gravity of the group's points.

### Per-category views
When you select a category, a separate MDS is computed using only the similarity from questions in that category. The layout may change significantly across categories — people who cluster together on one topic may spread apart on another.

## Implementation Order

1. **Foundation**: Clean skeleton, theme, app shell with drawer + router, API client, types
2. **Stores**: All stores + root store + React context provider
3. **MapPage**: People scatter + groups scatter + category filter + stress + methodology panel
4. **PeopleListPage**: DataGrid + pagination + group filter
5. **PersonDetailPage**: Answer grid + similar/dissimilar cards + group comparison bars
6. **GroupsListPage**: Table with cohesivity bars
7. **GroupDetailPage**: Cohesivity gauge + similar groups + category heatmap
8. **Polish**: Transitions, loading skeletons, responsive layout, error states

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `REACT_APP_API_URL` | `http://localhost:8000` | Backend API base URL |
