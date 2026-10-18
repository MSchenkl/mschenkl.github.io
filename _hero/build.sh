#!/bin/sh
# Baut landscape/index.html und portrait/index.html aus src/*.html,
# bettet ../assets/cloud.js (dieselbe Datei wie auf der Website) und src/driver.js ein.
cd "$(dirname "$0")"
for v in landscape portrait; do
  awk '
    /<script src="cloud.js"><\/script>/  { print "    <script>"; while ((getline l < "../assets/cloud.js") > 0) print l; print "    </script>"; next }
    /<script src="driver.js"><\/script>/ { print "    <script>"; while ((getline l < "src/driver.js") > 0) print l; print "    </script>"; next }
    { print }' "src/$v.html" > "$v/index.html"
done
