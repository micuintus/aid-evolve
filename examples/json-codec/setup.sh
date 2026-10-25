#!/bin/sh
# Copies this example to a fresh directory and makes target/ its own git
# repository, which LedgerEvolve requires (iterations branch inside target/).
set -eu
dest="${1:-./json-codec-run}"
if [ -e "$dest" ]; then
	echo "refusing to overwrite $dest" >&2
	exit 1
fi
src="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$dest"
cp "$src/evolve.md" "$dest/"
cp -R "$src/target" "$dest/target"
cd "$dest/target"
git init -q -b main
git add -A
git -c user.name=ledgerevolve -c user.email=ledgerevolve@example.invalid commit -q -m "baseline"
node bench.mjs
echo
echo "Ready: cd $dest, start pi, then /evolve"
