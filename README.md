# QuackRoom frontend

Angular standalone SPA that uses the existing QuackRoom visual design and the
REST API deployed at `https://quackroom-backend.vercel.app/api`.

## Local development

1. Install Node.js 24.15 or later in the Node 24 line and pnpm 11.
2. Install dependencies and start the backend in one terminal:

   ```sh
   cd backend
   pnpm install
   pnpm dev
   ```

3. Start the frontend in another terminal:

   ```sh
   cd frontend
   pnpm install
   pnpm dev
   ```

The Angular dev server runs at `http://localhost:4200`. Its development
configuration calls `http://localhost:3000/api`; set the backend `FRONTEND_URL`
to `http://localhost:4200` for local CORS.

## Deploy to Vercel

Create a Vercel project from this repository and set **Root Directory** to
`frontend`. Vercel reads `vercel.json`, installs the pnpm dependencies, runs
`pnpm build`, and serves `dist/quackroom-frontend/browser`. The `/api/*` rewrite
proxies API requests to `https://quackroom-backend.vercel.app/api/*` on Vercel,
so browser API traffic is same-origin and does not depend on CORS settings or
per-deployment preview domains. A second rewrite sends deep links such as
`/recursos` back to Angular's `index.html`.

The local build setting lives in the real `frontend/.env` file, which is
ignored by Git. Vercel cannot read that local ignored file, so add the same
variable in the Vercel project's Environment Variables (Production, Preview,
and Development as appropriate):

| Name | Value |
| --- | --- |
| `QUACKROOM_API_URL` | `/api` |

Vercel's environment value takes precedence over the local `.env` setting. The
build writes the selected value into a public runtime configuration file. It
is a public API path, not a secret. Never add Supabase keys, the JWT signing
secret, or other backend secrets to this project.

The Vercel proxy avoids browser CORS for the deployed frontend. For requests
made directly to the backend (such as local development), set the backend
`FRONTEND_URL` to the frontend origin (`http://localhost:4200` locally or the
production origin when bypassing the proxy).

## API integration

`ApiService` uses the existing `/api/auth`, `/api/citas`,
`/api/diario-emocional`, `/api/recursos`, `/api/centros-atencion`,
`/api/usuarios`, and `/api/dashboard` endpoints. Login tokens are kept in
`sessionStorage` and attached as `Authorization: Bearer <token>` by the HTTP
interceptor. The app guard requires a login for the signed-in workspace.
The signup form creates beneficiary accounts (`id_rol: 2`, matching the
repository's SQL seed); professional accounts require a separate professional
profile and are not offered through the public signup form.

The API currently has no public professional-directory endpoint. The
appointments view therefore displays the signed-in user's real appointments
and does not invent professionals or offer a misleading booking selector.

Administrators can open **Resumen administrativo**, **Gestionar usuarios**, and
**Gestionar organizaciones** from the sidebar. User management uses the
administrator-only `GET`, `POST`, `PUT`, and `PATCH /api/usuarios` endpoints;
creating a professional also creates the professional profile. Organization
management uses the administrator-only create, update, and delete operations
under `/api/centros-atencion`.
