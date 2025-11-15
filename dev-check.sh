#!/usr/bin/env bash
echo "=== GradeX Project Check ==="
echo "NODE: $(node -v || echo 'node missing')"
echo "NPM: $(npm -v || echo 'npm missing')"
echo ""
echo "Installed packages:"
npm ls --depth=0 || true
echo ""
echo "Starting quick curl checks (will likely 404 until server runs):"
curl -I http://localhost:5173/ || true


