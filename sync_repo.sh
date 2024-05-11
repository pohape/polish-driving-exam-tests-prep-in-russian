#!/bin/bash
script_dir=$(dirname "$0")
cd "$script_dir" || exit
git pull
chmod 777 translations.json
chmod 777 favorites.json
git add server/data/translations.json
git add server/data/favorites.json
git commit -m "translations and favorites updated"
git push
