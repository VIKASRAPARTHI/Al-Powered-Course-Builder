# AI Course Generator

AI Course Generator is a platform that allows users to easily create
and generate educational courses using artificial intelligence. By simply entering course details like name, duration, number of chapters, and specifying if videos are included, Gemeni AI generates the entire course structure along with relevant YouTube videos for each chapter.

## Features

- **User Registration**: Users can register and create their own accounts.

- **Course Creation**: Users can create a course by providing a course name, duration, number of chapters, and the option to include videos.
- **AI-Generated Courses**: The platform uses AI to generate a complete course structure based on user input.
- **YouTube Video Integration**: The AI automatically attaches relevant YouTube videos to each chapter of the course.
- **Image Storage**: Course-related images are stored in Firebase.
- **Frontend Design**: The frontend is built using the Shadcn UI library to provide a modern and responsive interface.

## Tech Stack

- **Next.js**

- **PostgreSQL**
- **Firebase**
- **Drizzle ORM**
- **Shadcn UI Library**

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/bhataasim1/ai-content-generator.git
   ```

2. Navigate to the project directory:

   ```bash
   cd ai-content-generator
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Set up the environment variables:
   Create a `.env` file in the root directory and add the following values:
   ```bash
    NEXT_PUBLIC_HOST_URL="http://localhost:3000"
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="Your-key"
    CLERK_SECRET_KEY="Your-key"
    NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
    NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
    NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY="Your-key"
    NEXT_PUBLIC_DRIZZLE_DATABASE_URL="Your-database-url"
    NEXT_PUBLIC_FIREBASE_API_KEY="your-key"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-auth-domain"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="project-id"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
    NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="your-measurement-id"
    NEXT_PUBLIC_YOUTUBE_API_KEY="your-youtube-api-key"
   ```
# AI Course Generator

AI Course Generator is an application built with Next.js that helps users create complete, structured courses using Google Generative AI. Users provide basic course details and the app generates course layouts and chapter content (optionally including YouTube video suggestions). The project uses Drizzle ORM with a PostgreSQL database (Neon), Clerk for auth, and Firebase for media storage.

--

**Contents**

- What this project does
- Tech stack
- Quick start (Windows / PowerShell)
- Important environment variables
- Database & migrations
- Google Generative AI setup (service account + model discovery)
- Useful scripts
- Troubleshooting
- Contributing

--

## What this project does

- Let authenticated users create AI-generated courses.
- Generate course layout and detailed chapter content using Google Generative AI.
- Attach relevant YouTube videos per chapter using the YouTube API.
- Store course metadata in Postgres (Neon) via Drizzle ORM and course images in Firebase.

## Tech stack

- Next.js (app router)
- React (server + client components)
- TypeScript
- Drizzle ORM + drizzle-kit
- Neon (Postgres serverless)
- Clerk (authentication)
- Google Generative AI (Gemini family)
- Firebase (storage)
- Tailwind CSS + Shadcn UI components

## Quick start (Windows / PowerShell)

1. Clone and install dependencies:

```powershell
git clone https://github.com/VIKASRAPARTHI/Al-Powered-Course-Builder.git
cd ai-course-generator
npm install
```

2. Create a `.env` file in the project root. See the **Environment variables** section below for recommended values.

3. Start the dev server (temporary IPv4 preference may be required if your Node resolves to IPv6 which times out):

```powershell
#$env:NODE_OPTIONS = '--dns-result-order=ipv4first'  # optional, see Troubleshooting
npm run dev
```

4. Open `http://localhost:3000` in your browser.

## Important environment variables

Create a `.env` (or `.env.local`) with the following keys. Mark the server-only secrets (like the DB URL) as server-only — do not expose them to the client.

- `NEXT_PUBLIC_HOST_URL` — e.g. `http://localhost:3000`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk publishable key (client-side)
- `CLERK_SECRET_KEY` — Clerk secret (server-side)
- `NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY` — optional API key for certain calls (project-specific)
- `DRIZZLE_DATABASE_URL` — server-only Postgres connection string (Neon). Use this on the server; do not use `NEXT_PUBLIC_` prefix for server DB URL.
- Firebase keys: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, etc.
- `NEXT_PUBLIC_YOUTUBE_API_KEY` — YouTube Data API key
- Optional: `GEN_AI_MODEL` or `GOOGLE_GEMENI_MODEL` — override the preferred model name

Example `.env` entries (replace values):

```text
NEXT_PUBLIC_HOST_URL=http://localhost:3000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxx
CLERK_SECRET_KEY=sk_xxx
NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY=AIza...   # optional
DRIZZLE_DATABASE_URL=postgresql://user:pass@host:5432/dbname
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_YOUTUBE_API_KEY=...
```

## Database & migrations

- The project uses Drizzle ORM and includes SQL in `drizzle/0000_smart_peter_parker.sql` that creates the `courseList` table.
- If `drizzle-kit push` fails due to local network restrictions, use the included helper scripts:

- `npm run db:apply-sql` — runs `drizzle/0000_smart_peter_parker.sql` against `DRIZZLE_DATABASE_URL` using `pg`.
- `npm run db:ensure-columns` — applies safe `ALTER TABLE IF NOT EXISTS` additions for missing columns.

- CI fallback: a GitHub Actions workflow `.github/workflows/db-push.yml` can run `drizzle-kit push` from CI using a repository secret `DRIZZLE_DATABASE_URL` if local network blocks access.

## Google Generative AI (Gemini) setup

This project uses the Google Generative AI (Gemini) models. Listing and using models may require a Google service account with the correct IAM roles.

1. Create a service account in Google Cloud Console for your project.
2. Grant it at least the `Vertex AI User` role (`roles/aiplatform.user`). If you plan to impersonate or create tokens, add `roles/iam.serviceAccountTokenCreator`.
3. Enable the Generative AI / Vertex AI API for the project.
4. Download the JSON key and set it locally for testing:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = 'C:\Users\you\service-account.json'
# Or set permanently (PowerShell):
setx GOOGLE_APPLICATION_CREDENTIALS "C:\Users\you\service-account.json"
```

5. Use the helper to list models (the project includes `scripts/list_models.js`):

```powershell
npm run ai:list-models
```

If `listModels` returns a model whose `supportedMethods` includes `generateContent`, use that exact model id in `GEN_AI_MODEL` or let the app fall back to a supported model.

## Scripts (high-level)

- `npm run dev` — start Next dev server
- `npm run build` — build for production
- `npm run start` — run production server
- `npm run db:apply-sql` — apply `drizzle/0000_smart_peter_parker.sql` via `pg`
- `npm run db:ensure-columns` — run alter-table script to add missing columns safely
- `npm run ai:list-models` — attempts to list available Google models using the service account

## API endpoints

- `POST /api/courses` — server-side route that returns courses for an email. The server uses Clerk when available; client components fall back to supplying an email in POST body.

## Troubleshooting

- Network timeouts (Node/undici): If server logs show `Connect Timeout` in `undici`, Node may prefer IPv6 addresses that time out. A common workaround (development) is to force Node to prefer IPv4:

```powershell
$env:NODE_OPTIONS = '--dns-result-order=ipv4first'
npm run dev
```

- Clerk fetch failures: Confirm `CLERK_SECRET_KEY` is set and the dev environment can reach Clerk's service endpoints. The server route logs clearer hints.
- DB connection timeouts: run PowerShell checks:

```powershell
Test-NetConnection api.c-2.us-east-1.aws.neon.tech -Port 443 -InformationLevel Detailed
nslookup api.c-2.us-east-1.aws.neon.tech
```

If those succeed but Node fails, try the `NODE_OPTIONS` IPv4 fix above.

- Generative AI model 404: If calls to `models/gemini-pro` return 404 or 'not found', run `npm run ai:list-models` (with `GOOGLE_APPLICATION_CREDENTIALS` set) to discover the exact model names and supported methods for your project/credentials.

## Security notes

- Never commit `service-account.json`, `.env`, or any secret keys to Git.
- Use repository secrets / CI secrets for production deployment (ex: `DRIZZLE_DATABASE_URL`, `CLERK_SECRET_KEY`).

## Contributing

Contributions are welcome. Typical workflow:

1. Fork the repo
2. Create a feature branch
3. Run tests / lint (if present)
4. Submit a PR with a clear description of changes

--

If you'd like, I can also:

- Add a short `docs/SETUP.md` that walks through creating the Google service account and granting IAM roles with screenshots/commands.
- Add a `GET /api/debug/health` endpoint that reports Clerk and DB connectivity for quick checks (no secrets returned).

If you want the README adjusted (more/less detail, different ordering), tell me which sections to expand or remove and I'll update it.
