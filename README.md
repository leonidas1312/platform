# Rastion Hub

Welcome to the Rastion repository, a collaborative platform for creating and sharing problems and optimizers (collectively known as "qubots"). This repo contains both the frontend application (built with Vite + React + Tailwind) and a Netlify Function for code execution. Below you’ll find:

- **Project structure** – How the code is organized.
- **Installation & local development** – Getting it running on your machine.
- **Netlify setup** – Using Netlify CLI for local dev or hosting.
- **Additional notes** – Supabase, environment, etc.

## Table of Contents
- [Directory Structure](#directory-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Local Development](#local-development)
- [Netlify CLI Usage](#netlify-cli-usage)
- [Project Scripts](#project-scripts)
- [Deploying](#deploying)
- [Additional Details](#additional-details)

## Directory Structure

Below is the high-level directory layout:

```
└── leonidas1312-rastion-hub/
    ├── README.md               # This file
    ├── components.json         # ShadCN UI config
    ├── eslint.config.js        # ESLint configuration
    ├── index.html              # Project entry point (for Vite)
    ├── netlify.toml            # Netlify configuration file
    ├── package.json            # NPM scripts and dependencies
    ├── postcss.config.js       # PostCSS + Tailwind config
    ├── requirements.txt        # Python dependencies for the netlify function
    ├── tailwind.config.ts      # Tailwind config
    ├── tsconfig.app.json       
    ├── tsconfig.json           
    ├── tsconfig.node.json      
    ├── vite.config.ts          # Vite config
    ├── netlify/                # Netlify-specific folder
    │   └── functions/
    │       └── run-code.tsx    # Netlify serverless function for running Python
    ├── public/                 # Static assets
    ├── src/                    # Main React application code
    │   ├── App.css
    │   ├── App.tsx
    │   ├── index.css
    │   ├── index.html
    │   ├── main.tsx
    │   ├── vite-env.d.ts
    │   ├── components/
    │   │   ├── (...individual React components...)
    │   │   ├── auth/
    │   │   │   └── GithubAuth.tsx
    │   │   └── ui/
    │   │       └── (...ShadCN UI components)
    │   ├── data/
    │   │   └── (...static or JSON data, category definitions, etc.)
    │   ├── hooks/
    │   │   └── (...custom React hooks...)
    │   ├── lib/
    │   │   └── (...utility libraries, supabase config, email config, etc.)
    │   ├── pages/
    │   │   └── (...top-level React pages, e.g. Landing, Docs, Repositories...)
    │   ├── types/
    │   │   └── (...TypeScript type definitions...)
    │   └── utils/
    │       └── (...helper utility files, e.g. repository filter logic...)
    └── supabase/
        ├── config.toml
        └── migrations/
            └── 20240309000000_create_initial_tables.sql
```

### Highlights

- **`src/`**: Main React application, broken down into:
  - `components/`: Reusable components (UI elements, custom modules).
  - `pages/`: Each high-level route (e.g. `/landing`, `/docs`, etc.).
  - `lib/`: Additional libraries/config (e.g. Supabase client).
  - `utils/`: Utility scripts (e.g. repository filters).
  - `data/`: JSON or array data (category definitions, static data, etc.).

- **Netlify**:
  - `netlify/functions/run-code.tsx`: Serverless function that spawns a Python process to run user code (used in the "online code runner" feature).

- **Supabase**:
  - `supabase/`: Config and migrations. If you deploy a Supabase instance, these migrations can be used to set up your database.

## Prerequisites

Before installing, make sure you have:

- **Node.js** (v16 or newer recommended)
- **NPM** or **Yarn** (NPM ships with Node)
- **Netlify CLI** (optional, if you want to run with `netlify dev`)

```bash
npm install -g netlify-cli
```

## Installation

Clone the repo and install dependencies:

```bash
git clone https://github.com/leonidas1312-rastion-hub.git
cd leonidas1312-rastion-hub
npm install
```

## Local Development

### Using NPM Scripts

- **Development server**:

```bash
npm run dev
```

- **Linting**:

```bash
npm run lint
```

- **Build**:

```bash
npm run build
```

- **Preview**:

```bash
npm run preview
```

### Using Netlify CLI

```bash
netlify dev
```

## Project Scripts

| Command          | Description |
|-----------------|-------------|
| `npm run dev`   | Start Vite dev server |
| `npm run build` | Build production bundle |
| `npm run lint`  | Run ESLint |
| `npm run preview` | Preview built app |

## Deploying

### Netlify

Configured with `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[functions]
  directory = "netlify/functions"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Other Hosting

You can deploy the `dist/` folder to any static hosting. The Netlify function needs a compatible serverless environment.

## Additional Details

- **Supabase**:
  - Uses environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
  - The `supabase/migrations` folder includes setup scripts.

- **Python requirements**:
  - The `requirements.txt` lists dependencies for the Netlify function.

- **ShadCN UI**:
  - `components.json` contains the config, and `src/components/ui` has UI components.

