#!/bin/sh
# Baut landscape/index.html und portrait/index.html aus src/*.html + src/hero.js
cd "$(dirname "$0")"
for v in landscape portrait; do
  awk -v js="src/hero.js" '
    /<script src="hero.js"><\/script>/ {
      print "    <script>"; while ((getline l < js) > 0) print l; print "    </script>"; next }
    { print }' "src/$v.html" > "$v/index.html"
done
