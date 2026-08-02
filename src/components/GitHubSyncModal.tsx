import React, { useState } from 'react';
import { Github, Key, Check, AlertCircle, Bot, ExternalLink, Milestone, CheckCircle } from 'lucide-react';
import { GitHubIssueItem, GitHubMilestoneItem, GitHubSyncResult } from '../types';

interface GitHubSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestones: GitHubMilestoneItem[];
  issues: GitHubIssueItem[];
}

export const GitHubSyncModal: React.FC<GitHubSyncModalProps> = ({
  isOpen,
  onClose,
  milestones,
  issues,
}) => {
  const [owner, setOwner] = useState<string>('');
  const [repo, setRepo] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<GitHubSyncResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!owner.trim() || !repo.trim() || !token.trim()) {
      setErrorMsg('Please fill in GitHub Owner, Repository Name, and Token.');
      return;
    }

    setIsSyncing(true);
    setErrorMsg('');
    setSyncResult(null);

    try {
      const res = await fetch('/api/github/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: owner.trim(),
          repo: repo.trim(),
          token: token.trim(),
          milestones,
          issues,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.details || 'Sync failed');
      }

      setSyncResult(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to sync with GitHub API.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#010409] border border-slate-800 rounded-sm max-w-xl w-full p-6 shadow-2xl space-y-5 my-8 relative overflow-hidden font-mono">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-sm bg-slate-900 flex items-center justify-center border border-slate-800">
              <Github className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-sky-400 uppercase">
                07 // API INTEGRATION
              </span>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">
                Live Sync to GitHub
              </h3>
              <p className="text-xs text-slate-400 uppercase tracking-wider mt-0.5">
                Automated push of {milestones.length} Milestones &amp; {issues.length} Issues
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-base p-1 font-mono font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Sync Result View if Done */}
        {syncResult ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-950/60 border border-emerald-500/60 rounded-sm text-emerald-200 text-xs space-y-2">
              <div className="flex items-center space-x-2 font-bold text-emerald-400 text-sm uppercase">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span>GitHub Sync Complete!</span>
              </div>
              <p className="font-sans">{syncResult.message}</p>
            </div>

            {/* Created Issues Link List */}
            {syncResult.createdIssues.length > 0 && (
              <div className="bg-slate-950 p-3.5 rounded-sm border border-slate-800 max-h-48 overflow-y-auto space-y-1.5 text-xs">
                <div className="font-bold text-slate-300 uppercase tracking-wider mb-2">Created Issues:</div>
                {syncResult.createdIssues.map((iss, idx) => (
                  <a
                    key={idx}
                    href={iss.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded-sm hover:bg-slate-900 text-sky-400 hover:underline font-mono"
                  >
                    <span>#{iss.number} {iss.title}</span>
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                  </a>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-sm bg-sky-600 hover:bg-sky-500 text-white font-mono font-bold text-xs uppercase tracking-wider shadow cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        ) : (
          /* Form Inputs */
          <form onSubmit={handleSync} className="space-y-4 font-mono">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  GitHub Owner / Org <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  placeholder="e.g. my-username"
                  required
                  className="w-full bg-[#080d1a] border border-slate-800 rounded-sm px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Repository Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  placeholder="e.g. godot-game-repo"
                  required
                  className="w-full bg-[#080d1a] border border-slate-800 rounded-sm px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  Personal Access Token (PAT) <span className="text-rose-400">*</span>
                </span>
                <span className="text-[10px] text-slate-400">Needs `repo` scope</span>
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                required
                className="w-full bg-[#080d1a] border border-slate-800 rounded-sm px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-950/60 border border-rose-500/60 rounded-sm text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="bg-slate-950 p-3 rounded-sm border border-slate-800 text-[11px] text-slate-400 space-y-1 font-sans">
              <strong className="text-slate-300 font-mono uppercase">Security Note:</strong> Your PAT is processed securely server-side for this API call only and is never stored in browser localStorage or database.
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-sm bg-slate-950 hover:bg-slate-900 text-slate-300 text-xs font-mono font-bold uppercase border border-slate-800 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSyncing}
                className="px-5 py-2 rounded-sm bg-sky-600 hover:bg-sky-500 text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg border border-sky-400/40 disabled:opacity-50 cursor-pointer"
              >
                {isSyncing ? (
                  <>
                    <Bot className="w-4 h-4 animate-spin text-sky-200" />
                    <span>Pushing Issues to GitHub...</span>
                  </>
                ) : (
                  <>
                    <Github className="w-4 h-4" />
                    <span>Sync {issues.length} Tasks to Repo</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
