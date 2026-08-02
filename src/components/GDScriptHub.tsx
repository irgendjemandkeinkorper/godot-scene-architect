import React, { useState } from 'react';
import { FileCode, Copy, Check, Download, Wand2, Bot, Sparkles, Code2, Play } from 'lucide-react';
import { GodotScriptFile } from '../types';

interface GDScriptHubProps {
  scripts: GodotScriptFile[];
  sceneTitle: string;
  onUpdateScript?: (filename: string, newCode: string) => void;
}

export const GDScriptHub: React.FC<GDScriptHubProps> = ({
  scripts,
  sceneTitle,
  onUpdateScript,
}) => {
  const [selectedFilename, setSelectedFilename] = useState<string>(scripts[0]?.filename || '');
  const [copied, setCopied] = useState<boolean>(false);
  const [refinementPrompt, setRefinementPrompt] = useState<string>('');
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [refineResultMsg, setRefineResultMsg] = useState<string>('');

  const activeScript = scripts.find((s) => s.filename === selectedFilename) || scripts[0];

  const handleCopyCode = () => {
    if (!activeScript) return;
    navigator.clipboard.writeText(activeScript.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadScript = () => {
    if (!activeScript) return;
    const blob = new Blob([activeScript.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanName = activeScript.filename.split('/').pop() || 'script.gd';
    a.download = cleanName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRefineScript = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refinementPrompt.trim() || !activeScript || isRefining) return;

    setIsRefining(true);
    setRefineResultMsg('');

    try {
      const response = await fetch('/api/refine-node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeName: activeScript.nodeTarget,
          currentScript: activeScript.code,
          userInstructions: refinementPrompt,
          sceneContext: sceneTitle,
        }),
      });

      if (!response.ok) throw new Error('Failed to refine script');

      const data = await response.json();
      if (data.updatedScript && onUpdateScript) {
        onUpdateScript(activeScript.filename, data.updatedScript);
        setRefineResultMsg(`Successfully updated ${activeScript.filename}! ${data.explanation || ''}`);
        setRefinementPrompt('');
      }
    } catch (err: any) {
      console.error(err);
      setRefineResultMsg(`Error refining script: ${err.message}`);
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <div className="bg-[#010409] border border-slate-800 rounded-sm p-6 shadow-2xl space-y-6 relative overflow-hidden">
      
      {/* Background Section Index Number */}
      <div className="absolute right-4 top-0 pointer-events-none select-none opacity-10 text-slate-700 font-black text-8xl md:text-9xl tracking-tighter leading-none">
        04
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 relative z-10">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold tracking-widest text-sky-400 uppercase bg-sky-950/60 px-2 py-0.5 border border-sky-500/30">
              04 // SCRIPT REPOSITORY
            </span>
            <h3 className="font-black text-white text-base uppercase tracking-tight flex items-center gap-2">
              <span className="text-sky-400 font-mono font-bold text-lg">.gd</span>
              GDScript Code Hub
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 uppercase font-mono tracking-wider">
            Godot 4 production scripts with signal bindings, physics, and exported variables
          </p>
        </div>

        {activeScript && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyCode}
              className="px-3.5 py-2 rounded-sm bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied GDScript' : 'Copy Code'}</span>
            </button>
            <button
              onClick={handleDownloadScript}
              className="px-4 py-2 rounded-sm bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .gd</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4 relative z-10">
        
        {/* Left Sidebar: Script File Explorer */}
        <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-sm p-3">
          <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-3 px-2 flex items-center gap-1.5">
            <FileCode className="w-3.5 h-3.5 text-sky-400" /> GDScript Files ({scripts.length})
          </div>

          <div className="space-y-1.5">
            {scripts.map((sc) => {
              const isActive = sc.filename === selectedFilename;
              const displayTitle = sc.filename.split('/').pop() || sc.filename;

              return (
                <div
                  key={sc.filename}
                  onClick={() => setSelectedFilename(sc.filename)}
                  className={`p-3 rounded-sm cursor-pointer border transition-all ${
                    isActive
                      ? 'bg-sky-950/80 border-sky-500 text-white shadow-sm'
                      : 'bg-slate-900/50 border-transparent text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-sky-300">{displayTitle}</span>
                    <span className="text-[10px] bg-slate-900 text-sky-400 font-mono font-bold px-1.5 py-0.5 rounded-sm uppercase">
                      Godot 4
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 truncate font-mono">
                    Target: <span className="text-slate-200">{sc.nodeTarget}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Code Viewer & AI Refinement */}
        <div className="lg:col-span-8 space-y-4">
          {activeScript ? (
            <>
              {/* Target Node info banner */}
              <div className="bg-slate-950 border border-slate-800 rounded-sm p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-mono font-bold text-sky-400 flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-sky-400" /> {activeScript.filename}
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5 font-sans">
                    {activeScript.description}
                  </div>
                </div>
                <div className="text-xs font-mono font-bold bg-sky-950 border border-sky-500/30 text-sky-300 px-3 py-1 rounded-sm uppercase">
                  Target: {activeScript.nodeTarget}
                </div>
              </div>

              {/* Code Pre Box */}
              <div className="relative bg-slate-950 border border-slate-800 rounded-sm overflow-hidden">
                <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>GDScript 4 Engine Syntax</span>
                  <span>{activeScript.code.split('\n').length} lines</span>
                </div>
                <pre className="p-4 font-mono text-xs text-emerald-300 overflow-x-auto max-h-[420px] leading-relaxed shadow-inner">
                  <code>{activeScript.code}</code>
                </pre>
              </div>

              {/* AI Refinement Form */}
              <div className="bg-slate-950 border border-slate-800 rounded-sm p-4">
                <form onSubmit={handleRefineScript} className="space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                    <Wand2 className="w-4 h-4 text-sky-400" />
                    <span>Refine this GDScript with AI</span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={refinementPrompt}
                      onChange={(e) => setRefinementPrompt(e.target.value)}
                      placeholder="e.g. Add a health shield system, screen-shake signal, or combo attack sequence..."
                      className="flex-1 bg-[#080d1a] border border-slate-800 rounded-sm px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-sans"
                    />
                    <button
                      type="submit"
                      disabled={isRefining || !refinementPrompt.trim()}
                      className="px-4 py-2 rounded-sm bg-sky-600 hover:bg-sky-500 text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow"
                    >
                      {isRefining ? <Bot className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                      <span>{isRefining ? 'Updating...' : 'Apply AI Edit'}</span>
                    </button>
                  </div>

                  {refineResultMsg && (
                    <p className="text-xs text-emerald-400 mt-1 font-mono">
                      {refineResultMsg}
                    </p>
                  )}
                </form>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs font-mono">
              Select a script from the sidebar.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
