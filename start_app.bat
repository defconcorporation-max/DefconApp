
@echo off
echo Starting Defcon Agency App...
cd /d "f:\Entreprises\defcon app"

:: Open the browser to the app URL
start http://localhost:3000

:: Start the Next.js development server
npm run dev
pause
