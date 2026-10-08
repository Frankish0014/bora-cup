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
```

`NEXT_PUBLIC_APP_URL` is the origin encoded in QR codes. Use the production URL when you deploy.

Optional seed credentials, used only by `npm run seed`:

```env
ADMIN_EMAIL=
ADMIN_PASSWORD=
```

## Supabase setup

1. Create a Supabase project.
2. Open the SQL editor and run `supabase/migrations/20260926120000_init.sql`.
3. Copy the project URL, anon key, and service role key into `.env.local`.
4. For an empty local database only, load sample lots with either:
   - `ALLOW_SAMPLE_SEED=true npm run seed`, or
   - the SQL editor and `supabase/seed.sql` (generate it with `npm run seed:sql` if you change the sample catalog).

Do not run the seed against the live cupping database. The live lots reuse the same row IDs, so a seed would overwrite real names and stations.

To create an administrator without the seed script:

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
2. Add the same environment variables. Set `NEXT_PUBLIC_APP_URL` to the production origin, including `https://`.
3. Run the migration and seed in the production Supabase project.
4. Create an administrator with a real password.

The service role key stays in server environment variables. Do not prefix it with `NEXT_PUBLIC_`.

## Production notes

- Deactivate a session to close its QR code without deleting feedback.
- Deleting a coffee or session that already has evaluations deactivates it instead, so the history stays intact.
- Comments are stored and shown as written.
- Analytics describe averages and score counts. They do not declare a winner.
- Evaluation results and participant details are not public.
- The email address identifies a participant. The app does not send email.
- Answers are saved on each **Save & next**, and unsaved answers for the current phone are kept in `localStorage` until the save succeeds.

## Project map

- `app/session` — participant cupping
- `app/admin` — administration
- `app/api/qr` and `app/api/export` — QR images and CSV export
- `lib/actions` — validated server writes
- `supabase/migrations` — schema and Row Level Security
- `database/demo-data.ts` — sample catalog for empty local databases
