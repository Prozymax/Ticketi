# Database Sync Configuration Guide

## The Problem
Your database was force syncing on every restart because the `syncDatabase` method was using `force: true`, which **drops all existing tables and data** and recreates them from scratch.

## The Fix
The database sync logic has been updated to be much safer:

### 🔒 **Production Mode (NODE_ENV=production)**
- **Never** uses `force: true`
- **Never** alters existing tables automatically
- Only creates missing tables if they don't exist
- Preserves all existing data

### 🛠️ **Development Mode (NODE_ENV=development)**
- Uses `alter: true` to safely update table structures
- Only creates missing tables if they don't exist
- Preserves existing data unless explicitly forced

### ⚠️ **Force Sync (Emergency Use Only)**
- Set `FORCE_SYNC=true` in your environment variables
- **Only works in development mode** for safety
- **Will delete all data** - use with extreme caution

## Environment Variables

Add these to your `.env` file:

```bash
# Database sync behavior
NODE_ENV=development          # or 'production'
FORCE_SYNC=false             # Set to 'true' only when you want to reset everything
```

## Sync Behavior Summary

| Scenario | Action | Data Safety |
|----------|--------|-------------|
| All tables exist + Production | Skip sync | ✅ 100% Safe |
| All tables exist + Development | `alter: true` | ✅ Safe (updates structure) |
| Missing tables | `sync()` without force | ✅ Safe (creates missing only) |
| `FORCE_SYNC=true` + Development | `force: true` | ❌ **DELETES ALL DATA** |
| `FORCE_SYNC=true` + Production | Ignored for safety | ✅ Safe |

## When to Use Force Sync

Only use `FORCE_SYNC=true` when:
- You're in development and want to reset everything
- You've made major model changes that require a fresh start
- You're okay with losing all existing data

## Recommended Workflow

1. **Normal development**: Just restart your server - it will safely update tables
2. **Model changes**: Let `alter: true` handle structure updates automatically
3. **Fresh start needed**: Set `FORCE_SYNC=true` temporarily, then remove it
4. **Production**: Never use force sync - handle migrations manually

## Migration Best Practices

For production environments, consider using Sequelize migrations instead of auto-sync:

```bash
# Generate migration
npx sequelize-cli migration:generate --name add-payment-table

# Run migrations
npx sequelize-cli db:migrate
```

This gives you full control over database changes in production.