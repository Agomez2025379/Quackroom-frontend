# QuackRoom frontend

This folder is the deployable Angular application. The original Figma export is
kept separately in `../QuackRoom UI_UX Structure/` as a visual reference.

## Commands

- `pnpm install` installs dependencies from `pnpm-lock.yaml`.
- `pnpm dev` runs the Angular development server at `http://localhost:4200`.
- `pnpm build` runs the production build and writes deployment API configuration.

## Architecture

- Angular standalone components and Angular Router are used throughout `src/`.
- `src/app/core/api.service.ts` contains typed calls to the backend REST API.
- The auth interceptor reads the session token and adds the Bearer header.
- Use the existing shared design tokens and classes in `src/index.css`.
- API base URL is loaded from `public/runtime-config.js`; deployment builds
  generate it from `QUACKROOM_API_URL`.

The frontend must never contain Supabase secret keys or JWT signing secrets.
