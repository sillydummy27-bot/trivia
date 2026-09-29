# Google Sheets response receiver

`Code.gs` is a Google Apps Script web app that records one completed trivia play per `playId` in a Google Sheet. The public page sends JSON as `text/plain` to avoid a browser CORS preflight. Its `no-cors` request has an opaque response, so the page cannot confirm whether Sheets accepted the play; check the sheet or Apps Script execution log when verifying a submission.

## Set up

1. Create a Google Sheet for responses and copy its ID from the URL between `/d/` and `/edit`.
2. At [script.google.com](https://script.google.com/), create a standalone Apps Script project. Replace its default code with all of `Code.gs` and save.
3. In **Project Settings → Script Properties**, add `SPREADSHEET_ID` with the Sheet ID as its value. Keep this property in Apps Script; do not put it in the public site.
4. In the Apps Script editor, select `setupResponsesSheet` and click **Run**. Authorize spreadsheet access when prompted. It creates a `Responses` tab with these columns: `play_id`, `received_at`, `completed_at`, `question_1`, `question_2`, `question_3`, `question_4`, `question_5`. Running it again preserves existing rows.
5. Select **Deploy → New deployment → Web app**. Set **Execute as: Me** and **Who has access: Anyone**, then deploy and authorize. Copy the deployment URL ending in `/exec`.
6. Put that `/exec` URL in the site's `config.js` endpoint setting and publish the static site. After changing `Code.gs`, use **Deploy → Manage deployments → Edit → New version → Deploy** to update the same `/exec` deployment.

The `/exec` URL is public and is not a secret or an authentication control. Anyone who knows it can submit data. The receiver limits request size, validates the expected shape, and ignores repeated `playId` values; those checks do not prevent forged submissions.

## Request and verification

The page posts a UTF-8 JSON body with `Content-Type: text/plain`:

```json
{
  "version": 1,
  "playId": "550e8400-e29b-41d4-a716-446655440000",
  "completedAt": "2026-09-29T10:00:00.000Z",
  "answers": {
    "question-1": "answer 1",
    "question-2": "answer 2",
    "question-3": "answer 3",
    "question-4": "answer 4",
    "question-5": "answer 5"
  }
}
```

Each answer may be a nonempty string, number, boolean, nonempty array, or nonempty object. Nested values may also be `null`. Each array or object may contain up to 30 entries, nesting may be at most four levels deep, and each string and serialized answer may be at most 2,000 characters. The full body must be at most 20,000 bytes. Arrays and objects are stored as JSON text in their answer column. The receiver appends a row only once for each `playId`; duplicate requests return `{"accepted":true,"duplicate":true}` to clients that can read the response. A browser request using `no-cors` cannot read it.

To verify the deployment, complete a play on the published page, then open the Sheet and inspect the newest `Responses` row. Check **Apps Script → Executions** if the row is absent. Opening the `/exec` URL directly performs only a health check (`{"ok":true}`); it never exposes stored answers.
