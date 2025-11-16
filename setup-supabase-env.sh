#!/bin/bash
# Quick setup script for Supabase environment variables

# Set your Supabase project URL here (get it from Supabase dashboard: Settings → API)
# Example: https://xxxxx.supabase.co
export SUPABASE_URL=""

# Set your Supabase access token (you provided this)
export SUPABASE_ACCESS_TOKEN="sbp_23274a2e6a6b44f4baa975d08154c7a0e706e5cc"

echo "✓ Environment variables set!"
echo ""
echo "To make these permanent, add them to your ~/.zshrc or ~/.bashrc:"
echo "  export SUPABASE_URL=\"your-project-url\""
echo "  export SUPABASE_ACCESS_TOKEN=\"sbp_23274a2e6a6b44f4baa975d08154c7a0e706e5cc\""
echo ""
echo "Or create a .env.local file in the project root:"
echo "  SUPABASE_URL=your-project-url"
echo "  SUPABASE_ACCESS_TOKEN=sbp_23274a2e6a6b44f4baa975d08154c7a0e706e5cc"

