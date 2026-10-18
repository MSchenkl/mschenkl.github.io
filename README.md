# mschenkl.github.io

Startseite und Visitenkarte von Mark Schenkl, live unter https://mschenkl.github.io

## Neue Unterseite hinzufügen
- **Eigenes Repo mit GitHub Pages:** Die Seite erscheint automatisch als Karte. Die Startseite fragt dafür die GitHub-API ab.
- **Unterseite in einem bestehenden Repo** (z. B. `cv/abi/`) oder eigener Text gewünscht: einen Eintrag in `pages.json` anlegen.
  - Felder: `title`, `subtitle`, `url`, `tag`, `accent`
  - Optional: `featured` (breite Karte), `links` (Zusatzlinks), `repo` (verhindert eine doppelte Auto-Karte)

## Hero-Film (HeyGen HyperFrames)
- Quelle: `_hero/src/` (Komposition + `hero.js`, ein Datennetz, das sich zum Monogramm „MS“ formt)
- `_hero/build.sh` erzeugt `_hero/landscape/` und `_hero/portrait/`.
- Rendern: `npx hyperframes render .` in beiden Ordnern, danach mit ffmpeg nach `assets/hero-*.{mp4,webm}` komprimieren.
- `_hero/` wird von Jekyll nicht veröffentlicht, weil der Ordner mit einem Unterstrich beginnt.

## Lokal testen
    python3 -m http.server 8765
