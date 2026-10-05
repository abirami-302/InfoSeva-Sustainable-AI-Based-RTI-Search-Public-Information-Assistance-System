# InfoSeva — Sustainable AI-Based RTI Search & Public Information Assistance System

This is a production-quality **frontend-only** React application built with React.js, Tailwind CSS, React Router, Framer Motion, and Lucide React icons.

## Getting Started

```bash
npm install
npm start
```

The app will run at `http://localhost:3000`.

To create a production build:

```bash
npm run build
```

## How to Explore

The landing page (`/`) is the public entry point. Click **Login / Sign Up** in the top-right corner and choose a role:

- **Citizen / User** -> `/user` -- Dashboard, Search Information, RTI Retrieval & Analysis, Generate RTI Draft, Government Schemes, Document Summarizer & Scanner, AI Assistant, Saved Items, Profile.
- **Data Manager** -> `/datamanager` -- Dashboard, API Management, Data Sources, Document Upload, Bulk Upload, Data Ingestion, OCR Queue, AI Indexing, Analytics, Profile.
- **Administrator** -> `/admin` -- Dashboard, User Management, Department Management, Data Manager Management, Documents, RTI Repository, Government Schemes, Analytics, Platform Settings, System Logs, Profile.

All data shown is realistic dummy/mock data (no backend is connected -- this is a frontend-only deliverable per the project brief).

## Tech Stack

- React.js (JavaScript, no TypeScript)
- Tailwind CSS (custom Government Blue / Saffron / Green theme)
- React Router v6
- Framer Motion (animations & transitions)
- Lucide React (icons)
- Recharts (admin & data manager analytics charts)

## Project Structure

```
src/
  components/
    common/         -> Shared UI primitives (Ashoka Emblem, StatCard, Badges, SearchBar, etc.)
    layout/         -> Sidebar + top-nav layouts for User / Admin / Data Manager
  context/
    AuthContext.js  -> Simple role-based mock auth (no real backend)
  data/
    dummyData.js    -> All realistic mock/dummy data used across the app
  pages/
    landing/        -> Public landing page
    user/           -> All citizen-facing pages
    admin/          -> All admin pages
    datamanager/    -> All data manager pages
```

## Notes

- This is a frontend-only project -- no backend logic is implemented. Login simply switches the active mock role.
- All search, RTI, scheme, and document data is hard-coded dummy content designed to look realistic for demo/presentation purposes.
- The design uses an Ashoka Emblem-inspired SVG logo, the Government Blue / Saffron / Green color palette, and a tricolor accent bar throughout, in line with the official Government of India aesthetic.
