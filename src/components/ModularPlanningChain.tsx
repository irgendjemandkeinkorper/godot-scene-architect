import React, { useState } from 'react';
import { Sparkles, Clock, CheckCircle2, ChevronRight, ChevronDown, ListChecks, Code2, ArrowRight, Box } from 'lucide-react';
import { ImplementationModule } from '../types';

interface ModularPlanningChainProps {
  modules: ImplementationModule[];
  onSelectStageForGitHub?: (stageTitle: string) => void;
}

export const ModularPlanningChain: React.FC<ModularPlanningChainProps> = ({
  modules,
  onSelectStageForGitHub,
}) => {
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({
    'mod-1': true,
    'mod-2': true,
    'mod-3': true,
    'mod-4': true,
  });

  const toggleStage = (id: string) => {
    setExpandedStages((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const totalHours = modules.reduce((sum, m) => sum + (m.estimatedHours || 0), 0);

  return (
    <div className="bg-[#010409] border border-slate-800 rounded-sm p-6 shadow-2xl space-y-6 relative overflow-hidden">
      
      {/* Background Section Index Number */}
      <div className="absolute right-4 top-0 pointer-events-none select-none opacity-10 text-slate-700 font-black text-8xl md:text-9xl tracking-tighter leading-none">
        03
      </div>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 relative z-10">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold tracking-widest text-sky-400 uppercase bg-sky-950/60 px-2 py-0.5 border border-sky-500/30">
              03 // MODULAR PIPELINE
            </span>
            <h3 className="font-black text-white text-base uppercase tracking-tight">
              Modular Implementation Pipeline (DAG Chain)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 uppercase font-mono tracking-wider">
            Sequential Godot engine development stages for modular execution
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-slate-950 px-4 py-2 rounded-sm border border-slate-800 text-xs font-mono">
          <div className="flex items-center space-x-1.5 text-amber-400 font-bold uppercase tracking-wider">
            <Clock className="w-4 h-4" />
            <span>Est. Total: ~{totalHours} Hours</span>
          </div>
          <span className="text-slate-700">|</span>
          <span className="text-slate-300 font-bold uppercase">{modules.length} Stages</span>
        </div>
      </div>

      {/* Visual Pipeline Bar */}
      <div className="hidden lg:grid grid-cols-4 gap-2 bg-slate-950 p-2 rounded-sm border border-slate-800 relative z-10">
        {modules.map((mod, index) => (
          <div
            key={mod.id}
            onClick={() => toggleStage(mod.id)}
            className="cursor-pointer p-3 rounded-sm bg-[#080d1a] border border-slate-800 hover:border-sky-500/50 transition-all text-xs"
          >
            <div className="flex items-center justify-between font-mono text-[10px] text-sky-400 font-bold uppercase tracking-wider">
              <span>STAGE 0{mod.stageNumber || index + 1}</span>
              <span>{mod.estimatedHours}h</span>
            </div>
            <div className="font-bold text-slate-200 truncate mt-1 uppercase tracking-tight">
              {mod.title}
            </div>
          </div>
        ))}
      </div>

      {/* Sequential Modules List */}
      <div className="space-y-4 relative z-10">
        {modules.map((module, index) => {
          const isExpanded = expandedStages[module.id] !== false;

          return (
            <div
              key={module.id}
              className="bg-slate-950 border border-slate-800 rounded-sm overflow-hidden transition-all hover:border-slate-700 shadow"
            >
              {/* Module Header Bar */}
              <div
                onClick={() => toggleStage(module.id)}
                className="p-4 cursor-pointer flex items-center justify-between bg-slate-900/60 hover:bg-slate-900 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-sm bg-sky-950 border border-sky-500/40 text-sky-400 flex items-center justify-center font-mono font-black text-xs uppercase">
                    0{module.stageNumber || index + 1}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-white text-sm uppercase tracking-tight flex items-center gap-2">
                      {module.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5 font-sans">
                      {module.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2.5 py-0.5 rounded-sm uppercase tracking-wider hidden sm:inline">
                    ~{module.estimatedHours}h
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Expanded Module Details */}
              {isExpanded && (
                <div className="p-4 space-y-4 border-t border-slate-800 bg-slate-950">
                  
                  {/* Nodes Involved Badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mr-1 flex items-center gap-1">
                      <Box className="w-3.5 h-3.5 text-sky-400" /> Godot Nodes:
                    </span>
                    {module.godotNodesInvolved.map((nodeType, nIdx) => (
                      <span
                        key={nIdx}
                        className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-sm bg-sky-950 text-sky-300 border border-sky-500/30"
                      >
                        {nodeType}
                      </span>
                    ))}
                  </div>

                  {/* Step by Step Editor Instructions */}
                  <div>
                    <h5 className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <ListChecks className="w-4 h-4 text-emerald-400" /> Godot Editor Setup Steps:
                    </h5>
                    <div className="bg-[#080d1a] border border-slate-800 rounded-sm p-3.5 space-y-2">
                      {module.editorSteps.map((step, sIdx) => (
                        <div key={sIdx} className="flex items-start space-x-2.5 text-xs text-slate-300 leading-relaxed">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span className="font-sans">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Key GDScript Snippet if present */}
                  {module.keyGdscriptSnippets && module.keyGdscriptSnippets.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                        <Code2 className="w-4 h-4 text-cyan-400" /> Implementation GDScript Highlight:
                      </h5>
                      {module.keyGdscriptSnippets.map((snip, snIdx) => (
                        <div key={snIdx} className="bg-[#080d1a] border border-sky-500/30 rounded-sm p-3">
                          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800 font-mono">
                            <span className="text-xs text-sky-300 font-bold">{snip.filename}</span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">{snip.explanation}</span>
                          </div>
                          <pre className="font-mono text-xs text-sky-200 overflow-x-auto p-2.5 bg-slate-950 rounded-sm border border-slate-800">
                            {snip.snippet}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* View in GitHub Board link button */}
                  {onSelectStageForGitHub && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => onSelectStageForGitHub(module.title)}
                        className="text-xs font-mono font-bold uppercase tracking-wider text-sky-400 hover:text-sky-300 flex items-center gap-1.5 bg-sky-950 px-4 py-2 rounded-sm border border-sky-500/30 transition-colors shadow"
                      >
                        <span>View GitHub Issues for Stage 0{module.stageNumber || index + 1}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
};
