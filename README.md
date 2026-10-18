# Best of Rwanda Digital Cupping Platform

A mobile-first cupping sheet for the Best of Rwanda Cup Tour. A participant scans a session QR code, enters their name, and rates each coffee one at a time. Administrators manage the lineup, read the feedback, and export it.

The participant path is intentionally small:

**Scan QR code → Enter basic information → Start cupping → See the coffee → Rate it → Comment → Next coffee → Submit**

Participants do not create accounts. Administrators sign in with Supabase Auth.

## Technology

- Next.js (App Router) and TypeScript
- Tailwind CSS
- Supabase Postgres, with Row Level Security
- Zod and React Hook Form
- QR codes generated on the server

## Rating scale

Every score in the participant interface uses this scale:

| Score | Label |
| ---: | --- |
| 1 | OK |
| 2 | Good |
| 3 | Very Good |
| 4 | Excellent |
| 5 | Take My Money |

## How the data is protected

Participant writes go through Next.js server actions. Those actions use the Supabase service role key, which never ships to the browser. A random resume token is stored in an httpOnly cookie so a participant can continue their own sheet without an account.

Row Level Security is enabled on every table. The public anon key can read active events, sessions, and coffee lots. It cannot read or write participants, cupping runs, or evaluations. Admin pages check the signed-in user against `admin_profiles` in middleware (`proxy.ts`) and again on the server.

There is one evaluation per participant run per coffee. Saving again updates that row.

## Installation

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
RESEND_API_KEY=
EMAIL_FROM="Bora Cup <hello@your-domain.com>"
```

`RESEND_API_KEY` and `EMAIL_FROM` are optional. When both are set, cuppers receive a welcome email when they join a session and a thank-you after they submit. Cupping still works if they are missing.

`NEXT_PUBLIC_APP_URL` is the origin encoded in QR codes. Use the production URL when you deploy.

## Resend (welcome and thank-you emails)

You need a domain you control. Resend will not deliver to cuppers from an unverified Gmail or Yahoo address. The welcome and thank-you copy already lives in the app; you do not build templates or webhooks in Resend.

### 1. Create an API key

1. Open [https://resend.com/api-keys](https://resend.com/api-keys).
2. **Create API Key**.
3. Name it `bora-cup`.
4. Permission: **Sending access** is enough.
5. Copy the key once. It starts with `re_`. Resend will not show it again.

### 2. Verify your sending domain

This is required so cuppers (not only you) can receive mail.

1. Open [https://resend.com/domains](https://resend.com/domains).
2. **Add Domain**. Enter the domain, for example `cupping.your-org.rw` (no `https://`). A subdomain is the usual choice.
3. Resend shows DNS records (SPF, DKIM, and often MX).
4. In your DNS host, add those records exactly. If you use Cloudflare, keep CNAME records DNS-only (grey cloud), not proxied.
5. Wait until the domain status is **Verified**. This is often minutes; it can take longer.

Use a From address on that domain, such as `hello@cupping.your-org.rw`. You do not have to create that mailbox in Resend.

**Local testing only:** if the domain is not verified yet, use `EMAIL_FROM="Bora Cup <onboarding@resend.dev>"`. Resend will deliver **only to the email on your Resend account**. It will not reach cuppers at the table.

### 3. Local environment

In `.env.local`:

```env
RESEND_API_KEY=re_xxxxxxxx
EMAIL_FROM="Bora Cup <hello@cupping.your-org.rw>"
```

Keep the quotes around `EMAIL_FROM`. Restart `npm run dev` after saving.

Open **Admin → Settings**. **Cupping email** should read: `Welcome and thank-you emails are on`.

### 4. Send a test

1. Open a session, for example [http://localhost:3000/session/fully-washed](http://localhost:3000/session/fully-washed).
2. Start cupping with **your** email first.
3. You should get **Welcome to Fully Washed**.
4. Rate every cup, tap **Save and submit**.
5. You should get **Thank you for cupping Fully Washed**.

If nothing arrives, check [https://resend.com/emails](https://resend.com/emails). Failed usually means the domain is not verified or `EMAIL_FROM` is not on that domain.

### 5. Production (Vercel)

1. Vercel project → **Settings → Environment Variables**.
2. Add `RESEND_API_KEY` and `EMAIL_FROM` (same values, or a production-only key).
3. Apply to **Production**. Do not prefix them with `NEXT_PUBLIC_`.
4. Redeploy. Saving env vars does not restart an old deployment.

## Supabase setup

1. Create a Supabase project.
2. Open the SQL editor and run `supabase/migrations/20260926120000_init.sql`.
3. Copy the project URL, anon key, and service role key into `.env.local`.
4. Add events, sessions, and coffee lots in Admin. There is no sample catalog in this repository.

Do not insert sample lots, fake participants, or fake evaluations into the live cupping database.

To create an administrator:

1. In Supabase Authentication, add a user and confirm the email.
2. Run:

```sql
insert into public.admin_profiles (user_id)
select id from auth.users where email = 'you@example.com';
```

## Local development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The home page lists active sessions. At the event, people should enter through a QR code instead.

Useful routes:

- `/session/fully-washed`
- `/session/special-process`
- `/admin/login`

```bash
npm test
npm run lint
npm run build
```

The database integration test runs only when the Supabase environment variables are present. The other tests cover validation, the rating scale, navigation rules, CSV export, analytics math, and the security constraints in the migration.

## QR codes

In **Admin → QR Codes**, each session has a link, a scannable image, and a PNG download. The code points at `/session/[slug]`. Printing works best from the downloaded 1024px PNG.

Changing a session slug changes its URL. Reprint the code after a slug change.

## Deployment

Deploy on Vercel.

1. Import the repository.
2. Add the same environment variables, including `RESEND_API_KEY` and `EMAIL_FROM` if you want cupping emails. Set `NEXT_PUBLIC_APP_URL` to the production origin, including `https://`.
3. Run the migration in the production Supabase project if it is not already applied.
4. Create an administrator with a real password. Keep the live lots and cupper scores as they are.

The service role key stays in server environment variables. Do not prefix it with `NEXT_PUBLIC_`.

## Production notes

- Deactivate a session to close its QR code without deleting feedback.
- Deleting a coffee or session that already has evaluations deactivates it instead, so the history stays intact.
- Comments are stored and shown as written.
- Analytics describe averages and score counts. They do not declare a winner.
- Evaluation results and participant details are not public.
- The email address identifies a participant. Welcome and thank-you emails send only when Resend is configured.
- Averages, analytics, and dashboard totals use submitted sheets only. In-progress notes stay on file and are labeled, but they do not change the figures.
- Answers are saved on each **Save & next**, and unsaved answers for the current phone are kept in `localStorage` until the save succeeds.

## Project map

- `app/session` — participant cupping
- `app/admin` — administration
- `app/api/qr` and `app/api/export` — QR images and CSV export
- `lib/actions` — validated server writes
- `supabase/migrations` — schema and Row Level Security
