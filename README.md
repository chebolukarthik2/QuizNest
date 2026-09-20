# QuizNest

**QuizNest** is an Online Quiz Management System (OQMS) that lets administrators create quizzes and manage questions, while students attempt quizzes and instantly view their results. Built as a full-stack academic mini-project, modeled end-to-end with UML (Class, Use Case, Activity, Sequence, Collaboration, State Chart, Component, Package, and Deployment diagrams) before implementation.

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Convex (serverless functions + real-time database)
- **Auth:** Convex Auth (email/password)
- **Hosting:** Vercel (frontend) + Convex Cloud (backend)

## Actors & Core Features

**Student:** Register, Login, View Available Quizzes, Attempt Quiz, Submit Quiz, View Result, Logout

**Admin:** Login, Create Quiz, Edit Questions (add/update/delete), Publish Quiz, View Student Results, Logout

## Data Model (matches the Class Diagram)

| Entity | Key Fields |
|---|---|
| User | userId, name, email, password, role |
| Student | studentId, course, semester |
| Admin | adminId, department |
| Quiz | quizId, title, totalMarks, duration, status |
| Question | questionId, questionText, optionA–D, correctAnswer |
| Result | resultId, score, grade, status |

**Quiz status lifecycle** (matches the State Chart Diagram): `Created → Published → InProgress → Completed → Evaluated`

## Project Structure

```
src/
├── pages/            # Presentation layer (Student & Admin screens)
│   ├── student/       # View Quizzes, Attempt Quiz, Result
│   └── admin/          # Create Quiz, Manage Questions, Publish, Results
├── convex/            # Business logic + data layer (serverless functions)
│   ├── schema.ts        # Database schema (Class Diagram → tables)
│   ├── quizzes.ts        # Quiz Component
│   ├── questions.ts     # Question Component
│   ├── results.ts        # Result Component
│   ├── users.ts           # User / Student / Admin Component
│   └── auth.ts            # Login Component
├── components/        # Shared UI components
└── hooks/              # Auth & utility hooks
```

## Local Development

### 1. Install dependencies
```bash
npm install
```

### 2. Set up Convex
```bash
npx convex dev
```
This logs you into Convex, creates a dev deployment, generates `src/convex/_generated/` (required for the app to type-check and run), and writes `VITE_CONVEX_URL` into `.env.local` automatically.

### 3. Run the app
```bash
npm run dev
```
Visit `http://localhost:5173`.

## Deploying to Vercel

QuizNest's frontend deploys to **Vercel**; its backend (database + serverless functions) deploys to **Convex Cloud**. This repo's `vercel.json` is already configured to do both in one build step.

### Step 1 — Push this repo to GitHub
```bash
git init
git add .
git commit -m "Initial commit: QuizNest"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Step 2 — Get a Convex deploy key
1. Go to [dashboard.convex.dev](https://dashboard.convex.dev) and open (or create) your project.
2. Go to **Settings → Deploy Keys** and generate a **Production** deploy key.
3. Copy it — you'll paste it into Vercel next.

### Step 3 — Import the project into Vercel
1. Go to [vercel.com/new](https://vercel.com/new) and import this GitHub repo.
2. Vercel will auto-detect the settings from `vercel.json` (build command: `npx convex deploy --cmd 'npm run build'`, output directory: `dist`).
3. Under **Environment Variables**, add:
   | Name | Value |
   |---|---|
   | `CONVEX_DEPLOY_KEY` | the production deploy key from Step 2 |
4. Click **Deploy**.

During the build, `npx convex deploy` pushes your Convex functions/schema to production, generates the typed `_generated` client, injects `VITE_CONVEX_URL` automatically, and then runs `npm run build` for the Vite frontend — all in one step.

### Step 4 — Done
Vercel gives you a live URL (e.g. `quiznest.vercel.app`). Open it, register a student account, and (for an admin account) use the `createAdminProfile` bootstrap flow described in `src/convex/users.ts`.

## Environment Variables Reference

| Variable | Where | Purpose |
|---|---|---|
| `CONVEX_DEPLOY_KEY` | Vercel project settings | Lets `convex deploy` push functions/schema during the Vercel build |
| `VITE_CONVEX_URL` | Auto-generated | Points the frontend at your Convex deployment (set automatically by `convex dev`/`convex deploy`) |

Never commit `.env.local` or any file containing real deploy keys — both are already git-ignored.

## UML Coverage

This implementation was built directly from a full UML model (Class, Use Case + descriptions, Activity with swimlanes/fork-join, Sequence, Collaboration, State Chart, Component, Package, and Deployment diagrams). Route structure mirrors the Use Case diagram; the `quizzes.status` field mirrors the State Chart; the `src/convex/*.ts` file split mirrors the Component diagram; the `pages/` vs `convex/` split mirrors the Package diagram (Presentation vs Business Logic vs Data).

## License

Academic project — free to use and modify for learning purposes.
