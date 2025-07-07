
#!/bin/bash

echo "Setting up database..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    echo "Please set your DATABASE_URL in the Secrets tab"
    exit 1
fi

echo "✅ DATABASE_URL is set"

# Generate migrations
echo "📄 Generating database migrations..."
npx drizzle-kit generate

# Run migrations
echo "🚀 Running database migrations..."
npx drizzle-kit migrate

echo "✅ Database setup complete!"
echo "🎉 Your database tables are now ready"
