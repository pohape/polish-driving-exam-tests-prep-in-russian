#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

BRANCH="release"
REMOTE="origin"
FORCE=0

if [[ "${1-}" == "--force" ]]; then
  FORCE=1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  if [[ $FORCE -eq 0 ]]; then
    echo "Есть незакоммиченные изменения. Отмени/закоммить или запусти с --force (выполнит hard reset)." >&2
    exit 1
  else
    echo "--force: откатываю локальные изменения."
    git reset --hard
  fi
fi

git fetch --all --prune
if [[ "$(git rev-parse --abbrev-ref HEAD)" != "$BRANCH" ]]; then
  git checkout "$BRANCH"
fi
git pull --ff-only "$REMOTE" "$BRANCH"


echo "=> updated to the last commit $REMOTE/$BRANCH."
