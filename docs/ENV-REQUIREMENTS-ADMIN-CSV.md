# Environment Variables Required for Admin CSV Upload

## Overview

This document lists all environment variables required for the Admin CSV Upload feature to function correctly in staging and production environments.

## Required Environment Variables

### Database Configuration

**`DATABASE_URL`** (REQUIRED)
- **Type**: MySQL connection string
- **Format**: `mysql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME`
- **Example**: `mysql://root:password@localhost:3306/magsasa_demo`
- **Purpose**: Database connection for CSV data insertion
- **Used in**: All CSV upload mutations
- **Validation**: Must be valid MySQL connection string

### Node Environment

**`NODE_ENV`** (OPTIONAL, but recommended)
- **Type**: String
- **Values**: `development`, `staging`, `production`
- **Default**: `development` (if not set)
- **Purpose**: Controls logging verbosity and error handling
- **Used in**: Logging, error handling
- **Note**: In production, should be set to `production`

## Optional Environment Variables

### Logging Configuration

**`LOG_LEVEL`** (OPTIONAL)
- **Type**: String
- **Values**: `debug`, `info`, `warn`, `error`
- **Default**: `info` (if not set)
- **Purpose**: Controls log verbosity
- **Note**: Currently not used, but reserved for future logging enhancements

## Staging Environment Example

```bash
# Database
DATABASE_URL=mysql://staging_user:staging_pass@staging-db.example.com:3306/magsasa_staging

# Environment
NODE_ENV=staging

# Optional
LOG_LEVEL=info
```

## Production Environment Example

```bash
# Database
DATABASE_URL=mysql://prod_user:secure_password@prod-db.example.com:3306/magsasa_prod

# Environment
NODE_ENV=production

# Optional
LOG_LEVEL=warn
```

## Validation Checklist

Before deploying to staging/production, verify:

- [ ] `DATABASE_URL` is set and valid
- [ ] `DATABASE_URL` points to correct database (staging/prod)
- [ ] `NODE_ENV` is set appropriately (`staging` or `production`)
- [ ] Database user has required permissions:
  - `SELECT`, `INSERT`, `UPDATE` on `users`, `farms`, `yields` tables
  - Ability to create indexes (if not already created)
- [ ] Database connection is accessible from application server
- [ ] Connection pool settings are appropriate for expected load

## Security Notes

1. **Never commit `.env` files** to version control
2. **Use secure password storage** (e.g., AWS Secrets Manager, HashiCorp Vault)
3. **Rotate database passwords** regularly
4. **Use different credentials** for staging and production
5. **Restrict database access** to application servers only

## Troubleshooting

### "Database connection not available"
- Check `DATABASE_URL` is set correctly
- Verify database server is running
- Check network connectivity
- Verify database user has correct permissions

### "Invalid session cookie" or authentication errors
- Verify `JWT_SECRET` is set (required for admin authentication)
- Check `COOKIE_NAME` configuration (if custom)

### Import fails silently
- Check server logs for `[AdminCSV]` entries
- Verify database indexes are created (see `docs/INDEXES-SQL.sql`)
- Check database connection pool limits

## Related Documentation

- `docs/INDEXES-SQL.sql` - Required database indexes
- `docs/DEPLOY-CHECKLIST-ADMIN-CSV.md` - Complete deployment checklist
- `docs/LOAD-TEST-ADMIN-CSV.md` - Performance testing results

