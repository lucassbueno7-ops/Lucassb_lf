# Trainer App

PWA for a personal trainer and their clients. Trainers manage clients, exercise catalog and routines; clients log workouts, see progression and track body weight. UI copy is in Spanish.

Stack: React + Vite + TypeScript, Tailwind v4, react-router, Supabase (Auth, Postgres + RLS, Edge Functions), recharts, vite-plugin-pwa, Vitest.

## Local development

```bash
npm install
cp .env.example .env   # fill in your Supabase URL and anon key
npm run dev
```

Scripts: `npm run build`, `npm test`, `npm run lint`, `npm run icons` (regenerates PNG icons from `public/icon.svg`).

## Supabase setup

1. **Create a project** at supabase.com. Copy the project URL and anon key into `.env`.
2. **Run the migration**: paste `supabase/migrations/0001_init.sql` into the SQL editor, or run `supabase link --project-ref <ref>` then `supabase db push`.
3. **Deploy the edge function**:
   ```bash
   supabase functions deploy invite-client
   supabase secrets set SITE_URL=https://your-app-domain.com
   ```
   `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically. The service role key never reaches the frontend.
4. **Auth -> URL Configuration**: set *Site URL* to your deployed URL and add `https://your-app-domain.com/set-password` (and `http://localhost:5173/set-password` for dev) to *Redirect URLs*.
5. **Use custom SMTP** (Auth -> SMTP Settings, e.g. Resend). The default Supabase SMTP is heavily rate-limited and only sends to team members, so invites will fail in practice. Optionally customize the *Invite user* email template (Spanish copy).
6. **Create the first trainer**: sign up a user (Auth -> Users -> Add user, with password), then promote it in the SQL editor:
   ```sql
   update profiles set role = 'trainer'
   where id = (select id from auth.users where email = 'trainer@example.com');
   ```
   The trigger creates every profile as `client`; `role` and `trainer_id` cannot be changed from the app (only via SQL editor / service role).
7. Optional: `supabase/seed.sql` inserts common exercises for a trainer (edit the email first).

## Deploy the frontend

Vercel or Netlify, build command `npm run build`, output `dist`. SPA fallbacks are included: `vercel.json` and `public/_redirects`. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the host's environment variables.

## Installing the PWA

- **Android (Chrome)**: open the app, menu (three dots) -> *Instalar aplicacion* / *Agregar a la pantalla principal*.
- **iOS (Safari)**: open the app in Safari, tap *Compartir* -> *Agregar a pantalla de inicio*.

## Structure

```
src/
  domain/      pure, unit-tested logic (progression, BMI, sorting, dates)
  features/    auth, trainer, client (pages + per-feature api.ts)
  shared/      UI atoms, layout, RequireRole guard, shared presentational components
  lib/         supabase client
supabase/      migrations, edge function, seed
```

## Security notes

- RLS is enabled on every table. Trainers access only clients whose `profiles.trainer_id` is their id (`is_trainer_of()`, SECURITY DEFINER, avoids recursive policies).
- Clients can read and insert their own workout logs and body metrics; workout logs have no client update/delete policy (append-only history).
- Invites go through the `invite-client` edge function, which verifies the caller is a trainer.
