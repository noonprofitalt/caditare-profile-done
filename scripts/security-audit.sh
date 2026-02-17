#!/bin/bash

echo "Starting Security Audit..."

# 1. Dependency Vulnerability Scan
echo "-----------------------------------"
echo "Scanning Dependencies for Vulnerabilities..."
npm audit --audit-level=high

# 2. Secret Scanning (Basic)
echo "-----------------------------------"
echo "Checking for potential secrets in codebase..."
# Exclude common noise and check for typical key patterns
grep -rnE "(password|aws_key|secret_key|api_key|token).{0,20}[0-9a-zA-Z]{32,}" . --exclude-dir={node_modules,dist,.git}

# 3. Environment Variable Leakage
echo "-----------------------------------"
echo "Checking for accidentally committed .env files..."
if [ -f .env ] || [ -f .env.local ]; then
    echo "WARNING: .env files found in project root. Ensure they are gitignored."
else
    echo "No visible .env files in root."
fi

echo "-----------------------------------"
echo "Security Audit Complete."
