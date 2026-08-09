<!--
SEO Keywords: TaskFlow, task management CRM, Next.js task tracker, MongoDB team collaboration tool,
real-time task assignment app, Socket.io notifications, admin member task dashboard, on-time late analytics,
open source project management, Next.js 14 App Router MongoDB Mongoose NextAuth Tailwind CRM
-->

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&height=220&section=header&text=TaskFlow%20-%20Relay&fontSize=48&fontColor=ffffff&animation=fadeIn&desc=Real-time%20Task%20Assignment%20and%20Team%20Collaboration%20CRM&descSize=18" alt="TaskFlow Relay animated banner" width="100%" />

<img src="https://readme-typing-svg.demolab.com/?font=Fira+Code&weight=600&size=22&pause=1000&color=6C63FF&center=true&vCenter=true&width=650&lines=Assign+tasks.+Track+status.+Ship+on+time.;Built+for+small+teams+that+move+fast.;Real-time+updates+%E2%80%94+no+refresh+needed." alt="Typing SVG" />

<br/>

<img src="https://user-images.githubusercontent.com/74038190/212749443-0810e511-4f46-4492-96aa-3c110d7bc41a.gif" width="400" alt="Coding fun gif" />

<br/>

[![Made with Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Socket.io](https://img.shields.io/badge/Realtime-Socket.io-black?style=for-the-badge&logo=socket.io)](https://socket.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-ff69b4?style=for-the-badge)](#-contributing--collaboration)

</div>

---

## 📌 About

**TaskFlow — Relay** is a no-nonsense internal CRM for assigning and tracking work: one admin hands
tasks to team members with deadlines and file attachments (PDF, DOC, images, Figma links), everyone
sees live status the moment it changes, and admins get on-time vs. late completion analytics.
Built with **Next.js 14**, **MongoDB**, and **Socket.io** for teams that want a lightweight,
self-hosted alternative to bloated project-management tools.

<div align="center">
<img src="https://skillicons.dev/icons?i=nextjs,typescript,mongodb,tailwind,react&theme=dark" alt="Tech stack icons" />
</div>

---

## ✨ Features

| | |
|---|---|
| 🧑‍💼 **Admin** | Assign tasks with deadline, priority & attachments · add members in one click · live free/busy tracker · on-time/late analytics · post announcements · live activity ticker |
| 👤 **Member** | See only your own tasks · 1:1 profile · one-click **Finish work** · instant admin notification the moment you complete a task |
| ⚡ **Everyone** | Real-time Socket.io notifications on assignment, completion & announcements — zero page refreshes |

---

## 🧱 Stack

- **Next.js 14** (App Router) + TypeScript
- **MongoDB** + Mongoose
- **NextAuth** (credentials) for admin/member auth
- **Socket.io** (custom Node server) for real-time notifications
- **Tailwind CSS** + Framer Motion + Recharts + react-hot-toast

---

<div align="center">
<img src="https://readme-typing-svg.demolab.com/?font=Fira+Code&weight=600&size=20&pause=1000&color=FF8C42&center=true&vCenter=true&width=500&lines=Let's+get+you+set+up+%F0%9F%9A%80;Five+steps.+Two+minutes.+You're+in." alt="Setup intro typing animation" />
</div>

## 🚀 Setup

1. Install MongoDB locally (or use Atlas) and Node.js 18+.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment file and fill it in:
   ```bash
   cp .env.example .env.local
   ```
   - `MONGODB_URI` — your MongoDB connection string
   - `NEXTAUTH_SECRET` — any long random string (`openssl rand -base64 32`)
4. Run the dev server (this runs the custom Socket.io + Next.js server):
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000/setup` and create the **first admin account** — the setup
   route only ever works once, for the very first user. Every account after that is added
   from inside the admin dashboard (**Team → Add member**).
6. Sign in at `http://localhost:3000` from then on.

---

## 📦 Production

```bash
npm run build
npm start
```

`npm start` runs the same `server.js`, so Socket.io keeps working in production too.
This app needs a **persistent Node process** (not a serverless/edge platform) because
of the Socket.io server — a small VPS, Railway, Render, or a Docker container all work well.

> **Deploying to Vercel?** Vercel runs Next.js as serverless functions and does not execute
> `server.js`, so real-time Socket.io features (notifications, live announcements, the
> activity ticker) won't work out of the box. Either deploy to a platform that supports a
> persistent Node process (see above), or swap the Socket.io layer for a serverless-friendly
> pub/sub service (e.g. Pusher, Ably) before deploying to Vercel.

---

## 🗒️ Notes

- Uploaded files are stored on disk under `public/uploads`. For production at scale, swap
  `src/app/api/upload/route.ts` for S3/Cloudinary — the rest of the app only cares about the
  `{ name, url, type }` shape it returns.
- Free/busy status is derived live from whether a member has any pending task, so it never
  drifts out of sync.

---

## 🤝 Contributing & Collaboration

<div align="center">
<img src="https://user-images.githubusercontent.com/74038190/212284119-fbfd994d-8c2a-4a07-a75f-84e513833c1c.gif" width="400" alt="Collaboration gif" />
</div>

<div align="center">
<img src="https://readme-typing-svg.demolab.com/?font=Fira+Code&weight=500&size=18&pause=1200&color=00C2A8&center=true&vCenter=true&width=550&lines=Built+together%2C+better+together+%F0%9F%A4%9D;Open+an+issue+%E2%80%94+we%27d+love+your+ideas!;Fork+it.+Improve+it.+Send+a+PR." alt="Collaboration typing animation" />

<br/><br/>

<a href="https://github.com/joygoswaminiloy2023-droid/Code_commando404/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=joygoswaminiloy2023-droid/Code_commando404" alt="Contributors collage" />
</a>
</div>

Issues and pull requests are welcome — whether it's a bug fix, a new feature, or just a typo catch.

---

## 💡 Credits

<div align="center">

<img src="https://github.com/Binary-Eclipse.png" width="90" style="border-radius:50%" alt="Helaluddin Partwary avatar" />

**Idea generated by [Helaluddin Partwary](https://github.com/Binary-Eclipse)**

[![GitHub](https://img.shields.io/badge/GitHub-Binary--Eclipse-181717?style=for-the-badge&logo=github)](https://github.com/Binary-Eclipse)

</div>

---

<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=120&section=footer" alt="footer" width="100%" />
</div>
