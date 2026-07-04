# Session Summary

## Goal
Persist selected categories and sort mode across page navigations and URL loads; rename "question" → "vote" throughout the codebase and UI.

## Constraints & Preferences
- Full backend+frontend rename of Question→Vote (keep Answer), with fresh SQLite DB
- Categories/sort mode persisted via localStorage, categories reset removed from detail pages
- Precompute all data, no on-the-fly computation at query time
- SQLite DB via volume mount, containers rebuilt with podman
- All UI labels in French (constants/fr.ts)

## Progress
### Done
- Backend `models.py`: `Question` → `Vote`, `questions` → `votes`, `question_category` → `vote_category`, `Answer.question_id` → `vote_id`
- Backend `schemas.py`: `QuestionOut` → `VoteOut`, `QuestionDetailOut` → `VoteDetailOut`, `AnswerOut.question_id` → `vote_id`, `question_text` → `vote_text`, embedding `shared_questions` → `shared_votes`
- Backend `similarity.py`: all variable/function renames (`question_ids`→`vote_ids`, `get_intersection_question_indices`→`get_intersection_vote_indices`, `category_questions`→`category_votes`, etc.)
- Backend `compute_similarities.py`: all renames done
- Backend `seed.py`: `Question`→`Vote`, all variables/comments renamed
- Backend `routes.py`: endpoints `/questions`→`/votes`, all model/column/variable renames
- Frontend `ui-store.ts`: `selectedCategories` and `sortMode` restored from `localStorage` on init, saved on every change
- Frontend `types.ts`: all interface/field renames (`VoteOut`, `VoteDetailOut`, `vote_id`, `vote_text`, `shared_votes`)
- Frontend `api/questions.ts`→`votes.ts`: renamed file, functions, endpoint
- Frontend `stores/questions-store.ts`→`votes-store.ts`: renamed class, props, methods
- Frontend `stores/root-store.ts`: updated import
- Frontend `pages/questions-list-page.tsx`→`votes-list-page.tsx`: renamed component
- Frontend `pages/question-detail-page.tsx`→`vote-detail-page.tsx`: renamed component
- Frontend `components/questions/`→`votes/`: directory + file renamed
- Frontend `app.tsx`: route paths `/questions`→`/votes`
- Frontend `constants/fr.ts`: all French string renames (`QUESTIONS_TABLE`→`VOTES_TABLE`, `QUESTION_DETAIL`→`VOTE_DETAIL`, etc.)
- All other frontend pages/components: updated imports, prop refs, store refs
- `voter-detail-page.tsx` and `group-detail-page.tsx`: removed `uiStore.setCategories([])` from mount effect

### Session 2 — Credibility Audit Fixes (all 17 issues resolved)
- `apply_bayesian_shrinkage` → `apply_shrinkage` (+ all references, config, docs, .env)
- Group-group `shared_count` uses actual answered-vote overlap from `data.mask_matrix`
- `ComputationMeta` model created, stored after compute
- `domain={[0, 1]}` on group-comparison-bars, `domain={[-100, 100]}` on category-alignment-card
- Axis labels (MDS Dim 1/Dim 2) on scatter plots via `<Label>` component
- Similar/dissimilar lists split by sign (≥0 / <0), no overlap
- Confidence + shared_count displayed on similar-voters-card and similar-groups-list
- Category alignment tooltip shows own_group_similarity + avg_other_group_similarity
- Sigmoid → linear color gradient in `colors.ts`
- Answer grid legend tooltips with descriptions in `fr.ts`
- MDS stress=0 → stress=1.0 for degenerate case (n ≤ n_components)
- `sampleSize` prop on `CohesivityGauge`, wired from backend `answered_count`/`present_count`
- `categoriesLabel` passed to `CategoryAlignmentCard` and `DeterminantCategoriesCard`
- Aspect-ratio containers on scatter plots (`aspectRatio: "1/1"`)
- `filterAnnotation()` utility in `fr.ts`, used across all pages

### In Progress
- Deploy via `./deploy.sh` with container rebuild

### Blocked
(none)

## Key Decisions
- Categories not persisting was likely caused by Docker build cache skipping the updated `ui-store.ts` on the previous rebuild; forcing `--no-cache` fixes it
- Use `localStorage` for persistence (not URL query params) — simplest approach, works across all pages without changing URLs or effects
- Full rename Question→Vote includes DB tables, SQLAlchemy models, API endpoints, schemas, frontend types/components/pages/routes, and all French UI strings
- Answer model stays as-is (only FK column `question_id` → `vote_id`)
- Fresh SQLite DB: drop all compute+tables+questions/answers/vote_category, re-run compute script

## Next Steps
1. Deploy via `./deploy.sh` (rebuilds containers with podman)
2. Drop old DB tables and re-run compute script
3. Verify API and frontend work correctly

## Relevant Files
- backend/app/models.py: Question→Vote rename, ComputationMeta model added
- backend/app/schemas.py: rename done, answered_count/present_count added to VoterDetailOut/GroupDetailOut
- backend/app/similarity.py: rename done, group-group shared_count fixed, two-stage shrinkage documented
- backend/scripts/compute_similarities.py: rename done, ComputationMeta stored
- backend/scripts/seed.py: rename done
- backend/app/api/routes.py: rename done, similar/dissimilar overlap fixed, answered_count/present_count in responses
- frontend/src/stores/ui-store.ts: localStorage persistence done
- frontend/src/pages/voter-detail-page.tsx: reset removed, vote rename done, sampleSize+categoriesLabel wired
- frontend/src/pages/group-detail-page.tsx: reset removed, vote rename done, sampleSize+categoriesLabel wired
- frontend/src/api/types.ts: rename done, answered_count/present_count added
- issues-fix.md: comprehensive audit and fix tracking document
- All frontend API files, stores, pages, components, routes, and fr.ts: rename done
- frontend/src/utils/colors.ts: linear gradient
- frontend/src/components/voters/answer-grid.tsx: legend tooltips
- frontend/src/components/map/voters-scatter.tsx: axis labels, aspect-ratio
- frontend/src/components/map/groups-scatter.tsx: axis labels, aspect-ratio
