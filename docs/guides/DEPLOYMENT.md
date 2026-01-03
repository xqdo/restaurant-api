# Deployment Guide

## Overview

Guide for deploying the restaurant sales management system to production.

---

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing
- [ ] Test coverage >80%
- [ ] No linting errors
- [ ] Code reviewed

### Configuration
- [ ] Environment variables configured
- [ ] JWT secret is strong and unique
- [ ] Database connection string correct
- [ ] CORS configured for production domain

### Database
- [ ] Migrations applied to production database
- [ ] Database backups configured
- [ ] Connection pooling configured

### Security
- [ ] SSL/TLS certificates installed
- [ ] Rate limiting configured
- [ ] Input validation on all endpoints
- [ ] Authentication working
- [ ] Role-based access control tested

---

## Environment Variables

### Production .env
```bash
# Database
DATABASE_URL="postgresql://user:password@prod-host:5432/restaurant_prod"

# Authentication
JWT_SECRET="strong-random-secret-key-change-this"
JWT_EXPIRATION="1h"

# Application
NODE_ENV="production"
PORT=3000

# Monitoring (optional)
SENTRY_DSN="your-sentry-dsn"
```

---

## Deployment Options

### Option 1: Docker

**Dockerfile:**
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/restaurant
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - db

  db:
    image: postgres:14
    environment:
      - POSTGRES_DB=restaurant
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Option 2: Platform as a Service (Heroku, Railway, etc.)

```bash
# Install Heroku CLI
heroku create restaurant-api

# Set environment variables
heroku config:set DATABASE_URL=...
heroku config:set JWT_SECRET=...

# Deploy
git push heroku main

# Run migrations
heroku run npx prisma migrate deploy
```

### Option 3: VPS (Ubuntu)

```bash
# 1. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# 3. Clone repository
git clone <repo-url>
cd restaurant-api

# 4. Install dependencies
npm ci --only=production

# 5. Build
npm run build

# 6. Run migrations
npx prisma migrate deploy

# 7. Start with PM2
npm install -g pm2
pm2 start dist/main.js --name restaurant-api

# 8. Configure Nginx reverse proxy
sudo apt-get install nginx
```

---

## Database Migration

```bash
# Production migration
npx prisma migrate deploy

# Rollback (if needed)
npx prisma migrate resolve --rolled-back <migration-name>
```

---

## Monitoring

### Health Check Endpoint
```typescript
@Get('health')
healthCheck() {
  return {
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
  };
}
```

### Logging
```bash
# Use structured logging
npm install winston

# Configure in main.ts
app.useLogger(app.get(WinstonLogger));
```

### Error Tracking
```bash
# Sentry integration
npm install @sentry/node

// In main.ts
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

---

## Scaling

### Horizontal Scaling
- Deploy multiple instances behind load balancer
- Use Redis for session storage
- Database connection pooling (PgBouncer)

### Vertical Scaling
- Increase server resources (CPU, RAM)
- Optimize database queries
- Add database indexes

---

## Backup & Recovery

### Database Backups
```bash
# Daily backup script
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Upload to S3
aws s3 cp backup_*.sql s3://backups/
```

### Disaster Recovery Plan
1. Database backup every 24 hours
2. Application logs retention: 30 days
3. Transaction logs: 90 days
4. Recovery time objective: 4 hours

---

## Security Checklist

- [ ] HTTPS enabled
- [ ] Rate limiting configured
- [ ] SQL injection prevention (Prisma parameterized queries)
- [ ] XSS prevention (input validation)
- [ ] CSRF protection
- [ ] Helmet.js middleware installed
- [ ] Secrets not in code (use environment variables)
- [ ] Database credentials rotated regularly

---

**Last Updated:** 2025-12-28
