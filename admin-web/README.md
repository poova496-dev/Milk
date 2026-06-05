# Manjula Milk — Admin Web (PC)

Full seller admin panel for desktop browsers. Uses the **same Supabase database** as the mobile app.

## Run on localhost

```bash
cd admin-web
npm install
npm run dev
```

Open in **Chrome or Edge** (not only Cursor preview):

**http://127.0.0.1:5173/login**

(or http://localhost:5173/login)

**Login:** `Admin` / `852585` (change under Settings)

### Easy start (Windows)

Double-click **`start-admin.bat`** in the `admin-web` folder.  
Keep the black terminal window **open** while you use the admin panel.

### "Connection Failed"?

1. The dev server must be **running** — run `npm run dev` and leave the terminal open.
2. Use **http://127.0.0.1:5173** in Chrome/Edge if localhost fails.
3. From project root: `npm run admin` (after `npm run admin:install` once).

## Features

| Page | Features |
|------|----------|
| **Dashboard** | Today stats, pending collections, orders to accept/deliver |
| **Customers** | Add, edit, delete, activate/deactivate, reset customer app password |
| **Billing & Print** | Calculate unbilled entries, save payment, **print invoice** |
| **Entry History** | View/delete entries, billed / not billed |
| **Orders** | Accept, cancel, deliver (Cash / UPI / Billing) |
| **Settings** | Change web admin password |

## Production build

```bash
npm run build
npm run preview
```

Host the `dist` folder on any static host (Netlify, Vercel, your server).

## Notes

- Web admin password is stored in **browser localStorage** (Settings).
- Mobile seller login remains separate unless you use the same password manually.
- Allow pop-ups for **print bill** to work.
