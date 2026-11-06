#!/usr/bin/env bash
# Usage: scripts/release.sh <X.Y.Z>
set -euo pipefail

fail() {
  printf 'Error: %s\n' "$1" >&2
  exit 1
}

[[ $# -eq 1 && $1 =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || fail 'Usage: scripts/release.sh <X.Y.Z>'
version=$1
tag="v$version"

cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
[[ $(git branch --show-current) == main ]] || fail 'Current branch must be main'
[[ -z $(git status --porcelain) ]] || fail 'Working tree must be clean'

# Keep the section's trailing newlines when passing notes to gh.
notes=$(
  awk -v heading="## [$version]" '
    /^## \[/ {
      if (found) exit
      if (index($0, heading) == 1) { found = 1; next }
    }
    found { print }
    END { if (!found) exit 1 }
  ' CHANGELOG.md && printf '.'
) || fail "CHANGELOG.md is missing a ## [$version] heading"
notes=${notes%.}

if git show-ref --verify --quiet "refs/tags/$tag"; then
  fail "Tag $tag already exists locally"
fi
remote_tag=$(git ls-remote --tags origin "refs/tags/$tag") || fail 'Cannot read tags from origin'
[[ -z $remote_tag ]] || fail "Tag $tag already exists on origin"

npm pkg set "version=$version"
if ! git diff --quiet -- package.json; then
  git commit -am "Release $tag"
fi
git tag -a "$tag" -m "$tag"
git push origin main
git push origin "$tag"
gh release create "$tag" --title "$tag" --notes "$notes"
printf 'Released %s. Upgrade pi with: pi install git:github.com/zhoupb01/pi-memory@%s\n' "$tag" "$tag"
