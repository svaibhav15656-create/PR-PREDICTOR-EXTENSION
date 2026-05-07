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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const sidebarProvider_1 = require("./sidebarProvider");
const apiClient_1 = require("./apiClient");
const gitHelper_1 = require("./gitHelper");
function activate(context) {
    console.log('PR Review Predictor is now active');
    // Register sidebar webview
    const sidebarProvider = new sidebarProvider_1.PrPredictorSidebarProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('prPredictor.sidebarView', sidebarProvider));
    // Command: predict from current git repo
    const predictCommand = vscode.commands.registerCommand('prPredictor.predict', async () => {
        await runPrediction(sidebarProvider);
    });
    // Command: set API URL
    const setApiUrlCommand = vscode.commands.registerCommand('prPredictor.setApiUrl', async () => {
        const current = vscode.workspace
            .getConfiguration('prPredictor')
            .get('apiUrl', 'http://localhost:8000');
        const url = await vscode.window.showInputBox({
            prompt: 'Enter your PR Predictor API URL',
            value: current,
            placeHolder: 'http://localhost:8000 or https://your-app.railway.app',
        });
        if (url) {
            await vscode.workspace
                .getConfiguration('prPredictor')
                .update('apiUrl', url, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage(`PR Predictor API URL set to: ${url}`);
        }
    });
    // Auto-predict when workspace opens
    const autoPredict = vscode.workspace
        .getConfiguration('prPredictor')
        .get('autoPredict', true);
    if (autoPredict) {
        // Small delay so sidebar loads first
        setTimeout(() => runPrediction(sidebarProvider), 2000);
    }
    // Re-predict when files are saved (detects new changes)
    const onSave = vscode.workspace.onDidSaveTextDocument(async () => {
        const autoP = vscode.workspace
            .getConfiguration('prPredictor')
            .get('autoPredict', true);
        if (autoP) {
            await runPrediction(sidebarProvider);
        }
    });
    context.subscriptions.push(predictCommand, setApiUrlCommand, onSave);
}
async function runPrediction(sidebarProvider) {
    try {
        sidebarProvider.setLoading(true);
        // Get git diff info from workspace
        const gitInfo = await (0, gitHelper_1.getGitInfo)();
        if (!gitInfo) {
            sidebarProvider.setError('No git repository found in workspace. Open a folder with a git repo.');
            return;
        }
        const apiUrl = vscode.workspace
            .getConfiguration('prPredictor')
            .get('apiUrl', 'http://localhost:8000');
        // Build prediction input from git info
        const input = {
            title: gitInfo.branchName.replace(/-/g, ' '),
            additions: gitInfo.additions,
            deletions: gitInfo.deletions,
            changed_files: gitInfo.changedFiles,
            commits: gitInfo.commits,
            labels: gitInfo.labels,
            author: gitInfo.author,
            day_of_week: new Date().getDay() === 0 ? 6 : new Date().getDay() - 1,
            hour_of_day: new Date().getHours(),
            month: new Date().getMonth() + 1,
            draft: 0,
            comments: 0,
            review_comments: 0,
        };
        const prediction = await (0, apiClient_1.getPrediction)(apiUrl, input);
        sidebarProvider.setPrediction(prediction, gitInfo);
    }
    catch (err) {
        sidebarProvider.setError(err.message.includes('ECONNREFUSED')
            ? 'Cannot connect to API. Make sure your API is running:\nuvicorn src.api:app --reload --port 8000'
            : `Error: ${err.message}`);
    }
}
function deactivate() { }
//# sourceMappingURL=extension.js.map