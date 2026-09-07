# Bryan James portfolio: standalone Vercel source

This folder contains the complete Next.js application and all assets required to reproduce the portfolio. No ChatGPT Sites account, Cloudflare Worker, Vinext, database, API key or external font CDN is required.

## Local setup

Use Node.js 22.13 or later.

```sh
npm ci
npm run dev
```

Open http://localhost:3000.

For a production build and local production server:

```sh
npm run build
npm start
```

Type-check independently with `npm run typecheck`.

## Deploy to Vercel

1. Extract this ZIP. Use the `bryan-portfolio-vercel` folder as the project root, where package.json lives.
2. Push this folder to your own GitHub repository.
3. Import that repository into Vercel. Select the Next.js framework preset. The included vercel.json sets `npm ci` and `npm run build`.
4. Leave the output directory at the Next.js default. This standalone export uses normal Next.js output, not the earlier static `out` configuration.
5. Set NEXT_PUBLIC_SITE_URL to your final origin, for example https://bryansamueljames.vercel.app. This controls Open Graph URLs and the sitemap.
6. Deploy. To retain bryansamueljames.vercel.app, connect the repository to the existing Vercel project that owns that address, or assign it in that project's domain settings.

## Files and customization

- app/page.tsx renders components/portfolio.tsx, which contains the entire page, terminal and demos.
- app/layout.tsx contains metadata, the initial theme script and local font loading.
- app/globals.css contains the full light/dark styling, responsive rules, Tailwind v4 theme and animations.
- tailwind.config.ts is explicitly loaded by the stylesheet. Tailwind v4 theme tokens remain in CSS.
- data/projects.ts contains all six typed project records.
- data/patent-demo.json and lib/search.ts provide ten representative claims and client-side TF-IDF cosine similarity.
- data/pricing-demo.json holds only the supplied pricing summary, without invented observations.
- public/ contains the actual font binaries, favicon and social preview image. Keep these files in place.

## Missing content retained from the original brief

The two OPS `[fill in]` placeholders remain exactly as supplied. Replace them with your model/method, result and actual stack.

No resume PDF was provided. The /resume route currently lets visitors request a copy by email. Add your PDF at public/resume.pdf and update the resume links and terminal link map in components/portfolio.tsx when ready.

The pricing card shows the supplied approximate 99% Steam spread and qualitative Amazon negative control. Original country-level observations were not supplied; they must be added to complete a regional-price comparison.

## Verification

The standalone production build and strict TypeScript check are run before delivery. Prior browser checks covered terminal submission, unknown commands, audience DOM reordering, patent search, schema switching and theme switching. The four requested device widths and Lighthouse scores have not been measured. No claims of perfect accessibility or performance scores are made.

The export preserves the original portfolio's content, styles and behavior. Only packaging, unused platform dependencies and framework configuration have been changed for self-deployment.
