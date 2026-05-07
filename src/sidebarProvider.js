"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrPredictorSidebarProvider = void 0;
const vscode = __importStar(require("vscode"));
class PrPredictorSidebarProvider {
    constructor(extensionUri) {
        this._extensionUri = extensionUri;
    }
    resolveWebviewView(webviewView, _context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };
        webviewView.webview.html = this._getInitialHtml();
        // Handle messages from webview
        webviewView.webview.onDidReceiveMessage(async (msg) => {
            switch (msg.command) {
                case 'predict':
                    vscode.commands.executeCommand('prPredictor.predict');
                    break;
                case 'setApiUrl':
                    vscode.commands.executeCommand('prPredictor.setApiUrl');
                    break;
                case 'copyComment': {
                    await vscode.env.clipboard.writeText(msg.text);
                    vscode.window.showInformationMessage('Prediction copied to clipboard!');
                    break;
                }
                case 'openSettings':
                    vscode.commands.executeCommand('workbench.action.openSettings', 'prPredictor');
                    break;
            }
        });
    }
    setLoading(loading) {
        if (this._view) {
            this._view.webview.postMessage({ type: 'loading', loading });
        }
    }
    setError(message) {
        if (this._view) {
            this._view.webview.postMessage({ type: 'error', message });
        }
    }
    setPrediction(prediction, gitInfo) {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'prediction',
                prediction,
                gitInfo,
            });
        }
    }
    _getInitialHtml() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: var(--vscode-font-family);
    font-size: 13px;
    color: var(--vscode-foreground);
    background: var(--vscode-sideBar-background);
    padding: 0;
    overflow-x: hidden;
  }

  .header {
    padding: 12px 14px 10px;
    border-bottom: 1px solid var(--vscode-sideBarSectionHeader-border, #3c3c3c);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: var(--vscode-sideBarTitle-foreground);
    opacity: 0.8;
  }

  .icon-btn {
    background: none;
    border: none;
    color: var(--vscode-icon-foreground);
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 3px;
    font-size: 14px;
    opacity: 0.7;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .icon-btn:hover { opacity: 1; background: var(--vscode-toolbar-hoverBackground); }

  .content { padding: 12px 14px; }

  /* ── States ── */
  #state-idle, #state-loading, #state-error, #state-result {
    display: none;
  }
  #state-idle    { display: block; }

  .idle-icon { font-size: 32px; text-align: center; margin: 20px 0 10px; opacity: 0.4; }
  .idle-text { text-align: center; color: var(--vscode-descriptionForeground); font-size: 12px; line-height: 1.6; margin-bottom: 16px; }

  .btn-primary {
    width: 100%;
    padding: 7px 12px;
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none;
    border-radius: 3px;
    font-size: 12px;
    cursor: pointer;
    font-family: var(--vscode-font-family);
    margin-bottom: 6px;
  }
  .btn-primary:hover { background: var(--vscode-button-hoverBackground); }

  .btn-secondary {
    width: 100%;
    padding: 6px 12px;
    background: transparent;
    color: var(--vscode-descriptionForeground);
    border: 1px solid var(--vscode-button-secondaryBackground, #3c3c3c);
    border-radius: 3px;
    font-size: 11px;
    cursor: pointer;
    font-family: var(--vscode-font-family);
  }
  .btn-secondary:hover { background: var(--vscode-button-secondaryHoverBackground); }

  /* Loading */
  .loading-wrap { text-align: center; padding: 30px 0; }
  .spinner {
    width: 24px; height: 24px;
    border: 2px solid var(--vscode-progressBar-background, #007acc);
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin .7s linear infinite;
    margin: 0 auto 12px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-text { font-size: 12px; color: var(--vscode-descriptionForeground); }

  /* Error */
  .error-box {
    background: var(--vscode-inputValidation-errorBackground, #5a1d1d);
    border: 1px solid var(--vscode-inputValidation-errorBorder, #be1100);
    border-radius: 4px;
    padding: 10px 12px;
    font-size: 12px;
    line-height: 1.6;
    color: var(--vscode-errorForeground, #f48771);
    white-space: pre-wrap;
    margin-bottom: 10px;
  }

  /* Result */
  .branch-pill {
    display: inline-block;
    background: var(--vscode-badge-background);
    color: var(--vscode-badge-foreground);
    font-size: 10px;
    padding: 2px 8px;
    border-radius: 20px;
    margin-bottom: 10px;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .main-metric {
    background: var(--vscode-editor-background);
    border: 1px solid var(--vscode-widget-border, #3c3c3c);
    border-radius: 6px;
    padding: 12px 14px;
    margin-bottom: 8px;
    text-align: center;
  }
  .main-hours {
    font-size: 28px;
    font-weight: 300;
    color: var(--vscode-textLink-foreground, #4ec9b0);
    line-height: 1;
    margin-bottom: 2px;
  }
  .main-category {
    font-size: 12px;
    color: var(--vscode-descriptionForeground);
  }

  .grid2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    margin-bottom: 10px;
  }
  .mini-card {
    background: var(--vscode-editor-background);
    border: 1px solid var(--vscode-widget-border, #3c3c3c);
    border-radius: 4px;
    padding: 8px 10px;
  }
  .mini-label {
    font-size: 10px;
    color: var(--vscode-descriptionForeground);
    text-transform: uppercase;
    letter-spacing: .04em;
    margin-bottom: 3px;
  }
  .mini-value {
    font-size: 14px;
    font-weight: 500;
    color: var(--vscode-foreground);
  }

  /* Progress bar */
  .progress-wrap { margin-bottom: 12px; }
  .progress-labels {
    display: flex;
    justify-content: space-between;
    font-size: 9px;
    color: var(--vscode-descriptionForeground);
    margin-bottom: 3px;
    opacity: 0.7;
  }
  .progress-track {
    height: 3px;
    background: var(--vscode-widget-border, #3c3c3c);
    border-radius: 2px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: var(--vscode-progressBar-background, #007acc);
    border-radius: 2px;
    transition: width .5s ease;
  }

  /* Signals */
  .section-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: .06em;
    color: var(--vscode-descriptionForeground);
    margin-bottom: 5px;
    opacity: 0.7;
  }
  .signals-list { margin-bottom: 10px; }
  .signal-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 0;
    font-size: 12px;
    border-bottom: 1px solid var(--vscode-widget-border, #2d2d2d);
    color: var(--vscode-foreground);
    opacity: 0.85;
  }
  .signal-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--vscode-textLink-foreground, #4ec9b0);
    flex-shrink: 0;
  }

  /* Git stats */
  .git-stats {
    display: flex;
    gap: 8px;
    font-size: 11px;
    margin-bottom: 10px;
    flex-wrap: wrap;
  }
  .stat-chip {
    background: var(--vscode-badge-background);
    color: var(--vscode-badge-foreground);
    padding: 2px 7px;
    border-radius: 3px;
    font-size: 10px;
  }
  .stat-chip.add { background: rgba(78,201,176,.15); color: #4ec9b0; }
  .stat-chip.del { background: rgba(244,71,71,.15);  color: #f47171; }

  .mae-note {
    font-size: 10px;
    color: var(--vscode-descriptionForeground);
    opacity: 0.6;
    margin-top: 8px;
    text-align: center;
  }

  .action-row { display: flex; gap: 6px; margin-top: 8px; }
  .action-row button { flex: 1; }
</style>
</head>
<body>

<div class="header">
  <span class="header-title">PR Predictor</span>
  <div style="display:flex;gap:2px">
    <button class="icon-btn" onclick="send('predict')" title="Predict now">⟳</button>
    <button class="icon-btn" onclick="send('openSettings')" title="Settings">⚙</button>
  </div>
</div>

<div class="content">

  <!-- Idle state -->
  <div id="state-idle">
    <div class="idle-icon">⏱</div>
    <p class="idle-text">Predict how long your current branch changes will take to be reviewed and merged.</p>
    <button class="btn-primary" onclick="send('predict')">Predict Review Time</button>
    <button class="btn-secondary" onclick="send('setApiUrl')">Configure API URL</button>
  </div>

  <!-- Loading state -->
  <div id="state-loading">
    <div class="loading-wrap">
      <div class="spinner"></div>
      <p class="loading-text">Analysing your changes...</p>
    </div>
  </div>

  <!-- Error state -->
  <div id="state-error">
    <div class="error-box" id="error-msg"></div>
    <button class="btn-primary" onclick="send('predict')">Try Again</button>
    <button class="btn-secondary" onclick="send('setApiUrl')">Set API URL</button>
  </div>

  <!-- Result state -->
  <div id="state-result">
    <div class="branch-pill" id="branch-name">feature/dark-mode</div>

    <div class="main-metric">
      <div class="main-hours" id="pred-hours">—</div>
      <div class="main-category" id="pred-category">—</div>
    </div>

    <div class="grid2">
      <div class="mini-card">
        <div class="mini-label">Range</div>
        <div class="mini-value" id="pred-range">—</div>
      </div>
      <div class="mini-card">
        <div class="mini-label">Confidence</div>
        <div class="mini-value" id="pred-confidence">—</div>
      </div>
    </div>

    <div class="progress-wrap">
      <div class="progress-labels">
        <span>Fast &lt;4h</span>
        <span>Same day</span>
        <span>2–3 days</span>
        <span>1+ week</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" id="progress-bar" style="width:0%"></div>
      </div>
    </div>

    <div class="git-stats" id="git-stats"></div>

    <div class="section-label">Top signals</div>
    <div class="signals-list" id="signals-list"></div>

    <div class="action-row">
      <button class="btn-primary" onclick="send('predict')">Refresh</button>
      <button class="btn-secondary" onclick="copyComment()">Copy comment</button>
    </div>

    <p class="mae-note" id="mae-note"></p>
  </div>

</div>

<script>
  const vscode = acquireVsCodeApi();
  let lastPrediction = null;
  let lastGitInfo = null;

  function send(command, extra) {
    vscode.postMessage({ command, ...extra });
  }

  function showState(name) {
    ['idle','loading','error','result'].forEach(s => {
      document.getElementById('state-' + s).style.display = s === name ? 'block' : 'none';
    });
  }

  function hoursToProgress(hours) {
    if (hours < 4)   return 10;
    if (hours < 24)  return 30;
    if (hours < 72)  return 55;
    if (hours < 168) return 75;
    return 92;
  }

  function copyComment() {
    if (!lastPrediction || !lastGitInfo) { return; }
    const p = lastPrediction;
    const text = [
      '### PR Review Time Prediction',
      '',
      '| | |',
      '|---|---|',
      '| **Estimated merge time** | ' + p.predicted_hours + ' hours |',
      '| **Category** | ' + p.category + ' |',
      '| **Confidence interval** | ' + p.lower_bound_hrs + 'h – ' + p.upper_bound_hrs + 'h |',
      '| **Confidence** | ' + p.confidence_pct + '% |',
      '',
      '**Top signals:** ' + p.top_signals.join(' · '),
      '',
      '---',
      '*Powered by PR Review Time Predictor · Model MAE: ±' + p.model_mae_hours + 'h*',
    ].join('\\n');
    send('copyComment', { text });
  }

  window.addEventListener('message', (event) => {
    const msg = event.data;

    if (msg.type === 'loading') {
      showState('loading');
      return;
    }

    if (msg.type === 'error') {
      document.getElementById('error-msg').textContent = msg.message;
      showState('error');
      return;
    }

    if (msg.type === 'prediction') {
      const p = msg.prediction;
      const g = msg.gitInfo;
      lastPrediction = p;
      lastGitInfo    = g;

      // Branch pill
      document.getElementById('branch-name').textContent = g.branchName;

      // Main metric
      document.getElementById('pred-hours').textContent    = p.predicted_hours + 'h';
      document.getElementById('pred-category').textContent = p.category;

      // Mini cards
      document.getElementById('pred-range').textContent      = p.lower_bound_hrs + '–' + p.upper_bound_hrs + 'h';
      document.getElementById('pred-confidence').textContent = p.confidence_pct + '%';

      // Progress bar
      document.getElementById('progress-bar').style.width = hoursToProgress(p.predicted_hours) + '%';

      // Git stats chips
      const statsEl = document.getElementById('git-stats');
      statsEl.innerHTML = [
        '<span class="stat-chip add">+' + g.additions + '</span>',
        '<span class="stat-chip del">−' + g.deletions + '</span>',
        '<span class="stat-chip">' + g.changedFiles + ' files</span>',
        '<span class="stat-chip">' + g.commits + ' commits</span>',
      ].join('');

      // Signals
      const signalsEl = document.getElementById('signals-list');
      signalsEl.innerHTML = p.top_signals.map(s =>
        '<div class="signal-item"><span class="signal-dot"></span>' + s + '</div>'
      ).join('');

      // MAE note
      document.getElementById('mae-note').textContent =
        'Model MAE: ±' + p.model_mae_hours + 'h · trained on VSCode PRs';

      showState('result');
    }
  });
</script>
</body>
</html>`;
    }
}
exports.PrPredictorSidebarProvider = PrPredictorSidebarProvider;
//# sourceMappingURL=sidebarProvider.js.map