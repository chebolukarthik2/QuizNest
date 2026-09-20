<div align="center">

# 🧠 QuizNest

### The quiz platform that grades itself so you don't have to.

**Create quizzes. Publish instantly. Watch results roll in — automatically graded, zero manual effort.**

[![Made with React](https://img.shields.io/badge/Frontend-React_19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![Powered by Convex](https://img.shields.io/badge/Backend-Convex-EE342F?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIi8+PC9zdmc+&logoColor=white)](https://convex.dev)
[![Deployed on Vercel](https://img.shields.io/badge/Hosted_on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)

<br/>

[✨ Live Demo](#) · [🚀 Quick Start](#-quick-start) · [🏗️ Architecture](#️-architecture) · [📸 Screenshots](#-screenshots)

</div>

---

## 🎯 What is QuizNest?

QuizNest is a full-stack **Online Quiz Management System** built for two kinds of people: the ones who *make* the quiz, and the ones who *take* it.

- 🧑‍🎓 **Students** register, browse live quizzes, attempt them, and get results the instant they hit submit.
- 🧑‍💼 **Admins** spin up a quiz, build out the question bank, publish it, and watch scores populate a live results dashboard.

No spreadsheets. No manual grading. No "I'll email you the results next week."

---

## ⚡ Features

| | |
|---|---|
| 🔐 **Secure Auth** | Email + password authentication, powered by Convex Auth with proper JWT signing |
| 📝 **Quiz Builder** | Create quizzes with custom titles, total marks, and duration limits |
| ❓ **Question Bank** | Add, edit, or delete multiple-choice questions on the fly |
| 🚦 **Publish Control** | Quizzes stay hidden until an admin explicitly publishes them |
| ⏱️ **Live Attempts** | Students attempt quizzes in a clean, distraction-free interface |
| ⚡ **Instant Grading** | Scores, grades, and status are calculated the second a quiz is submitted |
| 📊 **Results Dashboard** | Admins get a real-time view of every student's performance |
| 🌗 **Dark Mode** | Because obviously |

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technology |
|---|---|
| **Frontend** | React 19 · TypeScript · Vite · Tailwind CSS · shadcn/ui |
| **Backend** | Convex (serverless functions + real-time database) |
| **Auth** | Convex Auth (email/password, JWT-based sessions) |
| **Hosting** | Vercel (frontend) + Convex Cloud (backend) |

</div>

---

## 🏗️ Architecture

QuizNest's frontend and backend deploy independently but stay wired together through one environment variable:

```text
   QuizNest Frontend
          │
          ▼
        Vercel  ──────────────  CONVEX_DEPLOY_KEY
          │
          ▼
   Convex Production
          │
          ├── Functions   ✅
          ├── Schema      ✅
          ├── Data        ✅
          ├── JWT signing keys ✅
          └── Live auth endpoints ✅
```

Every screen, form, and API call traces back to a full UML model designed before a single line of code was written:

- **Class Diagram** → the database schema (`User`, `Student`, `Admin`, `Quiz`, `Question`, `Result`)
- **State Chart** → a quiz's lifecycle (`Created → Published → InProgress → Completed → Evaluated`)
- **Use Case Diagram** → every page and route in the app
- **Component Diagram** → the `src/convex/*.ts` file split
- **Package Diagram** → the `pages/` vs `convex/` separation

---

## 🚀 Quick Start

```bash
# 1. Clone it
git clone https://github.com/<your-username>/QuizNest.git
cd QuizNest

# 2. Install dependencies
npm install

# 3. Spin up Convex (creates your dev deployment + generates types)
npx convex dev

# 4. Run the app
npm run dev
```

Open **http://localhost:5173** and you're in. 🎉

---

## ☁️ Deploying Your Own

QuizNest ships ready to deploy: **Vercel** for the frontend, **Convex Cloud** for the backend.

### 1️⃣ Push to GitHub
```bash
git init && git add . && git commit -m "Initial commit: QuizNest"
git branch -M main && git remote add origin <your-repo-url>
git push -u origin main
```

### 2️⃣ Set up Convex Production Auth
Convex Auth needs its own signing keys on your **production** deployment (separate from anything you set in Vercel):

```bash
npx convex login
npx @convex-dev/auth   # auto-generates & sets JWT_PRIVATE_KEY + JWKS + SITE_URL
```

### 3️⃣ Import into Vercel
1. [vercel.com/new](https://vercel.com/new) → import your repo
2. Vercel reads `vercel.json` automatically — no manual build config needed
3. Add **one** environment variable:

   | Key | Value |
   |---|---|
   | `CONVEX_DEPLOY_KEY` | Production deploy key from [dashboard.convex.dev](https://dashboard.convex.dev) → Settings → Deploy Keys |

4. Hit **Deploy** 🚀

That's it — every push to `main` redeploys both your frontend *and* your Convex backend together.

---

## 📸 Screenshots

> _Add your own screenshots here — Student Dashboard, Quiz Attempt screen, Admin Results view, etc._

---

## 🔒 Security Notes

- Deploy keys are scoped to `deployment:deploy` only — least privilege, no admin/data access
- JWT signing keys live exclusively in Convex's environment, never in source control
- `.env.local` and `.env.keys` are git-ignored by default

---

## 📄 License

Free to use, fork, and build on. Academic project turned real product — do something cool with it.

<div align="center">

**Built with 🧠 for people who'd rather build quizzes than grade them by hand.**

</div>
