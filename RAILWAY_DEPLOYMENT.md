# Railway Deployment Guide

This document explains how to deploy the Care Compliance Management System to Railway.

## Prerequisites

- Railway account connected to GitHub repository
- Database provisioned (MySQL/TiDB)
- Environment variables configured

## System Dependencies

The application requires several system-level packages for PDF generation and document processing. These are automatically installed via the `nixpacks.toml` configuration file.

### Required Packages (Auto-installed)

- **cairo** - Canvas operations for PDFKit
- **pango** - Text rendering for PDFKit
- **fontconfig** - Font configuration
- **freetype** - Font rendering engine
- **libjpeg** - JPEG image support
- **libpng** - PNG image support
- **librsvg** - SVG support
- **pixman** - Low-level pixel manipulation
- **giflib** - GIF image support

## Deployment Steps

### 1. Push Code to GitHub

```bash
git add .
git commit -m "Add Railway deployment configuration"
git push origin main
```

### 2. Railway Auto-Detection

Railway will automatically:
- Detect the `nixpacks.toml` file
- Install all system dependencies
- Run `pnpm install`
- Run `pnpm build`
- Start the application with `pnpm start`

### 3. Environment Variables

Ensure these environment variables are set in Railway:

**Required:**
- `DATABASE_URL` - MySQL/TiDB connection string
- `JWT_SECRET` - Session signing secret
- `NODE_ENV=production`

**Manus Integration (Auto-provided):**
- `VITE_APP_ID`
- `OAUTH_SERVER_URL`
- `VITE_OAUTH_PORTAL_URL`
- `BUILT_IN_FORGE_API_URL`
- `BUILT_IN_FORGE_API_KEY`
- `VITE_FRONTEND_FORGE_API_KEY`
- `VITE_FRONTEND_FORGE_API_URL`

**Optional:**
- `SENDGRID_API_KEY` - Email notifications
- `SENDGRID_FROM_EMAIL` - Sender email address

### 4. Database Migration

After first deployment, run migrations:

```bash
# Railway CLI
railway run pnpm db:push
```

Or use the Railway dashboard to run the command.

## Troubleshooting

### PDF Generation Fails

**Symptom:** PDF exports return errors or empty files

**Solution:**
1. Check Railway logs for PDFKit errors
2. Verify `nixpacks.toml` is in the repository root
3. Redeploy to ensure system packages are installed
4. Check logs with: `railway logs`

**Common Error:**
```
Error: Cannot find module 'canvas'
```
This means cairo/pango are not installed. Ensure `nixpacks.toml` is present and redeploy.

### Site Unresponsive After Inactivity

**Symptom:** UI becomes unclickable after period of inactivity

**Possible Causes:**
1. Railway container sleeping (free tier)
2. Session timeout
3. tRPC connection not recovering

**Solutions:**
1. Upgrade to Railway Pro for always-on containers
2. Implement session keepalive
3. Add connection recovery logic (implemented in this update)

### Document Upload Fails

**Symptom:** Word/PDF uploads fail to process

**Solution:**
1. Check file size limits (Railway has upload limits)
2. Verify S3 credentials are configured
3. Check logs for mammoth/pdf-parse errors

### Database Connection Errors

**Symptom:** Application fails to connect to database

**Solution:**
1. Verify `DATABASE_URL` is set correctly
2. Check database is running and accessible
3. Verify SSL settings if required
4. Check Railway network settings

## Monitoring

### Health Check Endpoint

The application exposes a health check endpoint:

```
GET /api/health
```

Returns:
```json
{
  "status": "ok",
  "timestamp": "2025-12-17T09:00:00.000Z",
  "database": "connected",
  "version": "1.0.0"
}
```

### Logs

View logs in Railway dashboard or via CLI:

```bash
railway logs
railway logs --follow
```

### Performance

Monitor these metrics:
- Response times for PDF generation (should be < 5s)
- Database query times
- Memory usage (PDFKit is memory-intensive)
- CPU usage during PDF generation

## Scaling

### Horizontal Scaling

Railway supports horizontal scaling:
1. Go to project settings
2. Enable horizontal scaling
3. Set min/max replicas

### Vertical Scaling

Increase resources if PDF generation is slow:
1. Upgrade Railway plan
2. Allocate more memory (recommended: 2GB+)
3. Allocate more CPU

## Backup and Recovery

### Database Backups

Railway provides automatic database backups. Configure in database settings.

### Application State

Application is stateless except for:
- Database (backed up by Railway)
- S3 files (backed up by Manus)
- Session cookies (ephemeral)

## Security

### HTTPS

Railway provides automatic HTTPS for all deployments.

### Environment Variables

Never commit sensitive values to Git. Use Railway's environment variable management.

### CORS

CORS is configured for the Railway domain. Update if using custom domain.

## Custom Domain

1. Add custom domain in Railway dashboard
2. Update DNS records
3. Update `VITE_APP_URL` environment variable
4. Redeploy

## Support

For Railway-specific issues:
- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway

For application issues:
- Check PRODUCTION_ISSUES.md
- Review application logs
- Contact development team
