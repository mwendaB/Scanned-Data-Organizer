#!/bin/bash

# Scanned Data Organizer Setup Script
echo "🔧 Setting up Scanned Data Organizer..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18.17 or later."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="18.17.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 18.17 or later."
    exit 1
fi

echo "✅ Node.js version $NODE_VERSION detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  Creating .env.local from template..."
    cp .env.example .env.local
    echo "📝 Please edit .env.local with your Supabase credentials"
else
    echo "✅ .env.local already exists"
fi

# Run type check
echo "🔍 Running type check..."
npm run type-check

if [ $? -ne 0 ]; then
    echo "⚠️  Type check found some issues, but setup can continue"
else
    echo "✅ Type check passed"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your Supabase credentials"
echo "2. Run the database migration in your Supabase SQL editor"
echo "3. Start the development server with: npm run dev"
echo ""
echo "📖 See SETUP.md for detailed instructions"
