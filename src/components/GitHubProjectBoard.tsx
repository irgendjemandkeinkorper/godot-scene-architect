import React, { useState } from 'react';
import {
  Github,
  CheckSquare,
  ListTodo,
  Tag,
  Milestone,
  Copy,
  Check,
  Download,
  Terminal,
  ExternalLink,
  ChevronRight,
  Filter,
  User,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';
import { GitHubIssueItem, GitHubMilestoneItem } from '../types';

interface GitHubProjectBoardProps {
  issues: GitHubIssueItem[];
  milestones: GitHubMilestoneItem[];
  sceneTitle: string;
  onOpenSyncModal: () => void;
  onUpdateIssueStatus?: (issueId: string, newStatus: GitHubIssueItem['status']) => void;
}

export const GitHubProjectBoard: React.FC<GitHubProjectBoardProps> = ({
  issues,
  milestones,
  sceneTitle,
  onOpenSyncModal,
  onUpdateIssueStatus,
}) => {
  const [selectedMilestone, setSelectedMilestone] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedIssueModal, setSelectedIssueModal] = useState<GitHubIssueItem | null>(null);
  const [copiedMd, setCopiedMd] = useState<boolean>(false);

  // Filter issues
  const filteredIssues = issues.filter((iss) => {
    if (selectedMilestone !== 'all' && iss.milestoneTitle !== selectedMilestone) return false;
    if (selectedTag !== 'all' && !iss.labels.includes(selectedTag)) return false;
    return true;
  });

  // Unique labels list
  const allLabels = Array.from(new Set(issues.flatMap((i) => i.labels)));

  // Group by status
  const todoIssues = filteredIssues.filter((i) => i.status === 'todo' || !i.status);
  const inProgressIssues = filteredIssues.filter((i) => i.status === 'in_progress');
  const reviewIssues = filteredIssues.filter((i) => i.status === 'review');
  const doneIssues = filteredIssues.filter((i) => i.status === 'done');

  // Copy Markdown for all issues
  const handleCopyMarkdown = () => {
    let md = `# GitHub Automated Project Plan for ${sceneTitle}\n\n`;
    md += `## Milestones\n`;
    milestones.forEach((m) => {
      md += `- **${m.title}**: ${m.description} (Due: ~${m.dueDateWeeks} weeks)\n`;
    });
    md += `\n## Issues Breakdown\n\n`;
    issues.forEach((iss, index) => {
      md += `### Issue #${index + 1}: ${iss.title}\n`;
      md += `- **Milestone**: ${iss.milestoneTitle}\n`;
      md += `- **Labels**: \`${iss.labels.join('`, `')}\`\n`;
      md += `- **Role**: ${iss.assigneeRole}\n\n`;
      md += `#### Description\n${iss.bodyMarkdown}\n\n`;
      md += `#### Acceptance Criteria\n`;
      iss.acceptanceCriteria.forEach((crit) => {
        md += `- [ ] ${crit}\n`;
      });
      md += `\n---\n\n`;
    });

    navigator.clipboard.writeText(md);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  // Download GitHub CLI bash script
  const handleDownloadGhScript = () => {
    let script = `#!/bin/bash\n# GitHub CLI (gh) Batch Importer for ${sceneTitle}\n# Usage: bash create_github_issues.sh\n\n`;
    script += `echo "Creating Milestones..."\n`;
    milestones.forEach((m) => {
      script += `gh milestone create --title "${m.title.replace(/"/g, '\\"')}" --description "${m.description.replace(/"/g, '\\"')}"\n`;
    });

    script += `\necho "Creating Issues..."\n`;
    issues.forEach((iss) => {
      const labelsArg = iss.labels.join(',');
      const bodyEscaped = (iss.bodyMarkdown + '\n\n### Acceptance Criteria:\n' + iss.acceptanceCriteria.map((c) => '- [ ] ' + c).join('\n'))
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n');

      script += `gh issue create --title "${iss.title.replace(/"/g, '\\"')}" --label "${labelsArg}" --body "${bodyEscaped}" --milestone "${iss.milestoneTitle.replace(/"/g, '\\"')}"\n`;
    });

    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'create_github_issues.sh';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download CSV
  const handleDownloadCsv = () => {
    let csv = `Title,Module,Milestone,Labels,Role,AcceptanceCriteria,MarkdownBody\n`;
    issues.forEach((i) => {
      const title = `"${i.title.replace(/"/g, '""')}"`;
      const moduleStr = `"${i.moduleTitle.replace(/"/g, '""')}"`;
      const milestone = `"${i.milestoneTitle.replace(/"/g, '""')}"`;
      const labels = `"${i.labels.join(';')}"`;
      const role = `"${i.assigneeRole.replace(/"/g, '""')}"`;
      const criteria = `"${i.acceptanceCriteria.join('; ')}"`;
      const body = `"${i.bodyMarkdown.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
      csv += `${title},${moduleStr},${milestone},${labels},${role},${criteria},${body}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'github_issues.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const moveIssue = (issueId: string, newStatus: GitHubIssueItem['status']) => {
    if (onUpdateIssueStatus) {
      onUpdateIssueStatus(issueId, newStatus);
    }
  };

  return (
    <div className="bg-[#010409] border border-slate-800 rounded-sm p-6 shadow-2xl space-y-6 relative overflow-hidden">
      
      {/* Background Section Index Number */}
      <div className="absolute right-4 top-0 pointer-events-none select-none opacity-10 text-slate-700 font-black text-8xl md:text-9xl tracking-tighter leading-none">
        05
      </div>

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800 relative z-10">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold tracking-widest text-sky-400 uppercase bg-sky-950/60 px-2 py-0.5 border border-sky-500/30">
              05 // GITHUB PROJECT BOARD
            </span>
            <h3 className="font-black text-white text-base uppercase tracking-tight flex items-center gap-2">
              <Github className="w-5 h-5 text-white" />
              Automated GitHub Task Engine
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 uppercase font-mono tracking-wider">
            Synchronized Milestones, Kanban Cards, Acceptance Criteria &amp; 1-Click Sync
          </p>
        </div>

        {/* Action Controls Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="sync-gh-live-btn"
            onClick={onOpenSyncModal}
            className="px-4 py-2.5 rounded-sm bg-sky-600 hover:bg-sky-500 text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-sky-600/20 border border-sky-400/40 transition-all cursor-pointer"
          >
            <Github className="w-4 h-4 text-white" />
            <span>1-Click Sync to GitHub</span>
          </button>

          <button
            onClick={handleCopyMarkdown}
            className="px-3.5 py-2.5 rounded-sm bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow"
          >
            {copiedMd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedMd ? 'Copied MD' : 'Copy MD'}</span>
          </button>

          <button
            onClick={handleDownloadGhScript}
            className="px-3.5 py-2.5 rounded-sm bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow"
            title="Download bash script for 'gh' CLI tool"
          >
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span>`gh` Script</span>
          </button>

          <button
            onClick={handleDownloadCsv}
            className="px-3.5 py-2.5 rounded-sm bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow"
            title="Export CSV for Jira or GitHub Importers"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Milestones Horizontal Summary Bar */}
      <div className="relative z-10">
        <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <Milestone className="w-4 h-4 text-amber-400" /> Generated Milestones ({milestones.length})
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {milestones.map((ms) => {
            const count = issues.filter((i) => i.milestoneTitle === ms.title).length;
            return (
              <div
                key={ms.id}
                onClick={() => setSelectedMilestone(selectedMilestone === ms.title ? 'all' : ms.title)}
                className={`p-3.5 rounded-sm border transition-all cursor-pointer ${
                  selectedMilestone === ms.title
                    ? 'bg-amber-950/60 border-amber-500/60 shadow'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between font-mono font-bold text-xs text-amber-300 uppercase tracking-tight">
                  <span className="truncate">{ms.title}</span>
                  <span className="text-[10px] bg-amber-950 text-amber-200 px-1.5 py-0.5 rounded-sm border border-amber-500/30">
                    {count} tasks
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2 font-sans">
                  {ms.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3.5 rounded-sm border border-slate-800 relative z-10 font-mono">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-sky-400" /> Filter:
          </span>

          {/* Milestone Filter */}
          <select
            value={selectedMilestone}
            onChange={(e) => setSelectedMilestone(e.target.value)}
            className="bg-[#080d1a] border border-slate-800 rounded-sm px-3 py-1 text-slate-200 focus:outline-none text-xs font-mono uppercase"
          >
            <option value="all">All Milestones</option>
            {milestones.map((m) => (
              <option key={m.id} value={m.title}>
                {m.title}
              </option>
            ))}
          </select>

          {/* Label Tag Filter */}
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="bg-[#080d1a] border border-slate-800 rounded-sm px-3 py-1 text-slate-200 focus:outline-none text-xs font-mono uppercase"
          >
            <option value="all">All Labels</option>
            {allLabels.map((lbl) => (
              <option key={lbl} value={lbl}>
                #{lbl}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-400 uppercase tracking-wider">
          Showing <strong className="text-sky-400 font-bold">{filteredIssues.length}</strong> of {issues.length} issues
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        
        {/* Column 1: To Do */}
        <div className="bg-slate-950 border border-slate-800 rounded-sm p-3 flex flex-col space-y-3 min-h-[450px]">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 font-mono">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
              To Do ({todoIssues.length})
            </span>
          </div>
          <div className="space-y-3 flex-1">
            {todoIssues.map((issue) => renderIssueCard(issue))}
          </div>
        </div>

        {/* Column 2: In Progress */}
        <div className="bg-slate-950 border border-slate-800 rounded-sm p-3 flex flex-col space-y-3 min-h-[450px]">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 font-mono">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
              In Progress ({inProgressIssues.length})
            </span>
          </div>
          <div className="space-y-3 flex-1">
            {inProgressIssues.map((issue) => renderIssueCard(issue))}
          </div>
        </div>

        {/* Column 3: In Review */}
        <div className="bg-slate-950 border border-slate-800 rounded-sm p-3 flex flex-col space-y-3 min-h-[450px]">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 font-mono">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Review ({reviewIssues.length})
            </span>
          </div>
          <div className="space-y-3 flex-1">
            {reviewIssues.map((issue) => renderIssueCard(issue))}
          </div>
        </div>

        {/* Column 4: Done */}
        <div className="bg-slate-950 border border-slate-800 rounded-sm p-3 flex flex-col space-y-3 min-h-[450px]">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 font-mono">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Done ({doneIssues.length})
            </span>
          </div>
          <div className="space-y-3 flex-1">
            {doneIssues.map((issue) => renderIssueCard(issue))}
          </div>
        </div>

      </div>

      {/* Modal Dialog for Inspecting Selected Issue */}
      {selectedIssueModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#010409] border border-slate-800 rounded-sm max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto font-mono">
            
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono text-sky-400 font-bold uppercase">
                  {selectedIssueModal.moduleTitle}
                </span>
                <h3 className="text-lg font-extrabold text-white uppercase mt-1">
                  {selectedIssueModal.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedIssueModal(null)}
                className="text-slate-400 hover:text-white p-1 font-mono font-bold"
              >
                ✕
              </button>
            </div>

            {/* Labels & Assignee */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs bg-slate-900 text-slate-300 px-3 py-1 rounded-sm border border-slate-800 flex items-center gap-1 font-mono font-bold uppercase">
                <User className="w-3 h-3 text-sky-400" /> {selectedIssueModal.assigneeRole}
              </span>
              <span className="text-xs bg-amber-950 text-amber-300 px-3 py-1 rounded-sm border border-amber-500/30 flex items-center gap-1 font-mono font-bold uppercase">
                <Milestone className="w-3 h-3" /> {selectedIssueModal.milestoneTitle}
              </span>
              {selectedIssueModal.labels.map((lbl, idx) => (
                <span key={idx} className="text-[10px] font-mono font-bold bg-sky-950 text-sky-300 px-2 py-0.5 rounded-sm border border-sky-500/30 uppercase">
                  #{lbl}
                </span>
              ))}
            </div>

            {/* Description Markdown */}
            <div className="bg-[#080d1a] p-4 rounded-sm border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-2">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Task Description</h4>
              <p className="whitespace-pre-line font-sans">{selectedIssueModal.bodyMarkdown}</p>
            </div>

            {/* Acceptance Criteria */}
            <div>
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                <CheckSquare className="w-4 h-4" /> Acceptance Criteria
              </h4>
              <div className="space-y-1.5 bg-[#080d1a] p-3.5 rounded-sm border border-slate-800 text-xs text-slate-200">
                {selectedIssueModal.acceptanceCriteria.map((crit, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <input type="checkbox" readOnly checked className="rounded text-emerald-500" />
                    <span className="font-sans">{crit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Editor Instructions */}
            {selectedIssueModal.editorInstructions && selectedIssueModal.editorInstructions.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-widest mb-2">
                  Godot Editor Instructions
                </h4>
                <div className="space-y-1.5 bg-[#080d1a] p-3.5 rounded-sm border border-slate-800 text-xs text-slate-300">
                  {selectedIssueModal.editorInstructions.map((inst, idx) => (
                    <div key={idx} className="flex items-start space-x-2">
                      <span className="text-sky-400 font-mono font-bold">{idx + 1}.</span>
                      <span className="font-sans">{inst}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status Change Controls */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-3">
              <span className="text-xs text-slate-400 uppercase font-mono">Move Card Status:</span>
              <div className="flex items-center space-x-2">
                {(['todo', 'in_progress', 'review', 'done'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      moveIssue(selectedIssueModal.id, st);
                      setSelectedIssueModal({ ...selectedIssueModal, status: st });
                    }}
                    className={`px-3 py-1 text-xs rounded-sm font-mono font-bold uppercase transition-all ${
                      selectedIssueModal.status === st
                        ? 'bg-sky-600 text-white shadow'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );

  // Helper to render card
  function renderIssueCard(issue: GitHubIssueItem) {
    return (
      <div
        key={issue.id}
        onClick={() => setSelectedIssueModal(issue)}
        className="bg-[#080d1a] border border-slate-800 hover:border-sky-500/60 p-3.5 rounded-sm cursor-pointer transition-all shadow-sm group space-y-2.5"
      >
        <div className="flex items-start justify-between font-mono">
          <span className="text-[10px] text-sky-400 font-bold tracking-wider uppercase line-clamp-1">
            {issue.moduleTitle}
          </span>
          <span className="text-[10px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded-sm uppercase">
            {issue.type}
          </span>
        </div>

        <h4 className="font-extrabold text-xs text-slate-100 group-hover:text-sky-300 transition-colors uppercase tracking-tight line-clamp-2">
          {issue.title}
        </h4>

        <div className="flex flex-wrap items-center gap-1">
          {issue.labels.slice(0, 3).map((lbl, idx) => (
            <span
              key={idx}
              className="text-[9px] font-mono font-bold bg-sky-950 text-sky-300 px-1.5 py-0.2 rounded-sm border border-sky-500/30 uppercase"
            >
              #{lbl}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1.5 border-t border-slate-800">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3 text-slate-500" /> {issue.assigneeRole}
          </span>
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <CheckSquare className="w-3 h-3" /> {issue.acceptanceCriteria.length} criteria
          </span>
        </div>
      </div>
    );
  }
};
