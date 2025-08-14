# Mantine Next.js template

This is a template for [Next.js](https://nextjs.org/) app router + [Mantine](https://mantine.dev/).
If you want to use pages router instead, see [next-pages-template](https://github.com/mantinedev/next-pages-template).

## Features

This template comes with the following features:

- [PostCSS](https://postcss.org/) with [mantine-postcss-preset](https://mantine.dev/styles/postcss-preset)
- [TypeScript](https://www.typescriptlang.org/)
- [Storybook](https://storybook.js.org/) with dark mode support and Mantine theme integration
- [Jest](https://jestjs.io/) setup with [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- ESLint setup with [eslint-config-mantine](https://github.com/mantinedev/eslint-config-mantine)
- [Yarn](https://yarnpkg.com/) package manager with node_modules linker
- [Prettier](https://prettier.io/) code formatting with auto-format on save
- Responsive AppShell layout with navigation components
- Dark/Light mode toggle with smooth transitions
- Custom CSS animations
- Blog system with dynamic routing, centralized post management, and breadcrumb navigation
- Mantine Typography component integration for consistent text styling

## Pages

The application includes the following pages:

- **Home** (`/`) - Main landing page
- **Blog** (`/blog`) - Blog listing page with article links
- **Blog Articles** (`/blog/[slug]`) - Individual blog articles with dynamic routing (e.g., `/blog/ia-goals`)
- **Contact** (`/contact`) - Contact page placeholder

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

## Project Structure

The project includes a responsive AppShell layout with:

- `AppShellWrapper` - Main layout component with responsive navigation
- `Header` - Top navigation bar with burger menu for mobile and color scheme toggle
- `Navbar` - Side navigation with navigation links
- `ColorSchemeIcon` - Dark/Light mode toggle component with loading state
- Navigation constants in `app/utils/constants.ts`

### Key Components

- **AppShellWrapper**: Provides the main layout structure with header and sidebar
- **ColorSchemeIcon**: Replaces the old ColorSchemeToggle with a more integrated icon-based toggle
- **Header**: Contains the app title, mobile menu toggle, and color scheme icon
- **Navbar**: Side navigation that collapses on mobile devices
- **Breadcrumbs**: Dynamic navigation component that shows current page hierarchy
- **BlogLayout**: Dedicated layout for blog pages with breadcrumb navigation
- **Posts System**: Centralized post management with TypeScript types and dynamic content rendering

## Development Setup

This project includes VS Code settings for automatic code formatting on save. Make sure to install the Prettier extension for the best development experience.
