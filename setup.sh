#!/bin/bash

# AutoBook Development Setup Script

echo "🚀 AutoBook Setup Script"
echo "========================"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from template..."
    cp .env.example .env.local
    echo "✅ .env.local created - please fill in your Supabase credentials"
else
    echo "✅ .env.local already exists"
fi

# Check Node.js version
echo "🔍 Checking Node.js version..."
node --version

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env.local with your Supabase credentials"
echo "2. Run the SQL schema from database/schema.sql in Supabase"
echo "3. Run: npm run dev"
echo "4. Open http://localhost:3000"
echo ""
