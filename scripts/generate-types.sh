#!/bin/bash

# Script to generate TypeScript types from Supabase schema
# This keeps your TypeScript types in sync with your database

echo "🔄 Generating TypeScript types from Supabase schema..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Check if we have the required environment variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "⚠️  Loading environment variables from .env.local..."
    source .env.local
fi

# Generate types
if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "📊 Connecting to Supabase project..."
    
    # Extract project ID from URL
    PROJECT_ID=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed -E 's/https:\/\/([^.]+).*/\1/')
    
    echo "Project ID: $PROJECT_ID"
    echo "Generating types..."
    
    supabase gen types typescript --project-id "$PROJECT_ID" > types/database.types.ts
    
    echo "✅ Types generated successfully!"
    echo "📁 File: types/database.types.ts"
else
    echo "❌ Could not find Supabase URL"
    echo "Please set NEXT_PUBLIC_SUPABASE_URL in .env.local"
    exit 1
fi

