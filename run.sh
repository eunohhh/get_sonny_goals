#!/usr/bin/env bash
set -euo pipefail

cd /Users/eunoh/projects/get_sonny_goals

export PATH="/opt/homebrew/bin:$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin"

pnpm exec tsx --env-file=.env index_namu.ts
