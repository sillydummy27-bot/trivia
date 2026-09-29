# A little chemistry

A seven-screen mini game built with plain HTML, CSS, and JavaScript. Designed for GitHub Pages: no framework, package installation, compilation, or server routes.

## Preview

Run `python3 -m http.server 8000` from this folder, then visit `http://localhost:8000`. Use an HTTP server; opening `index.html` as a local file will block module and fragment loading.

To check a repository subpath, run the server from this folder’s parent and visit `http://localhost:8000/trivia/`.

## Publish on GitHub Pages

1. Commit and push these files to the repository’s `main` branch.
2. In GitHub, open **Settings → Pages → Build and deployment**.
3. Select **Deploy from a branch**, choose **main** and **/ (root)**, then Save.
4. Open the published URL displayed by GitHub, normally `https://YOUR-USERNAME.github.io/trivia/`.

`.nojekyll` keeps this a plain static site. All assets use relative paths, including dynamic module and HTML fragment loading, so repository URLs and custom domains both work. Only `index.html` is an entrypoint; individual screen fragments are not standalone pages. Refreshing restarts at the intro.

## Edit one screen

Every folder in `screens/` has three independent files:

| File | What to change |
| --- | --- |
| `index.html` | Prompt, options, button labels, and layout |
| `style.css` | This screen’s appearance, using its unique class prefix |
| `script.js` | Validation, reactions, animation, and answer value |

The folders are `intro`, `question-1` through `question-5`, and `done`. Q1 chooses the game theme, Q2 is multiple choice, Q3 is a two-round True or Lie activity, Q4 is a coming-soon placeholder, and Q5 is a hold-or-tap heart challenge. These are editable examples.

Each script exports `mount(container, context)` and returns a cleanup function. Query elements inside `container`; remove event listeners and cancel timers in cleanup. `context.complete(answer)` saves this page’s JSON-compatible answer and advances. The intro uses `context.start()`, and done uses `context.replay()`. The done page can read `context.answers`.

`app.js` controls ordering, progress, and transitions. `styles.css` defines shared typography, buttons, and theme tokens; `theme.js` derives the selected colors and runs the WebGL color reveal with a CSS fallback. Keep individual selectors prefixed (`q1-`, `q2-`, etc.) to avoid affecting other pages. If changing Q1 option values, update the optional color-label mapping in the done script, or remove that personalized sentence.

Q1 records `pink`, `red`, `blue`, or a custom six-digit hex color. The theme lasts for the current playthrough and resets on replay or reload. Q3 records an object with `aboutHer` and `aboutMe` choices, each keyed by statement ID with `T` or `L` values. Q4 records `coming-soon` until it is replaced, preserving the five-step response format.

## Connect Google Sheets

Follow [backend setup](backend/README.md), then paste your Apps Script `/exec` URL into `submissionUrl` in `config.js` and republish. The endpoint URL is public. The spreadsheet ID lives only in Apps Script’s Script Properties.

The app sends one response after all five questions; partial games are not sent. Submission runs in the background, so play never waits for Sheets. An empty endpoint leaves collection inactive and prints a developer-console message.

Completed submissions are kept in browser local storage for up to seven days. Since Apps Script cross-origin POST responses are opaque, the app treats delivery as unconfirmed and retries on later visits, up to three total attempts. Apps Script deduplicates by play ID. Entries expire during a later visit; closing the page or clearing browser storage can prevent retries. Storage-unavailable browsers use memory only. This is best-effort delivery, not guaranteed delivery; verify real writes in your sheet.

There is no browser login, analytics SDK, or frontend secret. The public endpoint accepts submissions from anyone who knows its URL and uses your Apps Script quotas. Do not put private credentials in this repository.

## Fonts and accessibility

DM Sans and IBM Plex Mono are bundled locally with their SIL Open Font License files in `assets/fonts/`. Fonts were sourced from Google Fonts. Controls support keyboard input, and animations respect `prefers-reduced-motion`. The final challenge offers a three-tap alternative to holding.

## Manual acceptance check

Play all five steps under the repository subpath, including each Q1 preset and the custom color picker, one Q2 selection, both Q3 True or Lie rounds and their feedback, the Q4 placeholder, and the tap alternative. Confirm the done screen and replay. Check a narrow viewport, reduced motion, and a browser without WebGL. After connecting Apps Script, complete a game, verify one row in `Responses`, then reload and confirm retries do not add duplicate rows. The included Apps Script is not deployed automatically by GitHub Pages.
