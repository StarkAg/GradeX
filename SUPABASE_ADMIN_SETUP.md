# Supabase Admin Access Setup

## 🔑 Get Your Service Role Key

To enable full admin access, you need the **Service Role Key**:

1. Go to: **https://supabase.com/dashboard/project/phlggcheaajkupppozho/settings/api**

2. Scroll down to **"Project API keys"**

3. Find **"service_role"** key (⚠️ **Secret** - keep it safe!)

4. Copy the key (starts with `eyJ...`)

## ⚙️ Set Environment Variable

### Option 1: Temporary (Current Session)
```bash
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
```

### Option 2: Permanent (Add to ~/.zshrc or ~/.bashrc)
```bash
echo 'export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"' >> ~/.zshrc
source ~/.zshrc
```

### Option 3: For Vercel (Production)
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add: `SUPABASE_SERVICE_ROLE_KEY` = (your service role key)
3. Redeploy

## 🚀 Using the Admin Tool

Once the service role key is set, you can use:

```bash
# Show database stats
node supabase-admin.js stats

# Find a student
node supabase-admin.js find RA2311003012124

# Add a student
node supabase-admin.js add RA2411003010001 "John Doe"

# Update a student
node supabase-admin.js update RA2311003012124 "New Name"

# Delete a student
node supabase-admin.js delete RA2311003012124

# List students
node supabase-admin.js list 20

# Upload from JSON
node supabase-admin.js upload public/seat-data.json

# Export to JSON
node supabase-admin.js export backup.json
```

## ⚠️ Security Note

**Service Role Key** has **FULL ACCESS** - it bypasses Row Level Security!

- ✅ Use for: Admin scripts, data migration, backups
- ❌ Don't use for: Frontend code, client-side apps
- 🔒 Keep it secret: Never commit to Git, never expose publicly

## ✅ What You Can Do With Full Access

- ✅ Create/Read/Update/Delete any record
- ✅ Bypass RLS policies
- ✅ Manage database schema
- ✅ Bulk operations
- ✅ Data migration
- ✅ Backups and exports

## 🎯 Quick Start

1. Get service role key from Supabase dashboard
2. Set environment variable: `export SUPABASE_SERVICE_ROLE_KEY="..."`
3. Test: `node supabase-admin.js stats`
4. You're ready! 🎉

