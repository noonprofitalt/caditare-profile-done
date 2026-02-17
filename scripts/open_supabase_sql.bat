@echo off
echo ===================================================
echo      OPENING SUPABASE SQL EDITOR...
echo ===================================================
echo.
echo 1. The SQL code to fix the database has been COPIED to your CLIPBOARD.
echo.
echo 2. The Supabase SQL Editor will open in your browser.
echo.
echo 3. PASTE (Ctrl+V) the code into the editor.
echo.
echo 4. Click "Run".
echo.
echo ===================================================
echo Press any key to continue...
pause

:: Copy SQL to clipboard
type "..\server\fix_rls.sql" | clip

:: Open Browser
start https://supabase.com/dashboard/project/tvupusehfmbsdxhpbung/sql/new

echo.
echo Done! Please paste and run the SQL in the browser.
pause
