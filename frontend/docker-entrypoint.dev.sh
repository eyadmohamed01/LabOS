#!/bin/sh
set -eu

if [ ! -x node_modules/.bin/next ]; then
  echo "Installing frontend dependencies..."
  npm install
fi

exec "$@"
