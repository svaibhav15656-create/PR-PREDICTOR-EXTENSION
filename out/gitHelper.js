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
exports.getGitInfo = getGitInfo;
const vscode = __importStar(require("vscode"));
const child_process_1 = require("child_process");
function exec(cmd, cwd) {
    try {
        return (0, child_process_1.execSync)(cmd, { cwd, encoding: 'utf8', timeout: 5000 }).trim();
    }
    catch {
        return '';
    }
}
async function getGitInfo() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        return null;
    }
    const cwd = workspaceFolders[0].uri.fsPath;
    // Check if this is a git repo
    const isGit = exec('git rev-parse --git-dir', cwd);
    if (!isGit) {
        return null;
    }
    // Branch name
    const branchName = exec('git rev-parse --abbrev-ref HEAD', cwd) || 'unknown-branch';
    // Diff stats against main/master
    const base = getBaseBranch(cwd);
    const diffStat = exec(`git diff ${base}...HEAD --shortstat`, cwd);
    let additions = 0;
    let deletions = 0;
    let changedFiles = 0;
    if (diffStat) {
        const filesMatch = diffStat.match(/(\d+) file/);
        const addMatch = diffStat.match(/(\d+) insertion/);
        const delMatch = diffStat.match(/(\d+) deletion/);
        changedFiles = filesMatch ? parseInt(filesMatch[1]) : 0;
        additions = addMatch ? parseInt(addMatch[1]) : 0;
        deletions = delMatch ? parseInt(delMatch[1]) : 0;
    }
    // If no diff yet (fresh branch), use staged + unstaged
    if (additions === 0 && deletions === 0) {
        const staged = exec('git diff --cached --shortstat', cwd);
        const unstaged = exec('git diff --shortstat', cwd);
        const combined = staged || unstaged;
        if (combined) {
            const a = combined.match(/(\d+) insertion/);
            const d = combined.match(/(\d+) deletion/);
            const f = combined.match(/(\d+) file/);
            additions = a ? parseInt(a[1]) : 0;
            deletions = d ? parseInt(d[1]) : 0;
            changedFiles = f ? parseInt(f[1]) : 0;
        }
    }
    // Commit count ahead of base
    const commitCountStr = exec(`git rev-list ${base}...HEAD --count`, cwd);
    const commits = commitCountStr ? parseInt(commitCountStr) : 1;
    // Author
    const author = exec('git config user.name', cwd) || 'unknown';
    // Last commit message (use as PR title hint)
    const lastCommitMsg = exec('git log -1 --pretty=%s', cwd) || branchName;
    // Repo name
    const remoteUrl = exec('git remote get-url origin', cwd);
    const repoName = remoteUrl
        ? remoteUrl.split('/').pop()?.replace('.git', '') || 'repo'
        : 'repo';
    // Infer labels from branch name / commit message
    const labels = inferLabels(branchName, lastCommitMsg);
    return {
        branchName,
        additions,
        deletions,
        changedFiles,
        commits,
        author,
        labels,
        repoName,
        lastCommitMsg,
    };
}
function getBaseBranch(cwd) {
    // Try to detect if main or master exists
    const branches = (0, child_process_1.execSync)('git branch -r', { cwd, encoding: 'utf8' })
        .split('\n')
        .map(b => b.trim());
    if (branches.some(b => b.includes('origin/main'))) {
        return 'origin/main';
    }
    if (branches.some(b => b.includes('origin/master'))) {
        return 'origin/master';
    }
    return 'HEAD~5'; // fallback: last 5 commits
}
function inferLabels(branch, commitMsg) {
    const text = `${branch} ${commitMsg}`.toLowerCase();
    const labels = [];
    if (/feat|feature|add|new|implement/.test(text)) {
        labels.push('feature');
    }
    if (/fix|bug|patch|hotfix|revert/.test(text)) {
        labels.push('bug');
    }
    if (/doc|readme|comment|typo/.test(text)) {
        labels.push('docs');
    }
    if (/refactor|cleanup|clean|rename|move/.test(text)) {
        labels.push('refactor');
    }
    if (/test|spec|coverage/.test(text)) {
        labels.push('test');
    }
    if (/perf|performance|speed|optim/.test(text)) {
        labels.push('perf');
    }
    if (/ci|cd|workflow|action|pipeline|build/.test(text)) {
        labels.push('ci');
    }
    return labels.join(',');
}
//# sourceMappingURL=gitHelper.js.map