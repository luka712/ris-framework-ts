#!/usr/bin/env bash
# Release version helpers for .github/workflows/publish.yml. The version comes from CHANGELOG.md, not package.json.
#   release-version.sh pick [CHANGELOG]  -> topmost "## [X.Y.Z]" heading not yet on npm; prints nothing if all are published
#   release-version.sh dev X.Y.Z         -> next free X.Y.Z-dev.N on npm (continues the existing -dev.N numbering)
#   release-version.sh date [CHANGELOG]  -> replaces every {{YYYY-MM-DD}} heading placeholder with today's UTC date
# Set PACKAGE_NAME to override the name read from package.json (and NPM to mock npm in tests).
set -euo pipefail
NPM="${NPM:-npm}"
NAME="${PACKAGE_NAME:-$(node -p "require('./package.json').name")}"
cmd="${1:-}"; shift || true
case "$cmd" in
  pick)
    file="${1:-CHANGELOG.md}"
    for v in $(sed -nE 's/^## \[([0-9]+\.[0-9]+\.[0-9]+)\].*/\1/p' "$file"); do
      published=$("$NPM" view "${NAME}@${v}" version 2>/dev/null || true)
      if [ "$published" != "$v" ]; then echo "$v"; exit 0; fi
    done
    ;;
  dev)
    base="$1"
    versions=$("$NPM" view "$NAME" versions --json 2>/dev/null || echo '[]')
    last=$(printf '%s' "$versions" | tr -d '[]" ' | tr ',' '\n' \
      | sed -nE "s/^${base//./\\.}-dev\.([0-9]+)(\..*)?$/\1/p" | sort -n | tail -n 1)
    echo "${base}-dev.$(( ${last:-0} + 1 ))"
    ;;
  date)
    file="${1:-CHANGELOG.md}"
    sed -E -i "s/^(## \[[^]]+\] - )\{\{YYYY-MM-DD\}\}$/\1$(date -u +%F)/" "$file"
    ;;
  *) echo "usage: $0 pick|dev|date ..." >&2; exit 2 ;;
esac
