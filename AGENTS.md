# TCM 3D project instructions

- `source/` is the editable React application and `source/index.html` is the only HTML source template.
- `npm run dev` serves the `source` Vite root. `npm run build` writes the deployable static site to `dist/`, including `dist/index.html`, bundled assets, and the self-hosted `models/`, `draco/`, and `hdri/` directories.
- The repository-root `index.html`, `static/`, and `asset-manifest.json` are the current GitHub Pages snapshot. Do not edit them by hand or overwrite them from a build. Pages publication must consume `dist/` through an explicitly reviewed deployment workflow.
- Preserve the existing model file, textures, Draco decoders, HDRI, acupoint coordinates, model transform, and camera定位 logic. Do not patch compressed JavaScript or hand-edit GLB binary data.
- Keep runtime asset references relative so the site works at a repository subpath and on a custom domain.
- Preserve the medical disclaimer, boot loading/error fallback, and dietary knowledge flow when changing the HTML shell.
- Before proposing a release, inspect the diff, run the relevant tests, and report any browser or deployment checks that were not run.
