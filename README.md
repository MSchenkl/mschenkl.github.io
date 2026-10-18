# mschenkl.github.io

Startseite und Visitenkarte von Mark Schenkl, live unter https://mschenkl.github.io

## Neue Unterseite hinzufügen
- **Eigenes Repo mit GitHub Pages:** Die Seite erscheint automatisch als Karte. Die Startseite fragt dafür die GitHub-API ab.
- **Unterseite in einem bestehenden Repo** (z. B. `cv/abi/`) oder eigener Text gewünscht: einen Eintrag in `pages.json` anlegen.
  - Felder: `title`, `subtitle`, `url`, `tag`, `accent`
  - Optional: `featured` (breite Karte), `links` (Zusatzlinks), `repo` (verhindert eine doppelte Auto-Karte)

## Hero: Partikelwolke
- `assets/cloud.js`: WebGL2-Partikelsystem ohne Bibliothek (Kugel mit Strömungsbändern → Strömung → „MS“ → zurück, 22,5-s-Schleife). Es läuft live im Browser.
- **Ohne WebGL2:** Dann spielt das Ersatzvideo `assets/hero-*.mp4`.
- **Poster, Social-Preview und Ersatzvideo** kommen aus HeyGen HyperFrames:
  - `_hero/build.sh` bettet `cloud.js` in `_hero/landscape|portrait/index.html` ein.
  - Danach in beiden Ordnern `npx hyperframes render .` ausführen und mit ffmpeg nach `assets/` verkleinern.
- `_hero/` wird von Jekyll nicht veröffentlicht, weil der Ordner mit einem Unterstrich beginnt.

## Lokal testen
    python3 -m http.server 8765
