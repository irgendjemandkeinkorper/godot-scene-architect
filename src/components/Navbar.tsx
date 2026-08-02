import React from 'react';
import { Gamepad2, Github, Download, Sparkles, FolderArchive, Layers } from 'lucide-react';
import { GodotVersion } from '../types';

interface NavbarProps {
  godotVersion: GodotVersion;
  onGodotVersionChange: (version: GodotVersion) => void;
  onOpenGitHubModal: () => void;
  onExportZip: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  isGenerating: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  godotVersion,
  onGodotVersionChange,
  onOpenGitHubModal,
  onExportZip,
  activeTab,
  onSelectTab,
  isGenerating,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#010409] border-b border-slate-800/90 text-slate-100 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* App Title & Branding */}
        <div className="flex items-center space-x-3.5">
          <div className="w-9 h-9 bg-sky-500 rounded-sm flex items-center justify-center font-black text-slate-950 text-xl tracking-tighter shadow-md">
            G
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5 uppercase">
                Godot Scene Architect
              </h1>
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold tracking-widest uppercase bg-sky-950/70 text-sky-400 border border-sky-500/30">
                // Bridge
              </span>
            </div>
            <p className="text-[10px] font-mono tracking-wider text-slate-400 hidden sm:block uppercase">
              Engine-AI Blueprint Deconstruction &amp; Task Chain
            </p>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1 bg-slate-950 p-1 border border-slate-800/80 rounded-md">
          <button
            id="tab-btn-tree"
            onClick={() => onSelectTab('tree')}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border ${
              activeTab === 'tree'
                ? 'bg-sky-600 text-white border-sky-400/50 shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-sky-300" />
            01 Node Dock
          </button>
          <button
            id="tab-btn-chain"
            onClick={() => onSelectTab('chain')}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border ${
              activeTab === 'chain'
                ? 'bg-sky-600 text-white border-sky-400/50 shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            02 Modular Chain
          </button>
          <button
            id="tab-btn-gdscript"
            onClick={() => onSelectTab('gdscript')}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border ${
              activeTab === 'gdscript'
                ? 'bg-sky-600 text-white border-sky-400/50 shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <span className="text-sky-400 font-mono font-black text-xs">.gd</span>
            03 GDScript Hub
          </button>
          <button
            id="tab-btn-github"
            onClick={() => onSelectTab('github')}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border ${
              activeTab === 'github'
                ? 'bg-sky-600 text-white border-sky-400/50 shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Github className="w-3.5 h-3.5 text-slate-200" />
            04 GitHub Tasks
          </button>
          <button
            id="tab-btn-project"
            onClick={() => onSelectTab('project')}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border ${
              activeTab === 'project'
                ? 'bg-sky-600 text-white border-sky-400/50 shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FolderArchive className="w-3.5 h-3.5 text-emerald-400" />
            05 Exporter
          </button>
        </nav>

        {/* Controls Right */}
        <div className="flex items-center space-x-3">
          {/* Godot Version Selector */}
          <div className="relative">
            <select
              id="godot-version-select"
              value={godotVersion}
              onChange={(e) => onGodotVersionChange(e.target.value as GodotVersion)}
              className="bg-slate-950 border border-slate-800 text-xs font-mono font-bold uppercase tracking-wider text-sky-400 rounded-sm px-2.5 py-1.5 focus:outline-none focus:border-sky-500 hover:border-slate-600 transition-colors cursor-pointer"
            >
              <option value="Godot 4.3">Godot 4.3</option>
              <option value="Godot 4.2">Godot 4.2</option>
              <option value="Godot 3.5">Godot 3.5</option>
            </select>
          </div>

          {/* Sync GitHub Button */}
          <button
            id="github-sync-modal-btn"
            onClick={onOpenGitHubModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-sm bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-widest border border-slate-700 transition-all shadow-sm"
            title="Sync issues and milestones directly to your GitHub repo"
          >
            <Github className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">Sync Repo</span>
          </button>

          {/* Export Zip Button */}
          <button
            id="export-zip-btn"
            onClick={onExportZip}
            disabled={isGenerating}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-sm bg-sky-600 hover:bg-sky-500 text-white text-xs font-black uppercase tracking-widest transition-all shadow-sm border border-sky-400/30 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export ZIP</span>
          </button>
        </div>

      </div>

      {/* Mobile Nav Tabs */}
      <div className="md:hidden flex items-center justify-around bg-slate-950 px-2 py-1.5 border-t border-slate-800 overflow-x-auto text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => onSelectTab('tree')}
          className={`px-2 py-1 rounded-sm ${activeTab === 'tree' ? 'bg-sky-600 text-white' : 'text-slate-400'}`}
        >
          Nodes
        </button>
        <button
          onClick={() => onSelectTab('chain')}
          className={`px-2 py-1 rounded-sm ${activeTab === 'chain' ? 'bg-sky-600 text-white' : 'text-slate-400'}`}
        >
          Chain
        </button>
        <button
          onClick={() => onSelectTab('gdscript')}
          className={`px-2 py-1 rounded-sm ${activeTab === 'gdscript' ? 'bg-sky-600 text-white' : 'text-slate-400'}`}
        >
          Script
        </button>
        <button
          onClick={() => onSelectTab('github')}
          className={`px-2 py-1 rounded-sm ${activeTab === 'github' ? 'bg-sky-600 text-white' : 'text-slate-400'}`}
        >
          GitHub
        </button>
        <button
          onClick={() => onSelectTab('project')}
          className={`px-2 py-1 rounded-sm ${activeTab === 'project' ? 'bg-sky-600 text-white' : 'text-slate-400'}`}
        >
          Export
        </button>
      </div>
    </header>
  );
};

