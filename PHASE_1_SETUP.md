# Phase 1: Backend Setup Guide

Follow these steps to complete Phase 1 deployment.

## Step 1: Create Database Table in Supabase

1. Go to your Supabase project: https://ptfhlyrcsbxfycvopvpn.supabase.co
2. Click **SQL Editor** (left sidebar)
3. Click **"New Query"**
4. Copy and paste this SQL:

```sql
CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  major TEXT,
  message TEXT,
  source TEXT DEFAULT 'website',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contact_created_at ON contact_submissions(created_at DESC);
```

5. Click **"Run"** (blue button)
6. Confirm the table was created (you should see it in the left sidebar under Tables)

## Step 2: Get Your DATABASE_URL

1. In Supabase, go to **Settings** → **Database**
2. In the **Connection string** section, select the **"PostgreSQL"** tab
3. Copy the entire connection string
4. It should look like: `postgresql://postgres.xxx:password@db.xxx.supabase.co:5432/postgres`
5. **Replace `[YOUR-PASSWORD]` with your actual Supabase database password** (find it in Settings → Database → Database password)
6. Save this as your `DATABASE_URL`

## Step 3: Set Up Resend for Email

1. Go to https://resend.com
2. Sign up or log in
3. Navigate to **API Keys**
4. Click **"Create API Key"** or copy your existing key
5. The key starts with `re_`
6. Save this as your `RESEND_API_KEY`

## Step 4: Create Environment File

Run this command to create your `.env` file:

```bash
cd /Users/nirmalshah/Website_AIS
cat > .env << 'EOF'
DATABASE_URL=postgresql://postgres.xxx:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
RESEND_API_KEY=re_xxxxxxxxxxxxx
NOTIFY_EMAIL=utdallasais@gmail.com
EOF
```

Replace:
- `postgresql://postgres.xxx:[YOUR-PASSWORD]@...` with your actual DATABASE_URL
- `re_xxxxxxxxxxxxx` with your actual Resend API key

## Step 5: Test Locally

```bash
cd /Users/nirmalshah/Website_AIS

# Install Python dependencies
pip install -r requirements.txt

# Run the FastAPI backend
uvicorn api.main:app --reload

# In another terminal, run the frontend
pnpm dev

# Visit http://localhost:5173 and test the form
```

## Step 6: Deploy to Vercel

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add these three variables:
   - `DATABASE_URL` = your PostgreSQL connection string
   - `RESEND_API_KEY` = your Resend API key
   - `NOTIFY_EMAIL` = `utdallasais@gmail.com`
4. Push your code to master: `git push origin master`
5. Vercel auto-deploys — wait 2-3 minutes
6. Test the form on your live URL

---

## Troubleshooting

**"Cannot connect to database"**
- Verify your `DATABASE_URL` has the correct password
- Make sure Supabase IP is allowed (usually auto-allowed)

**"Email not sent"**
- Check your Resend API key is correct
- Check `NOTIFY_EMAIL` is set

**"Table doesn't exist"**
- Re-run the SQL in Supabase SQL Editor
- Verify the table appears in the Tables list

---

**Once you complete all 6 steps, let me know and I'll integrate the contact form buttons!**
