# CleanIQ — AI-Powered Transaction Sanitizer & Diagnostics

> 🚀 **Live Demo:** [Insert Deployed Live Demo URL Here]

CleanIQ is a robust, full-stack, AI-powered spreadsheet and transaction ledger data validator. It bridges the gap between chaotic real-world inputs (like csv/xlsx) and pristine corporate datastores by executing automated, customizable compliance checkers alongside a server-side AI Diagnostic engine powered by the latest Gemini models.

---

## 🏗️ Core Architecture Overview

CleanIQ uses a modern **React (Vite) + Express (TS)** full-stack architecture to process datasets safely and preserve sensitive credential boundaries (your API keys are securely routed server-side).

```
 ┌──────────────────────┐        ┌──────────────────────┐
 │   CleanIQ React UI   │───────>│   Express Backend    │
 │  (Uploads / Panels)  │<───────│  (Gemini API Proxy)  │
 └──────────────────────┘        └──────────────────────┘
```

1. **Upload & Rules Ingestion Tab:** Configures real-time phone code lengths by country, parses file headers via PapaParse, and stores rows locally to run fast, client-side diagnostics.
2. **Data Integrity Diagnostics Tab:** A custom interactive dashboard illustrating overall file success rate, column error distributions (visualized with D3/Recharts), and searchable transaction validation logs.
3. **CleanIQ AI Co-Pilot Tab:** A safe sandbox chat enabling custom conversational queries across your loaded spreadsheet columns. Includes auto-fixes, dynamic anomaly tracking, and column schema diagnostics.
4. **Interactive Manual Tab (How to Use):** Easy step-by-step documentation detailing regional formatting formats and automated heuristics.
5. **Split & Export Package Tab:** Downloads standard compliance CSVs featuring audit tags, or exports multiple partitions inside a secure `.zip` structure.

---

## 🛠️ Tech Stack & Key Integrations

- **UI Framework:** React with Vite & TypeScript
- **Styling:** Tailwind CSS with modern display typography (Space Grotesk, Inter, JetBrains Mono)
- **Visualizations:** `recharts` for error metrics, and custom CSS grids
- **Parsing Engine:** `papaparse` for greedy stream processing of uploaded CSV data
- **AI Core:** server-loaded `@google/genai` model endpoint
- **Icons:** `lucide-react`
- **Actions/Deployment CI:** Custom GitHub Actions with GitHub Pages configurations

---

## 🚦 Getting Started

### 1. Prerequisites
Ensure you have **Node.js (v18+)** and npm installed on your workspace.

### 2. Environment Configurations
Prepare your environment variables by copying `.env.example` to `.env`:
```bash
cp .env.example .env
```
Declare your secret keys inside `.env` safely:
```env
# Server-side API Secret (Do NOT prefix with VITE_ to prevent leak)
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Installation
Install all applet packages:
```bash
npm install
```

### 4. Running the Development Sandbox
Boot up the customized full-stack server (binds on port `3000` internally):
```bash
npm run dev
```

### 5. Running Linter & Production Build
Validate TypeScript compile configurations & build targets:
```bash
# Lint the workspace
npm run lint

# Compile Vite client assets & bundle backend entry points with esbuild
npm run build

# Start production server
npm run start
```

---

## 📦 Automated Workflows

Inside `.github/workflows/deploy.yml`, an automated CI workflow is configured to automatically test and deploy clean UI artifacts directly to **GitHub Pages** on every push or pull-request target merged into your `main` branch.

---

## 🛡️ License
Distributed under the MIT License. See `LICENSE` for more information.
