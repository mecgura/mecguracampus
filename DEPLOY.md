# MecguraCampus — VPS Deploy Guide (Hostinger Ubuntu 24.04)
# Total time: ~20 minutes. Run these in Hostinger's Browser Terminal as root.

# ---- 0. System + Docker ----
apt update && apt install -y docker.io docker-compose-plugin git
docker --version

# ---- 1. Get the code (private repo → needs a GitHub token) ----
# GitHub → Settings → Developer settings → Personal access tokens → Fine-grained:
#   Repository access: Only select repositories → mecguracampus → Permissions: Contents = Read-only
# Then (replace TOKEN):
git clone https://TOKEN@github.com/mecgura/mecguracampus /opt/campus
cd /opt/campus

# ---- 2. Secrets ----
cp .env.deploy.example .env.deploy
nano .env.deploy
# Fill: DB_PASSWORD (long random), AUTH_SECRET (node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"),
#       APP_DOMAIN=www.campus.mecgura.com

# ---- 3. DNS (domain panel, where mecgura.com lives) ----
# DELETE old Vercel CNAME rows named `campus` and `www.campus` (they block the A record).
# Then add:  Type A | Host: campus | Value: <VPS-IP> | TTL: 300
# Wait 5-15 min, then continue (Caddy needs DNS to issue SSL).

# ---- 4. Launch ----
docker compose --env-file .env.deploy up -d --build
sleep 20
docker compose ps

# ---- 5. First data (owner login + demo schools) ----
docker compose exec app npx tsx prisma/seed.ts
docker compose exec app npx tsx prisma/seed-extras.ts
docker compose exec app npx tsx prisma/seed-parents.ts
docker compose exec app npx tsx prisma/seed-routine.ts

# ---- 6. Open it ----
# https://www.campus.mecgura.com  → owner@mecguracampus.com / Admin@12345
# CHANGE THE PASSWORD immediately (login → no UI yet: use a second admin? see README).
# Logs:   docker compose logs -f app
# Update: cd /opt/campus && git pull && docker compose --env-file .env.deploy up -d --build
# Backup: scripts/backup.sh runs inside app? For VPS postgres use:
#   docker compose exec db pg_dump -U campus mecguracampus > backup-$(date +%F).sql
