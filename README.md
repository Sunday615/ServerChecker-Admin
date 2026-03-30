# Server Check Portal

Custom Nuxt web portal for the Python `server-checker` project.

This app is focused on:

- showing run history from MySQL
- showing latest service and web health
- opening generated HTML and PNG report artifacts
- triggering the Python checker from the portal

## Main Structure

- `app/pages/` contains the dashboard screens
- `server/api/` contains the portal-facing API routes
- `server/utils/mysql.ts` handles MySQL access
- `server/utils/checker.ts` handles manual run triggering and runtime state

## Environment

Create `.env` in the project root.

For macOS/Linux, start from [`.env.example`](/Users/macbookpro/desktop/ServerCheck/.env.example).

For Windows, start from [`.env.windows.example`](/Users/macbookpro/desktop/ServerCheck/.env.windows.example).

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run typecheck
npm run build
```

## Notes

- The portal reads data from MySQL and does not connect to the database from the browser directly.
- The `Run Check` button triggers the existing Python project, then the UI refreshes from MySQL-backed data.
