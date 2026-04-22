# SPFâ€‘Domain Extractor Web App

## Overview
A tiny, clientâ€‘side web app that extracts all lines from a large SPFâ€‘record file (`Master_with_includes.txt`) containing any domain listed in `domains.txt`. The app works efficiently even with files around 600â€¯MiB by streaming the second file and processing it lineâ€‘byâ€‘line.

## Features
- Upload `domains.txt` (one domain per line) and `Master_with_includes.txt`.
- Fast streaming parser â€“ memoryâ€‘efficient for huge files.
- Progress bar shows processing status.
- Results displayed in a readâ€‘only textarea.
- **Copy to clipboard** button.
- **Download results** as `matches.txt`.
- Responsive, modern UI with light/dark mode.

## Local Usage
1. Clone the repository or copy the `extract_rp_lines` folder.
2. Open `index.html` in any modern browser (Chrome, Edge, Firefox).
3. Select the two files and click **Process**.
4. When finished, use **Copy** or **Download**.

## Deploy to Vercel (static site)
```bash
# In the folder containing index.html, styles.css, script.js, README.md
vercel --prod
```
Vercel will automatically serve the static files. The provided `vercel.json` ensures all routes fallback to `index.html`.

## Browser Compatibility
- Requires a recent browser with support for the Streams API, `TextDecoder`, and the Clipboard API.
- Tested on Chrome 128+, Edge 128+, Firefox 130+.

## License
MIT â€“ feel free to remix and improve.
