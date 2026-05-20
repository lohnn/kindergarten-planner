#!/bin/bash
# Configure git to use the project's hooks directory
set -e
REPO_ROOT="$(cd "$(dirname "$0")" && git rev-parse --show-toplevel)"
git config core.hooksPath "$REPO_ROOT/hooks"
echo "Git hooks configured (core.hooksPath → hooks/)"
