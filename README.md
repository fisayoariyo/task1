# nomnom

Food delivery web app built with **React**, **Vite**, **React Router**, and **Tailwind CSS**.

## Stack

- React 19
- Vite
- React Router
- Tailwind CSS v4
- CSS modules / shared styles in `frontend/src/styles`

## Run

```bash
cd frontend
npm install
npm run dev
```

## Routes

| Path | Page |
|------|------|
| `/` | Landing |
| `/discovery` | Restaurants |
| `/restaurant` | Menu |
| `/checkout` | Checkout |

## Build

```bash
cd frontend
npm run build
npm run preview
```

## Deploy

Vercel builds `frontend/` and serves the SPA from `frontend/dist` (see root `vercel.json`).

## Project layout

| Path | Purpose |
|------|---------|
| `frontend/` | React app |
| `frontend/src/pages/` | Page components |
| `frontend/src/components/` | Shared UI |
| `frontend/src/styles/` | Design tokens and layout CSS |
| `frontend/public/assets/` | Static images |
| `legacy/` | Old static prototype (not used by the app) |
