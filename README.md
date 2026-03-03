# GradeX

**Student portal for SRM University — timetable, attendance, marks, and academic tools in one place.**

🔗 **Live site:** [gradex.bond](https://gradex.bond)

---

## About

GradeX is a full-stack web application built for SRM University students. It brings timetable, attendance, marks, calendar, and other academic resources into a single, fast dashboard — so students spend less time jumping between portals and more time on what matters.

The app is designed for reliability and a clean experience on both web and mobile, with a focus on real data, secure auth, and useful features (including PWA support and in-app tools that tie into the university ecosystem).

---

## Features

| Area | What it does |
|------|----------------|
| **Schedule** | View and manage timetable; optional subjects, slot-wise view, export-friendly. |
| **Attendance** | Per-course attendance and percentage; leaves tracking; sync with official data. |
| **Marks** | Check grades and results in one place. |
| **Calendar** | Academic calendar and personal event reminders. |
| **Food & mess** | Mess menu and food-related info. |
| **AI assistant** | In-app chatbot for quick academic queries (timetable, attendance, marks in context). |
| **Other tools** | Seat finder, group/formation tools, RealDac, and utilities that fit student workflows. |

---

## Tech stack

- **Frontend:** React, Vite, client-side routing, responsive UI
- **Backend / API:** Node.js (Express), server-side APIs and proxies
- **Data / auth:** Convex (real-time backend), JWT-based auth
- **Infra:** Docker, Nginx, HTTPS on a VPS; optional PWA setup

---

## Highlights (for hirers)

- **Full product:** Designed, built, and deployed as a single-owner project — from UI and API design to deployment and monitoring.
- **Real users:** Built for and used by SRM students; handles real university data and auth flows.
- **Production habits:** Environment-based config, health checks, structured logging, and a clear deploy pipeline.
- **Extensible:** Modular structure so new features (e.g. new academic tools or integrations) can be added without rewriting the core.

---

## Sample code

This repo includes **sample code** that reflects the patterns and style used in GradeX (simplified, no secrets or core logic):

| Path | Description |
|------|-------------|
| [sample-code/components/](sample-code/components/) | React: reusable `Card`, `useWindowSize` hook |
| [sample-code/api/](sample-code/api/) | Node: health handler, Vercel-style route handler |
| [sample-code/lib/](sample-code/lib/) | Utils: `formatDisplayName`, `formatPercent`, `toDateString` |

See [sample-code/README.md](sample-code/README.md) for a short overview.

---

## Repo note

This repository is a **showcase** for portfolio and hiring. It contains documentation, sample code snippets, and links; the full application and main codebase are maintained separately.

---

*Live app: [gradex.bond](https://gradex.bond)*
