# Scooby Build — Setbacks & Learnings

A retrospective of building the admin dashboard from scratch: every setback, how it was solved, and everything learned along the way.

---

## Part 1 — Setbacks (and how they were solved)

### Setup & environment
| Setback | What happened | Fix / lesson |
|--------|---------------|--------------|
| Installed Supabase in the wrong folder | Ran `npm install` where there was no `package.json`, so npm walked *up* and installed it in the home folder | npm looks upward for `package.json`; always install *inside* the project |
| `supabase` "not recognized" | Tried to run a locally-installed package as a global command | Local packages run via **`npx supabase ...`** |
| Couldn't rename the project folder | Windows blocked it — VS Code / OneDrive were *holding* the folder open | A folder in use can't be renamed; close the app locking it |
| "Is the database in the folder?" | Confusion about where data lives | The DB lives in the **cloud**; the folder only holds a *config pointer* to it |
| "The database is empty / it's not supposed to be" | Expected data to exist | For a from-scratch build, **empty is the starting point** — you *design* it |
| Invalid API key | Key was incomplete / wrong format | Learned key formats (`sb_secret_…` vs legacy `eyJ…` JWT) and how to fetch keys via the CLI (`supabase projects api-keys --reveal`) |
| Migration command errored (`AlreadyExists`) | A OneDrive/CLI glitch | You can **create the `.sql` migration file by hand** instead |
| Migration didn't apply | Forgot to type **`Y`** at the `db push` prompt | Confirm prompts; check `migration list` (local vs remote) |

### JavaScript / React syntax
| Setback | Lesson |
|--------|--------|
| `usestate` vs `useState`, `Password` vs `password` | **JavaScript is case-sensitive** — exact spelling matters |
| `import supabase` vs `import { supabase }` | **Named** exports need curly braces; default exports don't |
| `.select('id','name')` (3 args) | Supabase `.select()` takes **one** comma-separated string |
| `Response.json({...}, {...})` | Two **separate** arguments (body, options) — each its own `{}` |
| `success: 'false'` (string) | The string `'false'` is **truthy**! Use real booleans `true`/`false` |
| Missing `async` on a function using `await` | `await` requires `async` on the function |
| `const router = useRouter` (no `()`) | Must **call** the function — `useRouter()` |
| Unclosed / extra `{ }`, `( )`, `<div>` | **Count them** — every open needs exactly one close |
| Two `<main>` returned | A component returns **one** root element — wrap siblings in a `<div>` |
| `classname` vs `className` | React uses **`className`** (capital N) |
| `const vendorCount` twice | Can't declare the same `const` twice in one scope |
| Edited the *wrong* `page.js` (login vs dashboard) | `page.js` exists in every route folder — **check the tab name** |
| `if`/`return` inside JSX | Logic goes in **functions**; only markup goes in the `return` |

### CSS
| Setback | Lesson |
|--------|--------|
| Gradient missing a comma / had an extra `)` | **One bad character = the whole property is silently ignored** |
| `.auth-page` missing its closing `}` | A rule that doesn't close "leaks" into the next — count braces |
| `1.5 rem` (space) | Units can't have a space: `1.5rem` |

### Runtime / logic bugs
| Setback | Lesson |
|--------|--------|
| `Cannot read properties of null (reading 'map')` | A failed query returned `null`; **guard APIs** — return `[]` on error |
| `column users.active does not exist` | Code referenced a column that had been renamed to `status` — keep code + schema in sync |
| Deactivate "not working" | It *was* working — there was just no UI showing the status. **Fixed by showing it** (faded rows) |
| Status buttons "dummy" | The **PATCH route was missing its `request` parameter** → silent failure |
| Empty name / non-link accepted | No **validation** — added guards (`!name.trim()`, `!link.startsWith('http')`) |
| VS Code "file is newer" / can't save | Editor buffer drifted from disk. **Revert** to pull disk in (don't overwrite) |
| "Failed to fetch" | The **dev server had crashed** — restart with `npm run dev` |

---

## Part 2 — New things learned (and how)

### Databases (learned by designing the schema yourself)
- **Schemas & tables** — a DB is drawers (schemas) of spreadsheets (tables)
- **Primary key** — must be **unique + permanent** (why `id`, not `name`)
- **Unique constraints** — same keyword, opposite decisions (`password` unique = good; `vendor_id` unique = bad — would block a vendor's 2nd assignment)
- **Foreign keys / relationships** — `assignments.vendor_id references users(id)` → a **one-to-many** relationship
- **Check constraints** — lock a column to valid values (`role in ('admin','lead uploader')`)
- **Defaults** — `default now()` (when creating *is* the event) vs no default (event hasn't happened, e.g. `last_login`)
- **Migrations** — schema as **versioned code**, repeatable + tracked
- **Seeding / the bootstrap problem** — the first admin is created manually, once
- **`ALTER TABLE`** — change structure vs. changing *data* (insert/update = app code, no migration)

### Backend / APIs (learned by building routes)
- **CRUD** — Create/Read/Update/Delete → **POST/GET/PATCH/DELETE** → `insert/select/update/delete`
- **REST API** — resources are URLs; the HTTP method decides the action
- **HTTP status codes** — 4xx = client's fault, 5xx = server's fault
- **`.eq()`** — a filter/condition, like an `if` on every row (= SQL `WHERE`)
- **The JSON round trip** — `stringify` to send, `.json()` to read; keys must match on both sides
- **Why the backend?** — the browser never touches the DB directly (security); the API is the gatekeeper

### Frontend / React & Next.js (learned by building pages)
- **Components** = functions that return **JSX**
- **`useState`** = a component's memory; **`useEffect`** = run code on load (e.g. fetch)
- **Controlled inputs** — `value` + `onChange` keep state and box in sync
- **The list pattern** — **state → effect → map** (React's version of Streamlit's `st.table`)
- **Conditional rendering** — `{cond && <thing>}` (how the tabs work)
- **File-based routing** — folders become URLs (`app/vendor/page.js` → `/vendor`)
- **`'use client'`** — marks browser-side (interactive) components
- **`localStorage`** — a lightweight "session" to remember the logged-in user across pages
- **`useRouter` / role-based routing** — send admins and vendors to different pages
- **`rem`** — sizing relative to base font (1rem = 16px)
- **Glassmorphism, gradients, `@keyframes` animation** — CSS for a premium feel

### Tools & workflow
- **npm vs npx**, the **dev server** (`npm run dev`), **`.env.local`** for secrets
- **Git / GitHub** — commit often, `.gitignore` keeps keys out, commits = save points
- **Reading error messages** — line numbers + the actual message point to the fix

---

## Part 3 — The real skills (mindset shifts)

1. **Coding fluency = pattern recognition, not memorizing syntax.** You learned to *see the shape* of a solution (form → API → query) — everyone looks up the exact syntax.
2. **Errors are guides, not failures.** "See red → read it → know what it means → fix it" became a reflex. That loop *is* debugging.
3. **You catch your own bugs now** — often *before* running the code. That's the leap from "reading code" to "writing code."
4. **Build > watch.** Tutorials are passive and forgettable; building forces real problem-solving that sticks.
5. **Design before you build.** The database was reasoned out on paper first — the hard part was the *thinking*, not the SQL.
6. **Honesty about scope** — knowing what's real vs. mocked, and framing "what's next" as a roadmap.

---

## What you built (proof of all this)
A two-sided platform: password auth + role routing, full vendor management (create/list/reset/deactivate), a work **handoff loop** (admin assigns → vendor sees → opens → status flows back → admin sees stats), delete-assignment, real stats, and a branded dark theme — on Next.js + Supabase, **from scratch, in a few days, as a beginner.**
