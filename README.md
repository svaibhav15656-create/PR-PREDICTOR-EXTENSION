# PR Review Time Predictor — VS Code Extension

Predicts how long your current branch's changes will take to be reviewed and merged,
powered by a LightGBM model trained on 1,500+ real GitHub PRs.

The prediction appears instantly in the VS Code sidebar — no browser, no GitHub, no copy-pasting.

---

## What it shows

- Predicted merge time in hours
- Category: Fast / Same day / 2–3 days / About a week / Long review
- Confidence interval (lower–upper bound)
- Top signals driving the prediction (lines changed, day of week, author history...)
- Git stats for your current branch (+additions / −deletions / files / commits)
- One-click copy of a formatted PR comment

---

## Setup

### Step 1 — Make sure your API is running

The extension calls your FastAPI backend. Start it locally:

```bash
cd your-pr-review-predictor-folder
uvicorn src.api:app --reload --port 8000
```

Or deploy it to Railway and use the public URL.

### Step 2 — Install the extension

**Option A — Install from VSIX (local build):**
```bash
npm install
npm run compile
npx vsce package
# Then in VS Code: Ctrl+Shift+P → "Install from VSIX" → select the .vsix file
```

**Option B — Install from VS Code Marketplace:**
Search "PR Review Time Predictor" in the Extensions panel.

### Step 3 — Configure API URL

Press `Ctrl+Shift+P` → type `PR Predictor: Set API URL`

- Local:   `http://localhost:8000`
- Railway: `https://your-app.railway.app`

---

## How it works

1. When you open a workspace, the extension reads your git diff automatically
2. It counts additions, deletions, files changed, commits
3. It infers labels from your branch name (feat/, fix/, docs/...)
4. It sends all this to your FastAPI backend
5. The LightGBM model predicts merge time and returns it
6. The sidebar updates with the prediction

It re-runs automatically every time you save a file.

---

## Publishing to VS Code Marketplace

```bash
# 1. Create a publisher at https://marketplace.visualstudio.com/manage
# 2. Install vsce
npm install -g @vscode/vsce

# 3. Login
vsce login your-publisher-name

# 4. Package and publish
vsce publish
```

Your extension gets a public URL like:
`https://marketplace.visualstudio.com/items?itemName=your-publisher-name.pr-review-predictor`

---

## Project structure

```
pr-predictor-extension/
├── src/
│   ├── extension.ts       ← entry point, command registration
│   ├── sidebarProvider.ts ← webview UI
│   ├── apiClient.ts       ← calls FastAPI backend
│   └── gitHelper.ts       ← reads git diff from workspace
├── media/
│   └── icon.svg
├── package.json           ← extension manifest
└── tsconfig.json
```

---

## Resume bullet

> "Built and published a VS Code extension (TypeScript) that reads live git diff stats
> and calls a FastAPI + LightGBM backend to predict PR review time directly in the editor sidebar.
> Published to VS Code Marketplace."
