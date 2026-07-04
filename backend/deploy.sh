#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "Starting deployment process..."



# 2. Pull the latest changes from the repository
if [ -d "../.git" ]; then
    echo "=> Pulling latest changes from GitHub (parent directory)..."
    git -C .. pull origin main
elif [ -d ".git" ]; then
    echo "=> Pulling latest changes from GitHub..."
    git pull origin main
else
    echo "=> Warning: No .git directory found. Skipping git pull..."
fi

# 3. Install/update Composer dependencies
echo "=> Installing Composer dependencies..."
composer install --no-interaction --prefer-dist --optimize-autoloader

# 4. Run database migrations
echo "=> Running database migrations..."
php artisan migrate --force

# 5. Clear caches
echo "=> Clearing caches..."
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# 6. Cache configuration, routes, and views for performance
echo "=> Optimizing application..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 7. Restart queues (if applicable)
# echo "=> Restarting queue workers..."
# php artisan queue:restart



echo "Deployment finished successfully!"
