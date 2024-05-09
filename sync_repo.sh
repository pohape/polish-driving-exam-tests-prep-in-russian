#!/bin/bash
script_dir=$(dirname "$0")
cd "$script_dir"
git pull
chmod 777 translations.json
chmod 777 favorites.json
git add translations.json
git add favorites.json
git commit -m "translations and favorites updated"
git push
