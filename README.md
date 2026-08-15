<div align="center">

# ⚡ Code Commando 404

### Task management, meetings & team ops — built for teams who ship.

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=22&pause=1000&color=E8342B&center=true&vCenter=true&width=600&lines=Assign+tasks.+Ship+fast.+Repeat.;Deadlines+that+actually+notify+you.;Meetings+that+don't+get+forgotten.;Built+with+love+%2B+way+too+much+coffee." alt="Typing SVG" />

[![Live Demo](https://img.shields.io/badge/🚀_LIVE_DEMO-View_App-E8342B?style=for-the-badge)](https://codecommando404.vercel.app)
[![Made by Binary Eclipse](https://img.shields.io/badge/💡_Idea_by-Binary--Eclipse-000000?style=for-the-badge&logo=github)](https://github.com/Binary-Eclipse)

</div>

---

## 🌌 The Origin Story

> This whole idea sparked from my brother **[Binary-Eclipse](https://github.com/Binary-Eclipse)** 🖤
> One random conversation, one "we should build this," and a few hundred `MissingSchemaError`s later — **Code Commando 404** was born.
>
> Shoutout to the brother who plants the idea and disappears while I fight the deployment logs. 😤❤️

<div align="center">
<img src="https://media.giphy.com/media/xUPGcguWZHRC2HyBRS/giphy.gif" width="420" alt="idea guy vs implementation guy" />
<br/>
<sub><i>Him: "just build it, it's a simple idea" — Me, three days deep in Mongoose schema errors</i></sub>
</div>

---

## 🖥️ Live URL

<div align="center">

### 🔗 [codecommando404.vercel.app](https://codecommando404.vercel.app)

</div>

---

## ✨ What It Does

- 📋 **Task management** — assign to individuals or whole groups, set deadlines & priority
- 📅 **Meeting scheduler** — with a real date/time picker (no more typing `12:55 AM` and getting `6:55 PM` 🥲)
- 🔔 **Push notifications** — deadline reminders at 48h / 24h / 1h, delivered instantly (not a minute late, we fixed that)
- 🏆 **Leaderboards** — friendly competitive pressure to actually finish your tasks
- 💬 **Messaging** — direct threads between admin and members
- 📢 **Announcements** — broadcast to the whole team
- 🖼️ **Showcase** — flex finished project work
- 🔐 **Role-based admin console** — because not everyone should touch production

---

## 🛠️ Tech Stack

<div align="center">

### Frontend
![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)

### Backend & Data
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=for-the-badge&logo=mongoose&logoColor=white)
![NextAuth](https://img.shields.io/badge/NextAuth.js-000000?style=for-the-badge&logo=next.js&logoColor=white)

### Notifications & Extras
![Web Push](https://img.shields.io/badge/Web_Push_API-FF6B6B?style=for-the-badge&logo=googlechrome&logoColor=white)
![Vercel Blob](https://img.shields.io/badge/Vercel_Blob-000000?style=for-the-badge&logo=vercel&logoColor=white)
![React Hot Toast](https://img.shields.io/badge/React_Hot_Toast-FF4154?style=for-the-badge)
![Lucide Icons](https://img.shields.io/badge/Lucide_Icons-000000?style=for-the-badge)
![date-fns](https://img.shields.io/badge/date--fns-770C56?style=for-the-badge)
![React Datepicker](https://img.shields.io/badge/React_Datepicker-2CA5E0?style=for-the-badge)

### Deployment & Ops
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Cron Job.org](https://img.shields.io/badge/cron--job.org-E8342B?style=for-the-badge&logo=clockify&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![VS Code](https://img.shields.io/badge/VS_Code-007ACC?style=for-the-badge&logo=visual-studio-code&logoColor=white)

</div>

---

## 😩 Designer vs Developer, a Timeless Tale

<table align="center">
<tr>
<td align="center" width="50%">

**🎨 The Designer**

<img src="https://media.giphy.com/media/3orieVZSKZ8W3milgY/giphy.gif" width="260"/>

*"Just move the button 2px to the left"*

</td>
<td align="center" width="50%">

**🧑‍💻 The Developer**

<img src="https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif" width="260"/>

*rebuilds entire component tree*

</td>
</tr>
</table>

<div align="center">
<img src="https://media.giphy.com/media/QMHoU66sBXqqLqYvGO/giphy.gif" width="450" alt="pixel perfect vs it works on my machine"/>
<br/>
<sub><i>Pixel-perfect Figma vs. "it works on my machine" — the eternal war</i></sub>
</div>

---

## 🚀 Getting Started

```bash
# clone it
git clone https://github.com/<your-username>/code-commando-404.git
cd code-commando-404/taskflow

# install
npm install

# set up your env
cp .env.example .env.local
# fill in MONGODB_URI, NEXTAUTH_SECRET, VAPID keys, BLOB tokens, CRON_SECRET etc.

# run it
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start commanding. 🫡

---

## 🔐 Environment Variables

| Variable | What it's for |
|---|---|
| `MONGODB_URI` | Database connection |
| `NEXTAUTH_SECRET` / `NEXTAUTH_URL` | Auth session handling |
| `BLOB_STORE_ID` / `BLOB_READ_WRITE_TOKEN` | File uploads (Vercel Blob) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | Push notifications |
| `CRON_SECRET` | Protects the deadline-reminder cron endpoint |

---

## 🗺️ Roadmap

- [ ] Dark/light theme toggle
- [ ] Slack/Discord webhook integration
- [ ] Mobile app wrapper
- [ ] Recurring meetings
- [ ] Export reports to PDF

---

<div align="center">

### 🧡 Credits

Original spark of the idea — **[Binary-Eclipse](https://github.com/Binary-Eclipse)**, my brother, my co-conspirator in questionable 2 AM feature decisions.

<img src="https://media.giphy.com/media/l0HlvtIPzPdt2usKs/giphy.gif" width="300" alt="brothers coding"/>

**If this repo made your life easier, drop a ⭐ — it costs nothing and feeds my ego.**

</div>
