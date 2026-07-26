# Scooby Admin — Learning Notes

Notes on how the admin login is built, layer by layer. Reread these when something feels fuzzy.

---

## 0. The big picture

Your app has **three layers**, and a request flows through all three:

```
┌─────────────┐   password    ┌─────────────┐   query    ┌──────────────┐
│  FRONTEND   │ ───────────▶  │   BACKEND   │ ─────────▶ │   DATABASE   │
│ (page.js)   │               │ (API route) │            │  (Supabase)  │
│ what you SEE │ ◀───────────  │ the "brain" │ ◀───────── │ where data   │
└─────────────┘   yes/no +    └─────────────┘   matching  │ actually lives│
                  who you are                    row(s)    └──────────────┘
```

- **Frontend** = the page in the browser (the login form). Handles what the user sees and types.
- **Backend (API)** = code that runs on the server. Receives the password, checks it, decides yes/no. The browser never sees this logic.
- **Database** = Supabase (a hosted Postgres database). Stores the users and their data.

**Why split them?** Security. The password check must happen on the **backend**, so the browser never gets to read the whole passwords table. The browser only ever asks "is this password valid?" and gets back yes/no.

---

## 1. Database layer (Supabase + migrations)

### What Supabase is
A hosted **Postgres database** in the cloud, plus tools around it. Your data lives on their servers, not your laptop. Your project has a unique ref: `okdddxtfgztgylpetpqa`.

### Schemas
A database is split into **schemas** (labeled drawers of tables):
- `public` — **yours**, where your tables go
- `auth`, `storage`, etc. — Supabase's built-in plumbing (don't touch)

### The `users` table (your design)
```sql
create table users (
  id         bigint generated always as identity primary key,
  name       text not null,
  team       text unique,
  role       text not null,
  password   text unique not null,
  created_at timestamptz not null default now()
);
```

Key design decisions and *why*:
| Column | Choice | Why |
|--------|--------|-----|
| `id` | auto-increment number, **primary key** | A primary key must be **unique + permanent**. Names can repeat and change, so they can't be the key. Numbers never run out (unlike letters A, B, C…). |
| `password` | **unique** | Login is password-only, so the app finds you by password. Two people can't share one, or the lookup is ambiguous. |
| `role` | text + a `check` rule | Only ever `'admin'` or `'lead uploader'`. The check constraint makes the DB *reject* anything else. |
| `created_at` | `timestamptz default now()` | Auto-stamps when a row is created. `timestamptz` = timezone-aware. `now()` fills it automatically. |

### Migrations
A **migration** is a `.sql` file describing a *change* to the database. Instead of clicking in a GUI, you write the change as SQL and it becomes a permanent, versioned, repeatable record.

Flow:
```
1. npx supabase migration new <name>   → creates a blank .sql file
2. you write the SQL inside the file
3. npx supabase db push                → applies it to the cloud database
```

Check what's applied: `npx supabase migration list` — `local` = on your computer, `remote` = live in the cloud. Both filled = pushed successfully.

### Seeding
The **bootstrap problem**: the admin creates users, but who creates the first admin? You **seed** it once, manually, with an INSERT:
```sql
insert into users (name, team, role, password)
values ('Disha', 'A', 'admin', 'the-password');
```
Note: no `id` or `created_at` — they auto-fill. You only supply what the DB can't guess.

---

## 2. The Supabase client (`@supabase/supabase-js`)

A **library** your code uses to talk to the database — like a "phone your code dials." Instead of writing raw network requests, you write:
```js
supabase.from('users').select('id, name, role').eq('password', password).single()
```
and it translates that into the actual database call. Reads like a sentence: *"from users, select these columns, where password equals X, expecting one row."*

`lib/supabase.js` builds this phone **once** and exports it so other files can use it:
```js
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
```

---

## 3. Environment variables (`.env.local`)

Secrets (like your `service_role` key) must **not** live in your code (they'd end up in git / the browser). Instead they go in a private file `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://okdddxtfgztgylpetpqa.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxxxx
```
Your code refers to them **by name**: `process.env.SUPABASE_SERVICE_ROLE_KEY` means *"fetch the value with that name from `.env.local`."* You never paste the actual key into code.

- `.env.local` is auto-ignored by git (safe).
- `NEXT_PUBLIC_` prefix = allowed in the browser. **No prefix = server-only** (the secret key must stay server-only).

---

## 4. Next.js structure

- `app/page.js` → the page shown at `/` (your login form). A **React component**.
- `app/api/login/route.js` → the folder path *becomes a URL*: `/api/login`. Exporting a `POST` function makes it handle POST requests. This is your **backend API route** — runs on the server.

So **folders define the routes.** `app/api/login/` → `/api/login`.

---

## 5. React concepts (the frontend)

### A component is a function that returns UI
```jsx
export default function Login() {
  return ( <h1>Admin Login</h1> );  // JSX — HTML-like markup
}
```
Whatever it returns is what shows on screen. The HTML-looking markup is **JSX**.

### `'use client'`
Next.js components run on the **server** by default. Anything interactive (typing, clicking, `useState`) must run in the **browser** — `'use client'` at the top declares that.

### `useState` — the component's memory
```jsx
const [password, setPassword] = useState('');
```
- `password` = current value (starts empty)
- `setPassword` = the only way to change it; calling it re-renders the screen
- A plain function forgets everything; `useState` is how a component *remembers*.

### Controlled input
```jsx
<input value={password} onChange={(e) => setPassword(e.target.value)} />
```
- `value={password}` — the box always shows what's in memory
- `onChange` — every keystroke saves the new text to memory
- Loop: type → `onChange` → `setPassword` → memory updates → box re-shows it.

### Form submit & `preventDefault`
```jsx
<form onSubmit={handleSubmit}>
```
A `<form>` submit, by default, **reloads the whole page** (ancient browser behavior). `e.preventDefault()` cancels that so your JS handles it instead.

### `async` / `await` and `fetch`
```jsx
async function handleSubmit(e) {
  e.preventDefault();
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const result = await res.json();
  if (result.success) { /* logged in */ } else { /* wrong */ }
}
```
- `fetch(url, {...})` — sends a request to your API. `POST` because we're sending data.
- `JSON.stringify({ password })` — packages the password as JSON text to send. Matches `await request.json()` on the server that unpacks it.
- `await` — pauses until the network replies (needs `async` on the function).
- `await res.json()` — reads the reply (`{ success, user }`).

---

## 6. The login flow end-to-end

```
1. You type your password in the box
       → onChange saves it to state (password)

2. You click "Login"
       → handleSubmit runs, preventDefault stops the reload
       → fetch POSTs { password } to /api/login

3. The API route (server) receives it
       → request.json() unpacks the password
       → supabase.from('users').select(...).eq('password', password).single()
         asks the database: "one user with this exact password?"

4. Database replies with the matching row (or nothing)
       → match: API returns { success: true, user: { id, name, role } }
       → no match: API returns { success: false } (status 401)
         (the password itself is NEVER sent back to the browser)

5. Back in handleSubmit
       → result.success true  → greet by name + role
       → result.success false → "Wrong password"
```

---

## 7. Gotchas I hit (and the lessons)

| Bug | Lesson |
|-----|--------|
| `usestate` vs `useState` | **JavaScript is case-sensitive.** `useState`, `usestate`, `password`, `Password` are all different. |
| `import supabase` vs `import { supabase }` | A **named** export (`export const supabase`) needs **curly braces** on import. A default export doesn't. |
| `.select('id','name','role')` | Supabase `.select()` takes **one** comma-separated string: `.select('id, name, role')`. |
| `Response.json({...}, {...})` | Two **separate arguments** = two `{ }` with a comma *between*. Multiple keys in **one** object = commas *inside* one `{ }`. |
| `'success': 'false'` (string) | In JS the string `'false'` is **truthy**! Use real booleans `true` / `false` (no quotes) for `if` checks. |
| Blank page in browser | A code error crashes the render → blank page. Check the terminal running `npm run dev` for the red error + line number. |
| Edited the wrong `page.js` | `page.js` exists in many folders. **Login = `app/page.js`**, **Dashboard = `app/dashboard/page.js`**. Always check the tab name before editing. |
| Two `<main>` / multiple top elements | A component can `return` only **one** root element. Wrap siblings in a single `<div>` (or `<>...</>`). |
| Single quotes on column names in SQL | Single quotes are for **string values** (`'admin'`), not column names. Column names are **bare** (`active`, not `'active'`). |
| `default now()` on `last_login` | Don't — the login hasn't happened at row creation. Only use `default now()` when *creating the row IS the event* (`created_at`). |
| Migration shows blank on `remote` | You forgot to type **`Y`** at the `db push` confirmation. Re-run `npx supabase db push` and confirm. |
| Controlled input frozen (can't type) | `value={x}` with no `onChange` = read-only. Need **both** (see §5). |
| `.update('updates')` (string) | Passing the *word* `'updates'` instead of the **variable** `updates`. Drop the quotes — variables aren't quoted. |
| `Cannot read properties of null (reading 'map')` | A query errored → returned `null` → `null.map()` crashes. Guard the API: on `error`, return `{ users: [] }`, not null data (see §17). |
| `column users.X does not exist` | The code references a column that isn't in the table (e.g. `active` after it became `status`). Check actual columns; keep code + schema in sync. |
| Variable name mismatch (`update` vs `updates`) | JS needs the **exact same** name in both spots. `update`/`update` works; `update`/`updates` doesn't. |

---

## 8. More database — changing tables & relationships

### Adding columns to an existing table (`ALTER TABLE`)
You don't rebuild a table to change it — you write a migration that *alters* it:
```sql
alter table users
add column active boolean default true,
add column last_login timestamptz;
```
- Each new column needs its **own** `add` (you can't `add A, B`).
- Column names are **bare** — no quotes.

### Column defaults
`default X` auto-fills a column when you don't provide a value:
- `active boolean default true` → new vendors start active
- `status text default 'pending'` → new assignments start pending
- **The rule:** `default now()` only for timestamps where *creating the row IS the event* (`created_at`). For events that happen later (`last_login`), **no default** — leave it NULL until it happens.

### Relationships & foreign keys (the big one)
When one thing can have *many* of another (one vendor → many assignments), the "many" side gets its **own table** with a **foreign key** pointing back:
```sql
create table assignments (
  id         bigint generated always as identity primary key,  -- this assignment's ID
  vendor_id  bigint references users(id),                       -- WHICH vendor (foreign key)
  link       text not null,
  status     text not null default 'pending',
  created_at timestamptz not null default now()
);
```
`references users(id)` = "this column must hold a real `id` from `users`." The database **enforces** the link.

### Primary key vs foreign key — two different jobs
| Column | Question it answers | Unique? |
|--------|--------------------|---------|
| `id` (primary key) | *Which* assignment is this? | Yes — never repeats |
| `vendor_id` (foreign key) | *Whose* assignment is it? | No — repeats (a vendor has many) |

### When to use `unique` — it's a design decision, not a default
- `users.password` unique → **correct** (no two vendors should share a password)
- `assignments.vendor_id` unique → **wrong** — it would let each vendor have only **one assignment ever**, killing history + performance tracking.
- Business rule "one task *at a time*" ≠ "one task *ever*." Enforce "at a time" with `status`, not a unique key.

### Foreign-key naming
Name the column after **what it points to**: a column holding a vendor's id → `vendor_id`. (Not `assignment_id` — that name means "an assignment's id.")

---

## 9. More React / Next.js — navigation, loading data, lists

### `useRouter` — redirecting in code
```js
import { useRouter } from 'next/navigation';
const router = useRouter();          // inside the component
router.push('/dashboard');           // send the browser to another page
```
Used after login succeeds to move the admin into the app.

### `useEffect` — run code once, on page load
```js
useEffect(() => {
  fetch('/api/users').then(r => r.json()).then(d => setUsers(d.users));
}, []);
```
The component function *draws* the page — you can't fetch during drawing. `useEffect(fn, [])` says "after the page appears, run `fn` **once**." Perfect for loading data.

### `.map()` — turn an array into UI
```jsx
{users.map(u => <tr key={u.id}><td>{u.name}</td></tr>)}
```
Loops an array → one element per item. `key={u.id}` gives each a unique id React needs to track them.

### Conditional rendering — `{condition && <thing>}`
```jsx
{tab === 'vendors' && <h1>Vendors</h1>}
```
"If `tab` is `'vendors'`, show this." This is how the tab switching works — only the active tab's content renders.

### One root element per component
A component `return` can have only **one** top-level element. Multiple things → wrap in one `<div>`:
```jsx
return (<div> <h1>...</h1> <input/> <button/> </div>);
```

### API routes: GET vs POST
- **GET** = *read* data (no body). `/api/users` GET → list all users.
- **POST** = *send/write* data (has a body). `/api/login` POST, `/api/users` POST → add a vendor.
- Insert a row: `await supabase.from('users').insert({ name, role: 'lead uploader', password })`
- Generate a quick password in JS: `Math.random().toString(36).slice(-8)`

---

## 10. Git & GitHub — saving your work

- **Git** = version control on your computer — saves snapshots ("commits") you can return to.
- **GitHub** = the cloud copy of those snapshots (backup + shareable + needed for deployment).
- The flow, run after something works:
  ```bash
  git add .                       # stage all changes
  git commit -m "what changed"    # save a snapshot locally
  git push                        # upload to GitHub
  ```
- **`.gitignore`** keeps secrets out — `.env.local` (your keys) and `node_modules` are never uploaded.
- Commit **often** — small frequent saves beat one giant one. "WIP" in a message = work-in-progress (fine to commit unfinished work as a save point).

---

## 11. CRUD — the four things every app does to data

Almost everything an app does to data is one of **four** operations. Each has an HTTP method and a Supabase call:

| Letter | Operation | HTTP method | Supabase | Example |
|--------|-----------|-------------|----------|---------|
| **C** | Create | `POST` | `.insert()` | add a vendor |
| **R** | Read | `GET` | `.select()` | list vendors |
| **U** | Update | `PATCH` | `.update()` | reset password, rename |
| **D** | Delete | `DELETE` | `.delete()` | remove a vendor |

The method names are **conventions** — they signal intent. `GET` = "get info out," `POST` = "post info in," `PATCH` = "change existing," `DELETE` = "remove."

---

## 12. Updating data — the PATCH endpoint pattern

`.update()` changes an **existing** row (vs `.insert()` which adds a new one). You must say **which** row with `.eq()`:
```js
await supabase.from('users').update({ password: newPass }).eq('id', id);
```
⚠️ **Without `.eq()`, `.update()` changes EVERY row** (same danger as SQL `UPDATE` with no `WHERE`).

### One flexible endpoint via rest destructuring
```js
const { id, ...updates } = await request.json();
await supabase.from('users').update(updates).eq('id', id);
```
`const { id, ...updates }` pulls `id` out and gathers **everything else** into `updates`:
- send `{ id, password }` → `updates = { password }` → resets password
- send `{ id, name }` → `updates = { name }` → renames
- send `{ id, status }` → `updates = { status }` → changes status

So **one** PATCH handles all "edit a vendor" actions — it applies whatever fields you send. No need for separate endpoints per field.

---

## 13. `.eq()` and filters — conditions on rows

`.eq('id', 5)` = **"keep only rows where the `id` column equals `5`."** It's a **filter/condition**, like an `if` run on every row:
```js
users.filter(row => row.id === 5)   // the JS equivalent
```
It maps directly to SQL: `.eq('id', 5)` = `WHERE id = 5`.

**Comparison vs assignment** (two kinds of "equals"):
- `.eq('id', 5)` → *checks* "is id equal to 5?" (find/match rows)
- `.update({ active: false })` → *sets* active to false (assign a value)

Other filters: `.gt()` (greater than), `.lt()` (less than), `.neq()` (not equal). Chain them for AND: `.eq('role','lead uploader').eq('status','active')`.

---

## 14. HTTP status codes

Numbers the server sends back to say how a request went. **The first digit is the category:**

| Range | Meaning |
|-------|---------|
| **2xx** | ✅ Success (200 OK, 201 Created) |
| **3xx** | ↪️ Redirect |
| **4xx** | ❌ **Client** error — *you* sent something wrong (400 Bad Request, 401 Unauthorized, 404 Not Found) |
| **5xx** | 💥 **Server** error — the server broke (500 Internal Server Error) |

Memory hook: **4 = my fault, 5 = server's fault.** Don't memorize them all — know the categories + a handful (200/401/404/500), look up the rest. In your code: `401` = wrong login, `500` = a DB call failed.

---

## 15. Sending & receiving data — the JSON round trip

Networks carry **text**, not objects. So objects get converted to text to send, and back to objects on arrival.

- **`JSON.stringify(obj)`** → object → text (to send in a request body)
- **`await request.json()`** / **`res.json()`** → text → object (to read a body/response)

The full round trip:
```
SERVER: Response.json({ users: [...] })   → sends text {"users":[...]}
                                                  │ (over network)
CLIENT: fetch(...)        → r   (the response)
        r.json()          → d   (parsed object { users: [...] })
        d.users           → the array (key must match what the server sent!)
```
`r` = **r**esponse, `d` = **d**ata — just nicknames. `d.users` works because the server wrapped it as `{ users: ... }`; **the key must match on both sides.**

### `.then()` chains vs `async/await`
Same thing, two styles:
```js
fetch(url).then(r => r.json()).then(d => setUsers(d.users));  // .then chain
// same as:
const r = await fetch(url);
const d = await r.json();
setUsers(d.users);
```

---

## 16. Migrations vs data operations — a key distinction

- **Migration** = change the database's **structure/shape** → new table, new column, constraint. (renovating the house)
- **insert / update / delete** = change the **data/values** in existing rows → happens at runtime via app code. (moving stuff around inside the house)

**Rule:** new column or table → migration. New/changed *value* in a row → app code, no migration.

---

## 17. Defensive coding — don't trust a query succeeded

Your GET returned `{ users: data }` — but if the query **errors**, `data` is `null`, and the frontend crashes on `null.map()`. Always handle the error:
```js
const { data, error } = await supabase.from('users').select(...);
if (error) return Response.json({ users: [] });   // empty array, never null
return Response.json({ users: data });
```
Now a failed query shows an empty table instead of a crashed page. Assume things can fail; guard for it.

---

## 18. React vs Streamlit/HTML — why it feels harder

- **HTML** = static (no data, no logic).
- **Streamlit** = hides the machinery (`st.table(df)` secretly fetches, stores, re-runs).
- **React** = makes you wire it by hand — more code, but full control.

The React pattern for showing any list is always the same three moves:
> **state (hold) → effect (load) → map (show)**
```js
const [users, setUsers] = useState([]);                              // state
useEffect(() => { fetch(...).then(...).then(setUsers) }, []);        // effect
{users.map(u => <tr>...</tr>)}                                        // map
```
That trio does the same job as Streamlit's one-line `st.table()` — just spelled out. Learn it once; every list/table reuses it.

### Handy patterns you used
- **Auto team letters:** `String.fromCharCode(65 + count)` — `'A'` is code 65, so `65+1='B'`, etc.
- **Count rows:** `.select('*', { count: 'exact', head: true })` → returns `count` without fetching rows.
- **Readable dates:** `new Date(u.created_at).toLocaleString()` — raw timestamp text → local date/time.
- **Ternary for null:** `u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'` — "if it exists show it, else 'Never'."
- **Honest placeholders:** show `"Yet to calculate"` for not-yet-built metrics instead of fake numbers.

---

## Commands cheat-sheet

```bash
# App
npm run dev                         # start the app at http://localhost:3000
npm install <package>               # add a library

# Supabase (database)
npx supabase migration new <name>   # create a blank migration
npx supabase db push                # apply migrations to the cloud (type Y to confirm!)
npx supabase migration list         # local vs remote migration status
npx supabase projects api-keys --project-ref <ref> --reveal   # get your API keys

# Peek at your data without the dashboard
node --env-file=.env.local show_users.mjs   # print all users (incl. passwords)

# Git / GitHub
git add . && git commit -m "msg" && git push   # save + upload
git status                          # what's changed
git log --oneline                   # commit history
```
