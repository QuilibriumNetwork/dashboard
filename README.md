# Quilibrium New Website

This is the new Quilibrium website built with [Vite](https://vitejs.dev/), [React](https://react.dev/), and [Tailwind CSS v3](https://tailwindcss.com/).

## Getting Started

First, run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) with your browser to see the result.

## Production Build

To build the project for production:

```bash
npm run build
```

This generates the static output into the `dist/` directory.

To preview the production build locally:

```bash
npm run preview
```

You can host the contents of the `dist/` folder on any static hosting provider (e.g. Vercel, Netlify, S3, etc.).

---

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

## Q Elements

This is a hidden page containing Quilibrium’s design foundations — including typography, buttons, icons, layout components, and other visual elements.
Go to [Q Elements](/elements)

---

## TO DO

- [DONE] Update the README with tutorials to insert/manage the various UI elements, or create a "hidden" website page with examples.
- QConsole page
- Builders page
- Node runners page



