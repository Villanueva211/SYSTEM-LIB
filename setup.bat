@echo off
REM AutoBook Development Setup Script for Windows

echo 🚀 AutoBook Setup Script
echo ========================

REM Check if .env.local exists
if not exist .env.local (
    echo 📝 Creating .env.local from template...
    copy .env.example .env.local
    echo ✅ .env.local created - please fill in your Supabase credentials
) else (
    echo ✅ .env.local already exists
)

REM Check Node.js version
echo 🔍 Checking Node.js version...
node --version

REM Check if node_modules exists
if not exist node_modules (
    echo 📦 Installing dependencies...
    call npm install
) else (
    echo ✅ Dependencies already installed
)

echo.
echo ✅ Setup complete!
echo.
echo 📋 Next steps:
echo 1. Update .env.local with your Supabase credentials
echo 2. Run the SQL schema from database/schema.sql in Supabase
echo 3. Run: npm run dev
echo 4. Open http://localhost:3000
echo.
pause
