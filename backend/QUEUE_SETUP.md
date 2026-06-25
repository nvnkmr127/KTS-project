## Queue Worker Setup

The webhook delivery system requires a queue worker to be running.

### Start the worker (development)

```bash
php artisan queue:work --queue=webhooks,default
```

### Run as supervisor (production)

Configure supervisor to run the queue worker. Create a configuration file (e.g. `/etc/supervisor/conf.d/laravel-worker.conf`):

```ini
[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /path/to/your/project/artisan queue:work --queue=webhooks,default --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=forge
numprocs=2
redirect_stderr=true
stdout_logfile=/path/to/your/project/storage/logs/worker.log
stopwaitsecs=3600
```

### Run migrations for queue tables

Before running the worker with the database driver, make sure you have run the migrations to create the required queue/jobs tables:

```bash
php artisan migrate
```
