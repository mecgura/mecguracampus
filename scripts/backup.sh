# MecguraCampus weekly backup (VPS cron, later).
# Crontab: 0 2 * * 0  cd /opt/mecguracampus && ./scripts/backup.sh
# Keeps 8 weekly copies. Needs: DATABASE_URL exported (postgres) or local dev.db (sqlite).
#!/bin/bash
set -e
cd /opt/mecguracampus
STAMP=$(date +%F)
mkdir -p backups
if [ -n "$DATABASE_URL" ]; then
  if command -v pg_dump >/dev/null 2>&1; then
    pg_dump "$DATABASE_URL" > "backups/mecguracampus-$STAMP.sql"
    echo "postgres backup done: backups/mecguracampus-$STAMP.sql"
  else
    echo "pg_dump missing; book a manual Neon backup instead."
  fi
else
  cp dev.db "backups/mecguracampus-$STAMP.db"
  echo "sqlite backup done: backups/mecguracampus-$STAMP.db"
fi
ls -t backups/ | tail -n +9 | xargs -r -I{} rm "backups/{}"
echo "rotation done (kept newest 8)"
