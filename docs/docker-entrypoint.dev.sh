#!/bin/sh
set -eu

if [ ! -x node_modules/.bin/docusaurus ]; then
  echo "Installing documentation dependencies..."
  npm install
fi

exec "$@"
