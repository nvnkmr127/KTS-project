#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting advanced deployment process..."

# Define paths
APP_DIR=$(pwd)
PARENT_DIR=$(dirname "$APP_DIR")

# 1. Pull the latest changes from the repository
if [ -d "../.git" ]; then
    echo "=> 📥 Pulling latest changes from GitHub (parent directory)..."
    git -C .. pull origin main
elif [ -d ".git" ]; then
    echo "=> 📥 Pulling latest changes from GitHub..."
    git pull origin main
else
    echo "=> ⚠️ No .git directory found. Skipping git pull..."
fi

# 2. Install/update Composer dependencies (Optimized for Production)
# --no-dev prevents installing dev dependencies (like phpunit)
# --optimize-autoloader creates an optimized autoloader map
echo "=> 📦 Installing Composer dependencies (production mode)..."
composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev

# 3. Run database migrations safely
echo "=> 🗄️ Running database migrations..."
php artisan migrate --force

# 4. Storage Link
# Ensures the public/storage symlink exists for file uploads
echo "=> 🔗 Ensuring storage link exists..."
if [ ! -d "public/storage" ]; then
    php artisan storage:link || true
fi

# 5. Clear old caches
echo "=> 🧹 Clearing old caches..."
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan event:clear || true

# 6. Cache configuration, routes, and views for max performance
echo "=> ⚡ Optimizing application (caching config, routes, views, events)..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache || true

# 7. Restart queues
# It's critical to restart the queue after a new deployment so workers load the new code
echo "=> 🔄 Restarting queue workers (if running)..."
php artisan queue:restart || true

# 8. Check for frontend build (Optional)
# If your server has Node.js/npm installed, this will automatically build your React app
if [ -f "$PARENT_DIR/package.json" ]; then
    if command -v npm &> /dev/null; then
        echo "=> 🎨 Building frontend assets (npm found in parent dir)..."
        # Using npm install instead of ci just in case package-lock is out of sync
        npm --prefix "$PARENT_DIR" install
        npm --prefix "$PARENT_DIR" run build
    else
        echo "=> ⚠️ npm not found on this server. Skipping frontend build..."
    fi
fi

echo "=> 🎉 Deployment finished successfully!"
