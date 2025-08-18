@echo off
echo "Staging all changes..."
git add .

echo "Committing with a default message..."
git commit -m "Auto-commit: %date% %time%"

echo "Pushing to origin main..."
git push origin main

echo "Done!"
pause