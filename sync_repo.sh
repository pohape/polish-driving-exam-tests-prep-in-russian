#!/bin/bash
script_dir=$(dirname "$0")
cd "$script_dir"
git pull
chmod 777 translations.json
git add translations.json
git commit -m "translations updated"
git push

