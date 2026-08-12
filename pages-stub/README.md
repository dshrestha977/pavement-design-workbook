# Pages stub

The app itself is **not** served from Cloudflare Pages. It is served by the
`paveworks` Worker in `../ndacs-auth`, which binds `../pavement-design-workbook/dist`
as its assets and puts the NDACS sign-in gate in front of every request:

```bash
npm run build                                          # in this repo
cd ../ndacs-auth && npx wrangler deploy -c wrangler.paveworks.jsonc
```

The `pavement-design-workbook` Pages project still exists because
`paveworks.ndacs.com.np` resolves through its old proxied CNAME. This folder is
what that project should serve: a redirect stub pointing at the gated domain, so
the app is never reachable unauthenticated at `pavement-design-workbook.pages.dev`.

Redeploy the stub (never `dist/`) with:

```bash
npx wrangler pages deploy pages-stub --project-name=pavement-design-workbook --branch=main
```

`_redirects` lives here rather than in `public/`: shipped inside `dist/`, Workers
Assets rejects the SPA rule as an infinite-loop redirect and the Worker deploy
fails. The Worker does SPA routing itself via `not_found_handling`.
