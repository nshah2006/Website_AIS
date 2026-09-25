# Phase 1 Setup Guide for Screen Control Agent

This guide is for a Claude instance with screen control (computer_use tool) to complete the Supabase and Resend setup.

## Prerequisites
- Supabase account already created at: https://ptfhlyrcsbxfycvopvpn.supabase.co
- Resend account (will create if needed at https://resend.com)
- The Website_AIS repository is cloned at: /Users/nirmalshah/Website_AIS

---

## PART 1: Create Database Table in Supabase

### Step 1.1: Open Supabase Dashboard
- Navigate to: https://ptfhlyrcsbxfycvopvpn.supabase.co
- Wait for page to load completely
- You should see the Supabase dashboard with a left sidebar

### Step 1.2: Open SQL Editor
- Look in the LEFT SIDEBAR for "SQL Editor"
- Click on "SQL Editor"
- Wait for the SQL editor interface to load

### Step 1.3: Create New Query
- Click the blue button that says "New Query" or "+" icon
- A new query editor should open

### Step 1.4: Paste and Run SQL
- Copy the entire SQL script below:
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
- Click in the SQL editor text area
- Paste the SQL script
- Look for a blue "Run" button (usually bottom right or top right)
- Click the "Run" button
- Wait for the query to complete
- You should see a success message

### Step 1.5: Verify Table Created
- Look in the LEFT SIDEBAR under "Tables"
- You should see "contact_submissions" listed
- **Screenshot for confirmation**

---

## PART 2: Get Database Connection String

### Step 2.1: Navigate to Settings
- In the Supabase dashboard, click "Settings" in the LEFT SIDEBAR
- This opens project settings

### Step 2.2: Go to Database Section
- Look for "Database" in the settings menu (LEFT SIDEBAR)
- Click on "Database"
- You should see database configuration options

### Step 2.3: Find Connection String
- Look for a section labeled "Connection string" or "Connection strings"
- You should see multiple tabs/options including "PostgreSQL"
- Click on the "PostgreSQL" tab
- You should see a connection string that looks like:
  `postgresql://postgres.xxxxx:password@db.xxxxx.supabase.co:5432/postgres`

### Step 2.4: Get Database Password
- In the same Settings → Database section, look for "Database password"
- There should be a field showing your password (may need to reveal it)
- **Copy the full connection string BUT REPLACE `[YOUR-PASSWORD]` with the actual password shown**
- Save this as `DATABASE_URL` (will use in Step 4)
- Example final URL:
  `postgresql://postgres.xxxxx:myactualpassword123@db.xxxxx.supabase.co:5432/postgres`
- **Screenshot with connection string visible**

---

## PART 3: Set Up Resend API Key

### Step 3.1: Open Resend in New Tab
- Navigate to: https://resend.com
- Wait for page to load

### Step 3.2: Sign In or Create Account
- If you see a sign-in button, click it
- If you already have an account, sign in with your credentials
- If no account exists, click "Sign up" and complete registration
- You should be on the Resend dashboard

### Step 3.3: Navigate to API Keys
- Look in the dashboard for "API Keys" or "Settings" → "API Keys"
- Click on it
- You should see a list of API keys (or option to create one)

### Step 3.4: Copy or Create API Key
- If you see an existing API key, click "Copy" next to it
- If no key exists, click "Create API Key" button
- The key should start with `re_`
- Copy the entire key
- Save this as `RESEND_API_KEY` (will use in Step 4)
- Example: `re_abc123def456ghi789`
- **Screenshot with API key visible (can redact some characters)**

---

## PART 4: Create .env File

### Step 4.1: Open Terminal
- Open a terminal on the computer
- Navigate to: `/Users/nirmalshah/Website_AIS`
- Run command: `pwd` to verify you're in the right directory

### Step 4.2: Create .env File
- In the terminal, run this exact command:
```bash
cat > .env << 'EOF'
DATABASE_URL=PASTE_YOUR_DATABASE_URL_HERE
RESEND_API_KEY=PASTE_YOUR_RESEND_API_KEY_HERE
NOTIFY_EMAIL=utdallasais@gmail.com
EOF
```
- **REPLACE:**
  - `PASTE_YOUR_DATABASE_URL_HERE` with the DATABASE_URL from Step 2.4
  - `PASTE_YOUR_RESEND_API_KEY_HERE` with the RESEND_API_KEY from Step 3.4
- Press Enter
- Verify the file was created: run `cat .env` and confirm you see the three variables

### Step 4.3: Verify .env Contents
- Run: `cat .env`
- You should see:
```
DATABASE_URL=postgresql://postgres.xxxxx:password@...
RESEND_API_KEY=re_xxxxx
NOTIFY_EMAIL=utdallasais@gmail.com
```
- **Screenshot of verified .env file**

---

## PART 5: Test Locally

### Step 5.1: Install Python Dependencies
- In the terminal, in `/Users/nirmalshah/Website_AIS`, run:
```bash
pip install -r requirements.txt
```
- Wait for installation to complete (may take 2-3 minutes)
- You should see "Successfully installed" message at the end

### Step 5.2: Run FastAPI Backend
- In the same terminal, run:
```bash
uvicorn api.main:app --reload
```
- You should see output like:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```
- **Leave this terminal running**

### Step 5.3: Open New Terminal Tab
- Open a new terminal tab/window
- Navigate to: `/Users/nirmalshah/Website_AIS`

### Step 5.4: Run Frontend
- In the new terminal, run:
```bash
pnpm dev
```
- Wait for output showing:
```
VITE v8.x.x  ready in XXX ms
➜  Local:   http://localhost:5173/
```
- **Screenshot of both terminals running (backend + frontend)**

### Step 5.5: Test the Contact Form
- Open a web browser
- Navigate to: `http://localhost:5173`
- Wait for the page to load completely
- Look for a "Get Involved" button
- Click on one of the "Get Involved" buttons (in the hero section, navbar, or contact page)
- A form modal should appear
- Fill in the form:
  - Name: "Test User"
  - Email: "test@utdallas.edu"
  - Major: "Computer Science"
  - Message: "Testing the form"
- Click the "Get Involved" button on the form
- Wait for response (should say "Thanks for your interest!")
- **Screenshot of successful form submission**

### Step 5.6: Verify Email and Database
- Open Resend dashboard in browser: https://resend.com
- Look for "Logs" or "Emails" section
- You should see the test email listed with status "Sent"
- **Screenshot of email in Resend logs**

- Go back to Supabase: https://ptfhlyrcsbxfycvopvpn.supabase.co
- Click "Table Editor" in left sidebar
- Click on "contact_submissions" table
- You should see one row with your test submission
- **Screenshot of data in Supabase table**

---

## PART 6: Deploy to Vercel

### Step 6.1: Open Vercel Dashboard
- Navigate to: https://vercel.com/dashboard
- You should see your projects listed
- Find and click on the "Website_AIS" project

### Step 6.2: Go to Environment Variables
- Look for "Settings" or a settings icon
- Click "Settings" or "Project Settings"
- Look for "Environment Variables" in the left menu
- Click on "Environment Variables"

### Step 6.3: Add DATABASE_URL
- Click "Add New" or "+" button
- In "Name" field, type: `DATABASE_URL`
- In "Value" field, paste your full DATABASE_URL from Step 2.4
- Click "Save" or "Add"
- **Screenshot showing DATABASE_URL added**

### Step 6.4: Add RESEND_API_KEY
- Click "Add New" or "+" button again
- In "Name" field, type: `RESEND_API_KEY`
- In "Value" field, paste your RESEND_API_KEY from Step 3.4
- Click "Save" or "Add"
- **Screenshot showing RESEND_API_KEY added**

### Step 6.5: Add NOTIFY_EMAIL
- Click "Add New" or "+" button once more
- In "Name" field, type: `NOTIFY_EMAIL`
- In "Value" field, type: `utdallasais@gmail.com`
- Click "Save" or "Add"
- **Screenshot showing all three env vars saved**

### Step 6.6: Commit and Push Code
- In terminal, in `/Users/nirmalshah/Website_AIS`, run:
```bash
git add .
git commit -m "Phase 1: Complete backend setup with Supabase and Resend"
git push origin master
```
- Wait for push to complete
- You should see "✓ Deployed" notification in Vercel (takes 2-3 minutes)

### Step 6.7: Test Live Form
- In Vercel dashboard, you should see a live URL for the project
- Or navigate to the Vercel project and find the deployment URL
- Open that URL in browser
- Click "Get Involved" button
- Fill and submit the form again
- **Screenshot of successful submission on live URL**

### Step 6.8: Verify Live Email and Database
- Check Resend logs again - you should see the new email
- Check Supabase table - you should see the new row
- **Final screenshot of complete setup**

---

## Summary of Results to Collect

When complete, provide screenshots showing:
1. ✅ Supabase table "contact_submissions" created
2. ✅ DATABASE_URL connection string
3. ✅ RESEND_API_KEY from Resend
4. ✅ .env file with all three variables
5. ✅ Both terminals running (backend + frontend)
6. ✅ Local form submission successful
7. ✅ Email in Resend logs from local test
8. ✅ Data row in Supabase table from local test
9. ✅ Vercel environment variables all set
10. ✅ Live form submission successful
11. ✅ Email in Resend logs from live test
12. ✅ New data row in Supabase table from live test

---

## If Anything Fails

**Database connection error:**
- Verify DATABASE_URL has the correct password
- Check no typos in the URL
- Try connecting to Supabase in browser first to verify access

**Email not sending:**
- Verify RESEND_API_KEY is correct
- Check Resend account is active
- Look in Resend logs for error details

**Form not appearing:**
- Restart the frontend with `pnpm dev`
- Clear browser cache
- Check browser console for errors

**Vercel deployment failing:**
- Check Vercel deployment logs for error
- Verify all three env vars are set correctly
- Try pushing again: `git push origin master`

---

## Next Steps After Completion

Report back to the main Claude instance with:
1. Confirmation all steps completed
2. Screenshots from each section above
3. Any issues encountered and how they were resolved

Then the main Claude instance will integrate the contact form buttons into the UI.
