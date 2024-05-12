#!/bin/bash
script_dir=$(dirname "$0")
cd "$script_dir" || exit
git pull
chmod 777 server/storage/translations.json
chmod 777 server/storage/favorites.json
git add server/storage/translations.json
git add server/storage/favorites.json
git commit -m "translations and favorites updated"
git push
