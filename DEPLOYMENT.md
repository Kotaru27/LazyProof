# LazyProof — GitHub Pages

This repository contains a static, browser-local Word QRE vs Confirmit Survey Definition XML/ZIP comparison tool. No backend or secrets are required.

## Public site

Expected Pages URL: https://kotaru27.github.io/LazyProof/

To activate publishing in GitHub if Pages is not yet enabled: **Settings → Pages → Build and deployment → Source: GitHub Actions**. The included deployment workflow runs on `main` and publishes the static site.

## Security / limitations

Study documents are processed inside the browser and are not sent to a server by application code. GitHub Pages receives ordinary requests for the site's static HTML, JS, CSS, and assets. No user study files have been committed. This is a technical preview, not validated end-to-end survey QA: see VERIFICATION.md.