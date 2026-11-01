# API Neural Network — Local Setup & Developer Guide

## 1. System Requirements

- **Node.js**: `v18.0.0` or higher (`v20+` or `v22+` recommended).
- **Package Manager**: `npm` (v9+), `pnpm` (v8+), or `yarn`.
- **Operating System**: macOS, Linux, or Windows (tested on Windows 11 & Linux).
- **Modern Browser**: Chrome 110+, Edge 110+, Firefox 115+, or Safari 16+.

---

## 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/example/api-neural-explorer.git
cd api-neural-explorer
npm install
```

---

## 3. Environment Configuration

Copy the sample environment file:

```bash
cp .env.example .env
```

Available environment variables (optional — system works 100% offline out-of-the-box):

```env
# Optional External LLM Keys (system defaults to zero-key deterministic RetrievalOnly provider)
VITE_GEMINI_API_KEY=
VITE_OPENAI_API_KEY=
VITE_OLLAMA_ENDPOINT=http://localhost:11434
```

---

## 4. Development Server

Start Vite in development mode:

```bash
npm run dev
```

The application will launch at `http://localhost:5173/` (or the next available port).

---

## 5. Running Verification & Test Suites

The test suite is powered by **Vitest** with 100% genuine assertion checks (no fake math or hardcoded success):

```bash
# Run all tests once
npm test

# Run tests in watch mode
npx vitest

# Run specific suite
npx vitest run tests/e2ePipeline.test.ts
npx vitest run tests/mcpTools.test.ts
```

### Type Checking & Linting

```bash
# Run TypeScript typecheck without emitting files
npm run lint
```

---

## 6. Building for Production

Compile optimized production assets:

```bash
npm run build
```

The build output will be stored in `dist/`. To preview the production bundle locally:

```bash
npm run preview
```

