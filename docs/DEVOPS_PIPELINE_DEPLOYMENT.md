# DevOps Pipeline & Deployment Solution

Comprehensive documentation for VibeTravels CI/CD pipeline and deployment strategy using GitHub Actions and Render.com with Infrastructure as Code approach.

## 📋 Table of Contents

- [Architecture Overview](#-architecture-overview)
- [CI/CD Pipeline Strategy](#-cicd-pipeline-strategy)
- [Infrastructure as Code](#-infrastructure-as-code)
- [Deployment Flow](#-deployment-flow)
- [Security & Best Practices](#-security--best-practices)
- [Monitoring & Troubleshooting](#-monitoring--troubleshooting)
- [Cost Optimization](#-cost-optimization)

## 🏗️ Architecture Overview

### Technology Stack

**Frontend:**

- Vue.js 3 with TypeScript
- Tailwind CSS 4 + Flowbite 3
- Docker containerization
- Nginx for production serving

**Backend:**

- Python 3.13 with FastAPI
- PostgreSQL 16 database
- Docker containerization
- OpenRouter AI integration

**DevOps:**

- GitHub Actions for CI/CD
- Render.com for hosting
- Infrastructure as Code (IaC) with render.yaml
- Docker multi-stage builds

### Deployment Architecture

```text
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Developer     │    │   GitHub        │    │   Render.com    │
│   Local Dev     │────│   Repository    │────│   Production    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │ GitHub Actions  │
                       │   CI/CD         │
                       └─────────────────┘
```

**Production Services on Render:**

- `vibetravel-backend` - FastAPI application
- `vibetravel-frontend` - Vue.js + Nginx
- `vibetravel-db` - Managed PostgreSQL 16

## 🔄 CI/CD Pipeline Strategy

### Protected Master Branch Workflow

The deployment strategy follows a **protected master branch** approach with automated deployment only after successful CI validation:

```text
Feature Branch → Pull Request → CI Validation → Master Merge → Auto Deploy
```

### Pipeline Triggers

1. **Pull Request to Master**: Runs full CI suite (tests, linting, security)
2. **Push to Master**: Runs CI + triggers automatic deployment
3. **Manual Workflow Dispatch**: Emergency deployments with optional test skipping

### CI/CD Jobs

#### 1. Backend Job (`backend`)

**Docker Build & Test:**

```yaml
- Build development image for testing
- Build production image for Render compatibility
- Run comprehensive test suite with coverage
- Security scanning with Bandit
- Linting with Ruff
```

**Key Features:**

- Multi-stage Docker builds with BuildKit
- PostgreSQL service for integration tests
- Coverage reporting with artifacts
- Security vulnerability scanning

#### 2. Frontend Job (`frontend`)

**Vue.js Build & Test:**
```yaml
- Build development image for testing
- Build production image with Nginx
- TypeScript type checking
- ESLint linting
- Vitest unit tests with coverage
- Security audit with npm audit
```

**Key Features:**
- Production build validation
- Static analysis and type checking
- Coverage reporting
- Dependency security scanning

#### 3. Configuration Validation (`validate-render-config`)

**Infrastructure Validation:**
```yaml
- Validate render.yaml syntax
- Check Dockerfile paths exist
- Verify service configuration
- Validate environment variables structure
```

#### 4. Production Deployment (`deploy-production`)

**Automated Deployment:**

- Triggers only after all CI jobs pass
- Uses Render API for deployment
- Supports manual deployment with workflow_dispatch
- Environment-specific configuration
- **Manual Trigger Logic**: Deploys regardless of `skip_tests` value since the `needs` clause ensures prerequisite jobs have passed

### Branch Protection Rules

**Master Branch Protection:**
- ✅ Require pull request before merging
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Required status checks: `backend`, `frontend`, `validate-render-config`

## 🏭 Infrastructure as Code

### Render Blueprint (`render.yaml`)

The entire infrastructure is defined declaratively in `render.yaml`:

```yaml
# Database
databases:
  - name: vibetravel-db
    databaseName: vibetravel_prod
    user: vibetravel_user
    plan: free
    postgresMajorVersion: "16"

# Backend Service
services:
  - type: web
    name: vibetravel-backend
    runtime: docker
    dockerfilePath: ./Dockerfile.prod
    healthCheckPath: /api/v1/utils/health-check/
    autoDeploy: false  # Controlled deployment

# Frontend Service  
  - type: web
    name: vibetravel-frontend
    runtime: docker
    dockerfilePath: ./Dockerfile.prod
    autoDeploy: false  # Controlled deployment
```

### Key IaC Benefits

1. **Version Control**: Infrastructure changes tracked in Git
2. **Reproducibility**: Identical environments across deployments
3. **Automation**: No manual configuration in Render Dashboard
4. **Rollback**: Easy infrastructure rollback with Git revert

### Docker Production Images

#### Backend (`backend/Dockerfile.prod`)
```dockerfile
# Multi-stage build for optimization
FROM python:3.13-slim as builder
# ... dependency installation

FROM python:3.13-slim as runtime
# ... production runtime
EXPOSE $PORT
CMD ["python", "-m", "gunicorn", "main:app"]
```

#### Frontend (`frontend/Dockerfile.prod`)
```dockerfile
# Build stage
FROM node:22-alpine as builder
# ... Vue.js build

# Production stage with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx-render.conf /etc/nginx/conf.d/default.conf
```

## 🚀 Deployment Flow

### Automatic Deployment Process

1. **Developer Creates PR**
   ```bash
   git checkout -b feature/new-feature
   git push origin feature/new-feature
   # Create PR to master
   ```

2. **CI Validation**
   - All tests must pass
   - Security scans must pass
   - Build validation must succeed

3. **PR Merge to Master**
   ```bash
   # After code review and CI success
   git checkout master
   git merge feature/new-feature
   git push origin master
   ```

4. **Automatic Deployment**
   - GitHub Actions triggers deployment job
   - Calls Render API to deploy latest commit
   - Render builds and deploys using render.yaml

### Manual Deployment Options

#### 1. GitHub Actions Manual Trigger

```yaml
workflow_dispatch:
  inputs:
    environment:
      description: 'Target environment'
      default: 'production'
    skip_tests:
      description: 'Skip tests (not recommended)'
      default: false
    reason:
      description: 'Reason for manual trigger'
```

**Important Notes:**
- When `skip_tests: false` (default): All CI jobs run normally, deployment proceeds after success
- When `skip_tests: true`: Test steps are skipped but linting and security scans still run
- Deployment always occurs if prerequisite jobs pass, regardless of `skip_tests` value
- The `needs` clause ensures deployment only happens after required jobs complete successfully

#### 2. Render Dashboard

- Navigate to service → Manual Deploy → Deploy latest commit

### Deployment Verification

**Automated Health Checks:**
- Backend: `https://vibetravel-backend.onrender.com/api/v1/utils/health-check/`
- Frontend: `https://vibetravel-frontend.onrender.com`
- Database: Automatic monitoring by Render

## 🔒 Security & Best Practices

### Secrets Management

**GitHub Secrets (Required):**
```bash
RENDER_API_KEY=your-render-api-key-here
```

**Render Environment Variables (Secrets):**
```bash
SECRET_KEY=production-secret-key
JWT_SECRET_KEY=jwt-secret-key
OPENROUTER_API_KEY=openrouter-api-key
FIRST_SUPERUSER=admin@vibetravel.com
FIRST_SUPERUSER_PASSWORD=secure-password
```

### Security Scanning

**Backend Security:**
- Bandit for Python security issues
- Dependency vulnerability scanning
- Docker image security validation

**Frontend Security:**
- npm audit for dependency vulnerabilities
- TypeScript strict mode for type safety
- ESLint security rules

### Production Security Configuration

```yaml
# JWT Configuration
JWT_COOKIE_SECURE: "true"
JWT_COOKIE_SAMESITE: "none"

# HTTPS Configuration
SECURE_SSL_REDIRECT: "true"
ALLOWED_HOSTS: vibetravel-backend.onrender.com

# CORS Configuration
BACKEND_CORS_ORIGINS: '["https://vibetravel-frontend.onrender.com"]'
```

## 📊 Monitoring & Troubleshooting

### Monitoring Solutions

**Render Dashboard Monitoring:**
- Real-time logs for all services
- Performance metrics (CPU, Memory, Response time)
- Deploy history and rollback options
- Automatic health checks

**GitHub Actions Monitoring:**
- CI/CD pipeline success/failure notifications
- Build time and performance metrics
- Artifact storage for debugging

### Troubleshooting Guide

#### 1. Build Failures

**Backend Issues:**
```bash
# Check logs in Render Dashboard
# Verify Python dependencies in requirements.txt
# Check Dockerfile.prod syntax
# Validate environment variables
```

**Frontend Issues:**
```bash
# Check Node.js build logs
# Verify npm dependencies
# Check TypeScript compilation errors
# Validate environment variables for build
```

#### 2. Database Connection Issues

```bash
# Verify database service is running
# Check connection string environment variables
# Validate PostgreSQL version compatibility
# Check network connectivity between services
```

#### 3. CORS Errors

```bash
# Verify BACKEND_CORS_ORIGINS includes frontend URL
# Check frontend API base URL configuration
# Validate cookie settings for cross-origin requests
```

### Rollback Procedures

#### 1. Application Rollback
```bash
# Via Render Dashboard
Service → Events → Previous Deploy → Redeploy

# Via Git
git revert <problematic-commit>
git push origin master
```

#### 2. Infrastructure Rollback
```bash
# Revert render.yaml changes
git revert <infrastructure-commit>
git push origin master
# Render will automatically apply reverted configuration
```

## 💰 Cost Optimization

### Current Free Tier Usage

**Services on Free Plan:**
- Backend: 750 hours/month, sleeps after 15 min inactivity
- Frontend: 750 hours/month, sleeps after 15 min inactivity  
- Database: 1GB storage, 100 connections

**Build Resources:**
- 500 build minutes/month shared across services
- GitHub Actions: 2000 minutes/month on free plan

### Optimization Strategies

#### 1. Docker Image Optimization
```dockerfile
# Multi-stage builds to reduce image size
# Alpine base images where possible
# .dockerignore to exclude unnecessary files
# Layer caching optimization
```

#### 2. Build Time Optimization
```yaml
# GitHub Actions cache for Docker layers
cache-from: type=gha
cache-to: type=gha,mode=max

# Parallel job execution where possible
# Conditional job execution based on changes
```

#### 3. Resource Monitoring
- Monitor service sleep patterns
- Optimize build frequency
- Track resource usage in Render Dashboard

### Upgrade Path for Production

```yaml
# Recommended paid plans for production
services:
  - name: vibetravel-backend
    plan: starter  # $7/month - no sleep
  - name: vibetravel-frontend  
    plan: starter  # $7/month - no sleep

databases:
  - name: vibetravel-db
    plan: starter  # $7/month - 256MB RAM, 10GB storage
```

## 🎯 Best Practices Summary

### Development Workflow
1. **Feature Branch Development**: All work on separate branches
2. **Pull Request Review**: Code review before merge
3. **Automated Testing**: Comprehensive test coverage
4. **Security First**: Regular security scanning

### Deployment Strategy
1. **Infrastructure as Code**: All configuration in version control
2. **Automated Deployment**: Reduce manual intervention
3. **Health Checks**: Validate deployments automatically
4. **Rollback Capability**: Quick recovery from issues

### Security Practices
1. **Secrets Management**: Never commit secrets to repository
2. **Environment Separation**: Clear boundaries between environments
3. **Access Control**: Limited access to production systems
4. **Regular Updates**: Keep dependencies up to date

### Monitoring & Maintenance
1. **Proactive Monitoring**: Track performance and errors
2. **Log Management**: Centralized logging for debugging
3. **Regular Backups**: Automated database backups
4. **Documentation**: Keep deployment docs updated

---

## 📚 Additional Resources

- **Render Documentation**: https://render.com/docs
- **GitHub Actions Documentation**: https://docs.github.com/en/actions
- **Docker Best Practices**: https://docs.docker.com/develop/dev-best-practices/
- **FastAPI Deployment**: https://fastapi.tiangolo.com/deployment/
- **Vue.js Production Deployment**: https://vuejs.org/guide/best-practices/production-deployment.html

## ✅ Quick Start Checklist

- [ ] Configure GitHub Secrets (`RENDER_API_KEY`)
- [ ] Set up protected master branch rules
- [ ] Configure Render secrets in Dashboard
- [ ] Verify `render.yaml` configuration
- [ ] Test CI/CD pipeline with a PR
- [ ] Validate production deployment
- [ ] Set up monitoring and alerts
- [ ] Document environment-specific procedures

---

**Last Updated**: July 2025  
**Maintained By**: DevOps Team  
**Version**: 1.0.0
