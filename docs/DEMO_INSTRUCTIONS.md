Demo GIF — instructions
=======================

This file documents multiple simple ways to record a short demo of running `npm run test:newman` and convert it to a GIF suitable for the README and LinkedIn.

Method A — macOS QuickTime (visual, highest fidelity)
- Open **QuickTime Player** → File → New Screen Recording.
- Record the terminal while running `npm run test:newman`.
- Save the recording as `demo.mov`.
- Convert / trim and create a GIF using `ffmpeg`:

```bash
# trim 0-10 seconds and convert
ffmpeg -ss 0 -t 10 -i demo.mov -vf "fps=15,scale=960:-1:flags=lanczos" -loop 0 docs/demo.gif
```

Method B — Terminalizer (terminal-only, automated)
- Install: `npm install -g terminalizer`
- Record session:

```bash
terminalizer record demo
# terminalizer opens a shell; run your demo commands now, e.g.:
npm run test:newman
# Press Ctrl+D when finished to stop recording
```

- Render to GIF (local):

```bash
terminalizer render demo --format gif -o docs/demo.gif
```

This repo includes a helper script: `scripts/render_demo_with_terminalizer.sh` which runs the above render step:

```bash
./scripts/render_demo_with_terminalizer.sh demo docs/demo.gif
```

Method C — Asciinema -> svg-term -> convert (advanced)
- Record: `asciinema rec demo.cast -- command "npm run test:newman"`
- Convert to SVG: `npx svg-term --in demo.cast --out demo.svg --profile small`
- Convert SVG to GIF: `rsvg-convert -w 960 demo.svg -o demo.png && convert -delay 5 demo.png docs/demo.gif`

Notes & trimming
- Use `ffmpeg -ss START -t DURATION -i input.mov ...` to trim.
- `fps=15` and `scale=960:-1` produce a good balance of quality vs size for LinkedIn.
- Keep GIFs short (<10s) for readability.

Placing the GIF
- Put the GIF at `docs/demo.gif` so the README can reference it.
