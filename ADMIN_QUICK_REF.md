# Supabase Admin - Quick Reference

## 🚀 Quick Setup

```bash
# Run setup script
./setup-admin-access.sh

# Or manually set:
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

## 📋 Common Commands

### View Stats
```bash
node supabase-admin.js stats
```

### Find Student
```bash
node supabase-admin.js find RA2311003012124
```

### Add Student
```bash
node supabase-admin.js add RA2411003010001 "John Doe"
```

### Update Student
```bash
node supabase-admin.js update RA2311003012124 "New Name"
```

### Delete Student
```bash
node supabase-admin.js delete RA2311003012124
```

### List Students
```bash
node supabase-admin.js list 20
```

### Upload Data
```bash
node supabase-admin.js upload public/seat-data.json
```

### Export Data
```bash
node supabase-admin.js export backup.json
```

## 🔑 Get Service Role Key

1. Go to: https://supabase.com/dashboard/project/phlggcheaajkupppozho/settings/api
2. Find "service_role" key
3. Copy it
4. Run: `./setup-admin-access.sh`

## ⚠️ Security

- **Never commit** service role key to Git
- **Never expose** it in frontend code
- **Only use** for admin scripts and server-side operations

## ✅ Full Access Features

With service role key, you can:
- ✅ Bypass Row Level Security
- ✅ Create/Update/Delete any record
- ✅ Bulk operations
- ✅ Data migration
- ✅ Backups and exports

