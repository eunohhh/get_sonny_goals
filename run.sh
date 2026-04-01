#!/usr/bin/env bash
set -euo pipefail

cd /home/eunoh/projects/get_sonny_goals

export PATH="/usr/local/bin:/usr/bin:/bin:$HOME/.local/bin"

pnpm exec tsx --env-file=.env index_namu.ts