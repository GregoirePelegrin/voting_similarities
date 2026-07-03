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

### In Progress
- Rebuild both containers and test

### Blocked
(none)

## Key Decisions
- Categories not persisting was likely caused by Docker build cache skipping the updated `ui-store.ts` on the previous rebuild; forcing `--no-cache` fixes it
- Use `localStorage` for persistence (not URL query params) — simplest approach, works across all pages without changing URLs or effects
- Full rename Question→Vote includes DB tables, SQLAlchemy models, API endpoints, schemas, frontend types/components/pages/routes, and all French UI strings
- Answer model stays as-is (only FK column `question_id` → `vote_id`)
- Fresh SQLite DB: drop all compute+tables+questions/answers/vote_category, re-run compute script

## Next Steps
1. Rebuild both containers with podman
2. Drop old DB tables and re-run compute script (or delete data/voting.db)
3. Verify API and frontend work correctly

## Relevant Files
- backend/app/models.py: Question→Vote rename done
- backend/app/schemas.py: rename done
- backend/app/similarity.py: rename done
- backend/scripts/compute_similarities.py: rename done
- backend/scripts/seed.py: rename done
- backend/app/api/routes.py: rename done
- frontend/src/stores/ui-store.ts: localStorage persistence done
- frontend/src/pages/voter-detail-page.tsx: reset removed, vote rename done
- frontend/src/pages/group-detail-page.tsx: reset removed, vote rename done
- frontend/src/api/types.ts: rename done
- All frontend API files, stores, pages, components, routes, and fr.ts: rename done
