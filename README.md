# Quilibrium Dashboard

This is the new Quilibrium Dashboard built with [Vite](https://vitejs.dev/), [React](https://react.dev/), and [Tailwind CSS v3](https://tailwindcss.com/).

## Getting Started

First, run the development server:

```bash
yarn install
yarn dev
```

Open [http://localhost:5173](http://localhost:5173) with your browser to see the result.

## Production Build

To build the project for production:

```bash
yarn build
```

This generates the static output into the `dist/` directory.

To preview the production build locally:

```bash
yarn preview
```

You can host the contents of the `dist/` folder on any static hosting provider (e.g. Vercel, Netlify, S3, etc.).

---

### Deployment to `gh-pages` branch
Once you have your `dist/` folder generated, checkout the `gh-pages` branch.

```cli
git checkout gh-pages
```

then copy the `dist/assets/` directoy to the `assets` folder, and the `dist/index.html` file to the root `index.html`.

When doing the commit you should see the `index.html` file changing the random `index-XXXXXX.js` and `index-XXXXXX.css` script/link tags.

## Framework & Build Setup

| Area              | Current Site                             | New Homepage                              |
|-------------------|-------------------------------------------|-------------------------------------------|
| **Framework**     | CRA (`react-scripts`, `react-app-rewired`) | **React + Vite**                          |
| **Routing**       | React Router (`react-router-dom`)         | React Router (`react-router-dom`)         |
| **Index.html**    | Present                                   | Present (`index.html` at root)            |
| **Build Tool**    | Webpack via CRA                           | **Vite**                                   |


## Tailwind CSS

| Area                  | Current Site                       | New Homepage                      |
|------------------------|------------------------------------|-----------------------------------|
| **Version**            | Tailwind v3                        | Tailwind v3                       |
| **Global Styles**      | `@import "tailwindcss";` in CSS    | Same usage + custom utilities     |

---


