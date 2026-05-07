import * as vscode from 'vscode';
import { PrPredictorSidebarProvider } from './sidebarProvider';
import { getPrediction, PrInput } from './apiClient';
import { getGitInfo } from './gitHelper';

export function activate(context: vscode.ExtensionContext) {
    console.log('PR Review Predictor is now active');

    // Register sidebar webview
    const sidebarProvider = new PrPredictorSidebarProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'prPredictor.sidebarView',
            sidebarProvider
        )
    );

    // Command: predict from current git repo
    const predictCommand = vscode.commands.registerCommand(
        'prPredictor.predict',
        async () => {
            await runPrediction(sidebarProvider);
        }
    );

    // Command: set API URL
    const setApiUrlCommand = vscode.commands.registerCommand(
        'prPredictor.setApiUrl',
        async () => {
            const current = vscode.workspace
                .getConfiguration('prPredictor')
                .get<string>('apiUrl', 'http://localhost:8000');

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
        }
    );

    // Auto-predict when workspace opens
    const autoPredict = vscode.workspace
        .getConfiguration('prPredictor')
        .get<boolean>('autoPredict', true);

    if (autoPredict) {
        // Small delay so sidebar loads first
        setTimeout(() => runPrediction(sidebarProvider), 2000);
    }

    // Re-predict when files are saved (detects new changes)
    const onSave = vscode.workspace.onDidSaveTextDocument(async () => {
        const autoP = vscode.workspace
            .getConfiguration('prPredictor')
            .get<boolean>('autoPredict', true);
        if (autoP) {
            await runPrediction(sidebarProvider);
        }
    });

    context.subscriptions.push(predictCommand, setApiUrlCommand, onSave);
}

async function runPrediction(sidebarProvider: PrPredictorSidebarProvider) {
    try {
        sidebarProvider.setLoading(true);

        // Get git diff info from workspace
        const gitInfo = await getGitInfo();

        if (!gitInfo) {
            sidebarProvider.setError('No git repository found in workspace. Open a folder with a git repo.');
            return;
        }

        const apiUrl = vscode.workspace
            .getConfiguration('prPredictor')
            .get<string>('apiUrl', 'http://localhost:8000');

        // Build prediction input from git info
        const input: PrInput = {
            title:           gitInfo.branchName.replace(/-/g, ' '),
            additions:       gitInfo.additions,
            deletions:       gitInfo.deletions,
            changed_files:   gitInfo.changedFiles,
            commits:         gitInfo.commits,
            labels:          gitInfo.labels,
            author:          gitInfo.author,
            day_of_week:     new Date().getDay() === 0 ? 6 : new Date().getDay() - 1,
            hour_of_day:     new Date().getHours(),
            month:           new Date().getMonth() + 1,
            draft:           0,
            comments:        0,
            review_comments: 0,
        };

        const prediction = await getPrediction(apiUrl, input);
        sidebarProvider.setPrediction(prediction, gitInfo);

    } catch (err: any) {
        sidebarProvider.setError(
            err.message.includes('ECONNREFUSED')
                ? 'Cannot connect to API. Make sure your API is running:\nuvicorn src.api:app --reload --port 8000'
                : `Error: ${err.message}`
        );
    }
}

export function deactivate() {}
