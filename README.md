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


## How it works

1. When you open a workspace, the extension reads your git diff automatically
2. It counts additions, deletions, files changed, commits
3. It infers labels from your branch name (feat/, fix/, docs/...)
4. It sends all this to your FastAPI backend
5. The LightGBM model predicts merge time and returns it
6. The sidebar updates with the prediction

It re-runs automatically every time you save a file.

