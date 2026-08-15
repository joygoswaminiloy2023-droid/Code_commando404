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
- Polling-based live updates (notifications, activity feed, announcements) —
  built to run entirely on Vercel's serverless functions, no persistent
  server required
- Tailwind CSS + Framer Motion + Recharts + react-hot-toast

## Deploying on Vercel

1. Push this project to a GitHub repo and import it in Vercel.
2. In **Project Settings → Environment Variables**, add:
   - `MONGODB_URI` — a MongoDB Atlas connection string (Atlas has a free
     tier; a local `127.0.0.1` URI won't work since Vercel runs off-machine)
   - `NEXTAUTH_SECRET` — any long random string, e.g. `openssl rand -base64 32`
   - `NEXTAUTH_URL` — your deployed URL, e.g. `https://your-app.vercel.app`
3. Deploy. Build and start commands are the Vercel defaults (`next build` /
   `next start`) — no custom server needed.
4. Visit `/setup` once to create the first admin account — that route only
   ever works for the very first user. Every account after that is added
   from inside the dashboard (**Team → Add member**).

## Local development

```bash
npm install
cp .env.example .env.local   # fill in MONGODB_URI + NEXTAUTH_SECRET
npm run dev
```

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
- **Live updates**: the notification bell, activity feed, and announcements
  poll in the background (every 8–20s) so new assignments, completions, and
  posts show up without a manual refresh — this works the same on Vercel as
  anywhere else, since it doesn't depend on a socket staying open.
- **Responsive**: the whole dashboard, including the sidebar (an off-canvas
  drawer on mobile), project tabs, and every card grid, adapts from phone to
  desktop.

## Notes
- Uploaded files are written to `public/uploads` via the `/api/upload`
  route. **Vercel's filesystem is ephemeral** — files written at runtime
  don't persist across deployments/cold starts. For production use on
  Vercel, swap that route for S3, Cloudinary, or Vercel Blob storage; the
  rest of the app only cares about the `{ name, url, type }` shape it
  returns, so the swap is contained to that one file.
- Free/busy status is derived live from whether a member has any pending
  task, so it never drifts out of sync.
- A task assigned to a group is shared by every member of that group; any
  one of them marking it "finished" completes it for the whole group.
