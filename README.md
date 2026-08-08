# Code Commando 404

A multi-project internal workspace: an admin creates projects, builds a team
and groups inside each one, assigns tasks (to individuals or a whole group at
once) with deadlines and files, and everyone sees live status. Admins get
on-time/late analytics and full control over the team; members only see the
projects they've been added to.

## Stack
- Next.js 14 (App Router) + TypeScript
- MongoDB + Mongoose
- NextAuth (credentials) for admin/member auth
- Socket.io (custom Node server) for real-time notifications
- Tailwind CSS + Framer Motion + Recharts + react-hot-toast

## Features
- **Projects**: admins create as many projects as needed. Each project has
  its own members, groups, tasks, files and links — nothing bleeds between
  projects.
- **Team & groups**: add any team member to a project, then group 2 or more
  of them together (e.g. "Frontend squad") so a task can be assigned to the
  whole group in one shot instead of person by person.
- **Tasks**: assign to one person, several people, or a group; attach PDFs,
  DOCs, images, or a Figma link; edit or delete a task at any time; deadline,
  priority, and live pending/completed status throughout.
- **Files & links**: admins upload files straight from their PC or paste a
  link (Figma, Drive, anything) into a project — every member of that
  project can see, open, and (if admin) rename or remove it.
- **User management**: add members, block or unblock an account (a blocked
  account can't sign in), set a profile photo, see per-member completion
  stats (on-time vs late).
- **Live**: instant Socket.io notifications on assignment/completion/
  announcement — no page refresh needed.
- **Responsive**: the whole dashboard, including the sidebar (an off-canvas
  drawer on mobile), project tabs, and every card grid, adapts from phone to
  desktop.

## Setup

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
5. Open `http://localhost:3000/setup` and create the **first admin
   account** — the setup route only ever works once, for the very first
   user. Every account after that is added from inside the admin dashboard
   (**Team → Add member**).
6. Sign in at `http://localhost:3000` from then on.

## Using it

- As admin: **Overview** → **New project** → open the project → add members
  in **Team & groups**, optionally group some of them, then **Assign task**
  from the **Tasks** tab. Drop files or links for the whole project in
  **Files & links**.
- As a member: **My projects** shows every project you're in. Open one to
  see your tasks, mark them finished, and browse the files/links the admin
  shared.
- Block a disruptive account any time from **Team** — they're immediately
  signed out of future sign-in attempts.

## Production

```bash
npm run build
npm start
```

`npm start` runs the same `server.js`, so Socket.io keeps working in
production too. This app needs a persistent Node process (not a
serverless/edge platform) because of the Socket.io server — a small VPS,
Railway, Render, or a Docker container all work well.

## Notes
- Uploaded files are stored on disk under `public/uploads`. For production
  at scale, swap `src/app/api/upload/route.ts` for S3/Cloudinary — the rest
  of the app only cares about the `{ name, url, type }` shape it returns.
- Free/busy status is derived live from whether a member has any pending
  task, so it never drifts out of sync.
- A task assigned to a group is shared by every member of that group; any
  one of them marking it "finished" completes it for the whole group.
