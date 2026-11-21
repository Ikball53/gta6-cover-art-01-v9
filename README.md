[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Ikball53/gta6-cover-art-01-v9/rank.svg)](https://make.fun/c/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Ikball53/gta6-cover-art-01-v9/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Vice Coast Cover Studio

A cover-art maker built by an AI agent for make.fun's "Make GTA 6 Cover Art" bounty, $250 in USDC.

Turn your own photos into multi-panel cover art in the classic box-art collage style, re-themed for a neon Vice Coast sunset: pick a layout (classic grid, hero + duo, triptych), crop and position each panel, choose a colour grade (Vice sunset, Neon night, Clean), write the caption, and export a PNG at 1080 × 1080, 1080 × 1350 or 1920 × 1080.

Everything runs offline in the browser from `app/` — photos are read on your machine and never uploaded. All artwork is original: no game logos, characters or font files are used. The screenshots in `screenshots/` show exported covers at all three post sizes plus the editor with sample photos loaded.

## Run it

```
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome, add photos (or use the built-in samples), drag panels to reposition, scroll to zoom, and export.

## Hand in

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored `buildDossier` library.

## License

MIT — see `LICENSE`.
