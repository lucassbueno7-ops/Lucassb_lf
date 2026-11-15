# Trainer App

Personal trainer platform split into two separately deployable apps: a **client PWA** (`apps/app`) and a **trainer panel** (`apps/panel`), sharing code through `packages/shared`. UI copy is in Spanish.

Stack: React + Vite + TypeScript, Tailwind v4, react-router, Supabase (Auth, Postgres + RLS, Edge Functions), recharts, vite-plugin-pwa (client app only), Vitest. Managed as an npm workspaces monorepo.

## Structure

```
apps/
  app/       client PWA: Hoy, Semana, Rutina, Progreso, Mi peso, workout day, login, /set-password
  panel/     trainer panel: clients, client detail, exercise catalog, routine editor, login (plain SPA)
packages/
  shared/    @trainer/shared, consumed as TS source (no build step)
             domain/ (pure logic + tests), lib/ (supabase client), auth/, ui/, charts/, data-api.ts
supabase/    migrations, edge function, seed
scripts/     generate-icons.mjs (PNG icons for apps/app)
```

Role guarding: the panel admits `role = trainer` and `role = admin` (clients see a notice pointing to the app, with sign-out). The app admits every role: clients use it, trainers/admins get a chooser (Panel / App) after login and a read-only client preview. Set `VITE_APP_URL` (in the panel) and `VITE_PANEL_URL` (in the app) to the deployed URLs so switching apps works in production (local dev falls back to `http://localhost:5173` / `http://localhost:5174`). Switching hands the session over in the URL fragment (`#access_token=...&refresh_token=...`), which the receiving app consumes and strips immediately.

## Local development

```bash
npm install            # from the repo root, installs every workspace
cp .env.example .env   # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev:app        # client app   -> http://localhost:5173
npm run dev:panel      # trainer panel -> http://localhost:5174
```

A single `.env` at the repo root serves both apps (each Vite config sets `envDir` to the root).

Scripts (from the root): `npm run build` (both apps), `npm test` (all workspaces), `npm run lint`, `npm run icons` (regenerates PNG icons from `apps/app/public/icon.svg`).

## Supabase setup

1. **Create a project** at supabase.com. Copy the project URL and anon key into `.env`.
2. **Run the migration**: paste `supabase/migrations/0001_init.sql` into the SQL editor, or run `supabase link --project-ref <ref>` then `supabase db push`.
3. **Deploy the edge function**:
   ```bash
   supabase functions deploy invite-client
   supabase secrets set SITE_URL=https://your-client-app-domain.com   # the CLIENT app URL
   ```
   `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically. The service role key never reaches the frontend.
4. **Auth -> URL Configuration**: set *Site URL* to the deployed **client app** URL and add `https://your-app-domain.com/set-password` (and `http://localhost:5173/set-password` for dev) to *Redirect URLs*. Also add the panel URL (and `http://localhost:5174` for dev) to *Redirect URLs*.
5. **Use custom SMTP** (Auth -> SMTP Settings, e.g. Resend). The default Supabase SMTP is heavily rate-limited and only sends to team members, so invites will fail in practice. Optionally customize the *Invite user* email template (Spanish copy).
6. **Create the first trainer**: sign up a user (Auth -> Users -> Add user, with password), then promote it in the SQL editor:
   ```sql
   update profiles set role = 'trainer'
   where id = (select id from auth.users where email = 'trainer@example.com');
   ```
   The trigger creates every profile as `client`; `role` and `trainer_id` cannot be changed from the app (only via SQL editor / service role).
7. Optional: `supabase/seed.sql` inserts common exercises for a trainer (edit the email first).

## Roles

- `client`: uses the client app. Reads/writes only their own data.
- `trainer`: uses the panel. Only their own clients and their own exercises.
- `admin`: uses the panel. Full read/write on every table and the `exercise-images` bucket (all trainers' clients, profiles, exercises, routines, logs). Intended for the developer to inspect real data. Admins cannot send invites (the `invite-client` function stays trainer-only). Admins can change a profile's `trainer_id`, but nobody can change `role` or `id` from the app.

### Role vs. `trainer_id`

Two independent axes:

- `role` = what you **administer** (`client`, `trainer`, `admin`).
- `trainer_id` = whether you **have your own routine**. A profile is a *trainee* when `trainer_id is not null`, whatever its role.

So a trainer can train too (`trainer_id` = their own id) and an admin can be trained by a trainer. Trainees appear in the panel's client list (the viewer's own row is labelled "Vos"; admins see every trainee plus every `client`). In the client app, trainee staff choose between **Mi rutina** (fully writable, their own data) and a read-only **Vista previa** of another client, and can toggle from the header; staff without a `trainer_id` only get the preview. RLS already supports this (`is_trainer_of()` is true for a trainer's own row when `trainer_id` = their id). To make a staff member a trainee:

```sql
update profiles set trainer_id = '<trainer id>' where id = '<staff profile id>';
```

Apply `supabase/migrations/0002_admin.sql` (SQL editor or `supabase db push`), then promote a user:

```sql
update profiles set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

## Deploy the frontend (Vercel)

Create **two Vercel projects from the same repository**:

| Project | Root Directory | Build command | Output directory |
| --- | --- | --- | --- |
| client app | `apps/app` | `npm run build` | `dist` |
| trainer panel | `apps/panel` | `npm run build` | `dist` |

- Keep Vercel's "Include source files outside of the Root Directory" enabled (default) so `packages/shared` and the root `package-lock.json` are available. Vercel runs `npm install` at the workspace root automatically.
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in **each** project's environment variables.
- SPA fallbacks: each app has its own `vercel.json`; `apps/app/public/_redirects` covers Netlify.
- Supabase Auth **Site URL**, the `/set-password` redirect URL and the edge function `SITE_URL` secret must point to the **client app** URL, because `/set-password` (invite flow) lives there. Add the panel URL to *Redirect URLs* too.

## Installing the PWA

The PWA is the client app (`apps/app`) only.

- **Android (Chrome)**: open the app, menu (three dots) -> *Instalar aplicacion* / *Agregar a la pantalla principal*.
- **iOS (Safari)**: open the app in Safari, tap *Compartir* -> *Agregar a pantalla de inicio*.

## Security notes

- RLS is enabled on every table. Admins (`is_admin()`) get a separate `*_admin_all` policy per table. Trainers access only clients whose `profiles.trainer_id` is their id (`is_trainer_of()`, SECURITY DEFINER, avoids recursive policies).
- Clients can read and insert their own workout logs and body metrics; workout logs have no client update/delete policy (append-only history).
- Invites go through the `invite-client` edge function, which verifies the caller is a trainer.
