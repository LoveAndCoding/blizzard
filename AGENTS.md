# AGENTS.md

## Cursor Cloud specific instructions

This is a zero-dependency static website (vanilla HTML, CSS, JS). There is no build system, package manager, linter, test framework, or backend.

### Running the application

Serve the files with any static HTTP server:

```
python3 -m http.server 8080 --directory /workspace
```

Then open `http://localhost:8080/` in Chrome. The snowfall animation starts automatically on page load.

### Key files

- `index.html` — demo page
- `snowfall.js` — core animation engine (~670 lines, vanilla JS)
- `snowfall.css` — styles for the demo page

### Notes

- The only console warning is a missing `favicon.ico` (404) — this is harmless.
- The `Snowfall` object is exposed globally; you can call `Snowfall.pause()`, `Snowfall.play()`, `Snowfall.setOptions({...})`, and `Snowfall.resize()` from the console.
- There are no automated tests, linter, or build steps in this project.
