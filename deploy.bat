@echo off
echo Starting Deployment...
npx -y firebase-tools deploy --only hosting --project appinjproject --non-interactive
echo Deployment Finished.
