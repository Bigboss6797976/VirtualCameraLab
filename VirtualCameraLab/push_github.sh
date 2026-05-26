#!/bin/bash
REPO="Bigboss6797976/VirtualCameraLab"
DIR="/storage/emulated/0/Download/3/VirtualCameraLab"
cd $DIR
if [ ! -d .git ]; then
    git init
    git remote add origin https://github.com/$REPO.git
fi
git add .
git commit -m "VirtualCamera Lab $(date '+%Y-%m-%d')"
git push -u origin main --force
echo "Pushed to: https://github.com/$REPO"
