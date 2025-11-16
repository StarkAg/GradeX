#!/bin/bash
# Quick setup for Supabase admin access

echo "🔧 Supabase Admin Access Setup"
echo "=============================="
echo ""

# Check if service role key is already set
if [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "✅ SUPABASE_SERVICE_ROLE_KEY is already set"
    echo ""
    echo "Testing connection..."
    node -e "
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
        'https://phlggcheaajkupppozho.supabase.co',
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    supabase.from('students').select('*', { count: 'exact', head: true }).then(({ count, error }) => {
        if (error) {
            console.log('❌ Error:', error.message);
            process.exit(1);
        }
        console.log('✅ Connection successful!');
        console.log('📊 Total records:', count);
        process.exit(0);
    });
    " && echo "" && echo "✅ Admin access is working!" || echo "❌ Connection failed"
    exit 0
fi

echo "📋 To enable admin access, you need the Service Role Key:"
echo ""
echo "1. Go to: https://supabase.com/dashboard/project/phlggcheaajkupppozho/settings/api"
echo "2. Find 'service_role' key (under Project API keys)"
echo "3. Copy the key"
echo ""
read -p "Paste your Service Role Key here: " SERVICE_KEY

if [ -z "$SERVICE_KEY" ]; then
    echo "❌ No key provided. Exiting."
    exit 1
fi

echo ""
echo "Setting environment variable..."

# Add to current session
export SUPABASE_SERVICE_ROLE_KEY="$SERVICE_KEY"

# Add to shell config
SHELL_CONFIG=""
if [ -f "$HOME/.zshrc" ]; then
    SHELL_CONFIG="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then
    SHELL_CONFIG="$HOME/.bashrc"
fi

if [ -n "$SHELL_CONFIG" ]; then
    # Remove old entry if exists
    sed -i.bak '/SUPABASE_SERVICE_ROLE_KEY/d' "$SHELL_CONFIG"
    # Add new entry
    echo "" >> "$SHELL_CONFIG"
    echo "# Supabase Service Role Key (Admin Access)" >> "$SHELL_CONFIG"
    echo "export SUPABASE_SERVICE_ROLE_KEY=\"$SERVICE_KEY\"" >> "$SHELL_CONFIG"
    echo "✅ Added to $SHELL_CONFIG"
else
    echo "⚠️  Could not find .zshrc or .bashrc"
    echo "   Please add manually: export SUPABASE_SERVICE_ROLE_KEY=\"$SERVICE_KEY\""
fi

echo ""
echo "Testing connection..."
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
    'https://phlggcheaajkupppozho.supabase.co',
    '$SERVICE_KEY'
);
supabase.from('students').select('*', { count: 'exact', head: true }).then(({ count, error }) => {
    if (error) {
        console.log('❌ Error:', error.message);
        process.exit(1);
    }
    console.log('✅ Connection successful!');
    console.log('📊 Total records:', count);
    process.exit(0);
});
"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Setup complete! Admin access is now enabled."
    echo ""
    echo "Try it:"
    echo "  node supabase-admin.js stats"
    echo "  node supabase-admin.js find RA2311003012124"
else
    echo ""
    echo "❌ Setup failed. Please check your service role key."
fi

