# franco-may.com Source Code

This is the source code for [franco-may.com](https://franco-may.com), a personal blog and portfolio website built with Next.js and Mantine.

## Live Site

The live version of this code is running at: **https://franco-may.com**

## Customization

Feel free to fork this repository and customize it to your liking! You can:

- Add your own blog posts in the `posts/` directory (posts use HTML strings with metadata)
- Modify the site configuration in `utils/constants.tsx`
- Update the theme and styling to match your preferences
- Add new features and components as needed

## Features

This project comes with the following features:

- [PostCSS](https://postcss.org/) with [mantine-postcss-preset](https://mantine.dev/styles/postcss-preset)
- [TypeScript](https://www.typescriptlang.org/)
- [Storybook](https://storybook.js.org/) with dark mode support and Mantine theme integration
- [Jest](https://jestjs.io/) setup with [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- ESLint setup with [eslint-config-mantine](https://github.com/mantinedev/eslint-config-mantine)
- [Yarn](https://yarnpkg.com/) package manager with node_modules linker
- [Prettier](https://prettier.io/) code formatting with auto-format on save
- Dark/Light mode toggle with smooth transitions
- Blog system with dynamic routing, centralized post management, breadcrumb navigation, and HTML-based content rendering
- Enhanced RSS feed generation at `/rss.xml` with Dublin Core metadata, Media RSS support, Atom timestamps, and featured images
- Contact form with email submission via SMTP (nodemailer)
- Form validation using Zod schemas and react-hook-form
- Interactive archaeological map with Leaflet integration, location tracking, and detailed site information

## Pages

The application includes the following pages:

- **Home** (`/`) - Main landing page with personal introduction and image
- **Blog** (`/blog`) - Blog listing page with articles organized by year, sorted chronologically with newest posts first
- **Blog Articles** (`/blog/[slug]`) - Individual blog articles with dynamic routing (e.g., `/blog/ai-and-the-myth-of-artificial-desire`, `/blog/why-is-there-something-rather-than-nothing`)
- **Contact** (`/contact`) - Functional contact form with email submission, form validation, and rate limiting
- **Archaeological Map** (`/fornlamning`) - Interactive map showcasing archaeological sites in Sweden with location tracking and detailed site information

## npm scripts

### Build and dev scripts

- `dev` – start dev server
- `build` – bundle application for production
- `analyze` – analyzes application bundle with [@next/bundle-analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)

### Testing scripts

- `typecheck` – checks TypeScript types
- `lint` – runs ESLint
- `prettier:check` – checks files with Prettier
- `jest` – runs jest tests
- `jest:watch` – starts jest watch
- `test` – runs `jest`, `prettier:check`, `lint` and `typecheck` scripts

### Other scripts

- `storybook` – starts storybook dev server
- `storybook:build` – build production storybook bundle to `storybook-static`
- `prettier:write` – formats all files with Prettier

## Next.js Compatibility

This project is compatible with Next.js 15. Key compatibility notes:

- **Dynamic Route Parameters**: In Next.js 15, route parameters (`params`) are now Promises that must be awaited. See `app/blog/[slug]/page.tsx` for an example implementation.

## Environment Setup

### Contact Form Configuration

To enable the contact form functionality, you'll need to set up SMTP credentials. Copy the `.env.example` file to `.env.local` and configure your email settings:

```bash
cp .env.example .env.local
```

For Gmail users:

1. Enable 2-factor authentication on your Google account
2. Generate an App Password (not your regular password)
3. Use that App Password as `SMTP_PASS` in your `.env.local` file

## Development Setup

This project includes VS Code settings for automatic code formatting on save. Make sure to install the Prettier extension for the best development experience.
