/**
 * Godot Scene Architect & GitHub Task Generator - Main Application
 */

import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { PromptInputPanel } from './components/PromptInputPanel';
import { NodeHierarchyView } from './components/NodeHierarchyView';
import { ModularPlanningChain } from './components/ModularPlanningChain';
import { GDScriptHub } from './components/GDScriptHub';
import { GitHubProjectBoard } from './components/GitHubProjectBoard';
import { GodotProjectExporter } from './components/GodotProjectExporter';
import { GitHubSyncModal } from './components/GitHubSyncModal';

import { SCENE_PRESETS, ScenePreset } from './data/presets';
import { TranslatedScenePlan, GodotVersion, GodotCameraMode, GitHubIssueItem } from './types';
import { Download, Upload, RotateCcw, CheckCircle2, AlertTriangle } from 'lucide-react';

const BLUEPRINT_STORAGE_KEY = 'godot-scene-architect:blueprint:v1';

function readSavedBlueprint(): TranslatedScenePlan | null {
  if (typeof window === 'undefined') return null;

  try {
    const saved = window.localStorage.getItem(BLUEPRINT_STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as Partial<TranslatedScenePlan>;
    if (
      typeof parsed.sceneTitle !== 'string' ||
      !Array.isArray(parsed.nodeHierarchy) ||
      !Array.isArray(parsed.gdscripts) ||
      !Array.isArray(parsed.issues)
    ) {
      return null;
    }
    return parsed as TranslatedScenePlan;
  } catch {
    return null;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('tree');
  const [godotVersion, setGodotVersion] = useState<GodotVersion>('Godot 4.3');
  const [selectedPresetId, setSelectedPresetId] = useState<string>(() => readSavedBlueprint() ? '' : SCENE_PRESETS[0].id);
  const [currentPlan, setCurrentPlan] = useState<TranslatedScenePlan>(() => readSavedBlueprint() || SCENE_PRESETS[0].samplePlan);
  const [planSource, setPlanSource] = useState<'preset' | 'ai' | 'imported'>(() => readSavedBlueprint() ? 'imported' : 'preset');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    try {
      window.localStorage.setItem(BLUEPRINT_STORAGE_KEY, JSON.stringify(currentPlan));
      setLastSavedAt(new Date());
    } catch (err) {
      console.warn('Unable to save blueprint locally:', err);
    }
  }, [currentPlan]);

  // Handle Preset Selection
  const handleSelectPreset = (preset: ScenePreset) => {
    setSelectedPresetId(preset.id);
    setCurrentPlan(preset.samplePlan);
    setPlanSource('preset');
    setErrorMessage('');
  };

  // Handle Generating Scene Plan from Prompt
  const handleGeneratePlan = async (prompt: string, cameraMode: GodotCameraMode, genre: string) => {
    setIsGenerating(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/translate-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          genre,
          cameraMode,
          godotVersion,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || errData.details || 'Failed to translate scene concept.');
      }

      const generatedData: TranslatedScenePlan = await response.json();

      // Ensure fallback properties if any optional field missing
      const fullPlan: TranslatedScenePlan = {
        sceneTitle: generatedData.sceneTitle || 'Custom Godot Scene',
        description: generatedData.description || 'AI-generated scene layout for Godot Engine.',
        genre: generatedData.genre || genre,
        godotVersion: godotVersion,
        cameraMode: cameraMode,
        nodeHierarchy: generatedData.nodeHierarchy || [],
        modules: generatedData.modules || [],
        gdscripts: generatedData.gdscripts || [],
        tscnContent: generatedData.tscnContent || '',
        projectGodotContent: generatedData.projectGodotContent || `; Engine configuration file for ${godotVersion}\nconfig_version=5\n`,
        milestones: generatedData.milestones || [],
        issues: generatedData.issues || [],
      };

      setCurrentPlan(fullPlan);
      setPlanSource('ai');
      setSelectedPresetId('');
      setActiveTab('tree'); // Switch to Node Dock on generation
    } catch (err: any) {
      console.error('Error generating plan:', err);
      setErrorMessage(err.message || 'An error occurred while generating the Godot scene architecture.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportBlueprint = () => {
    const blob = new Blob([JSON.stringify(currentPlan, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${currentPlan.sceneTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'godot-blueprint'}.blueprint.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBlueprint = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(String(reader.result)) as Partial<TranslatedScenePlan>;
        if (
          typeof imported.sceneTitle !== 'string' ||
          typeof imported.description !== 'string' ||
          !Array.isArray(imported.nodeHierarchy) ||
          !Array.isArray(imported.modules) ||
          !Array.isArray(imported.gdscripts) ||
          !Array.isArray(imported.milestones) ||
          !Array.isArray(imported.issues)
        ) {
          throw new Error('This file is not a complete Godot blueprint.');
        }
        setCurrentPlan(imported as TranslatedScenePlan);
        setSelectedPresetId('');
        setPlanSource('imported');
        setErrorMessage('');
      } catch (err: any) {
        setErrorMessage(err.message || 'Unable to import blueprint JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetBlueprint = () => {
    setCurrentPlan(SCENE_PRESETS[0].samplePlan);
    setSelectedPresetId(SCENE_PRESETS[0].id);
    setPlanSource('preset');
    setErrorMessage('');
  };

  // Handle Script updates
  const handleUpdateScript = (filename: string, newCode: string) => {
    setCurrentPlan((prev) => ({
      ...prev,
      gdscripts: prev.gdscripts.map((sc) =>
        sc.filename === filename ? { ...sc, code: newCode } : sc
      ),
    }));
  };

  // Handle Issue Status Move
  const handleUpdateIssueStatus = (issueId: string, newStatus: GitHubIssueItem['status']) => {
    setCurrentPlan((prev) => ({
      ...prev,
      issues: prev.issues.map((iss) =>
        iss.id === issueId ? { ...iss, status: newStatus } : iss
      ),
    }));
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-sky-500 selection:text-slate-950 pb-16 flex flex-col justify-between">
      <div>
        {/* Top Navigation */}
        <Navbar
          godotVersion={godotVersion}
          onGodotVersionChange={(ver) => setGodotVersion(ver)}
          onOpenGitHubModal={() => setIsGitHubModalOpen(true)}
          onExportZip={() => setActiveTab('project')}
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          isGenerating={isGenerating}
        />

        {/* Main Container */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
          
          {/* Input Prompt Section */}
          <PromptInputPanel
            onGenerate={handleGeneratePlan}
            onSelectPreset={handleSelectPreset}
            isGenerating={isGenerating}
            selectedPresetId={selectedPresetId}
          />

          {/* Error Banner */}
          {errorMessage && (
            <div className="bg-rose-950/80 border border-rose-500/60 p-4 rounded-sm text-rose-200 text-xs flex items-center justify-between shadow-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                <span className="font-mono">{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage('')}
                className="text-slate-400 hover:text-white font-mono font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Current Active Scene Header Summary */}
          <div className="bg-[#010409] border border-slate-800 rounded-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-widest text-sky-400 uppercase bg-sky-950/80 px-2 py-0.5 border border-sky-500/30">
                  ACTIVE SCENE
                </span>
                <h2 className="text-lg font-black text-white uppercase tracking-tight">
                  {currentPlan.sceneTitle}
                </h2>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-sm bg-slate-900 text-sky-400 border border-slate-700">
                  {currentPlan.cameraMode}
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-sm bg-slate-900 text-emerald-400 border border-slate-700">
                  {currentPlan.godotVersion}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {currentPlan.description}
              </p>
            </div>

            <div className="flex items-center space-x-3 text-xs font-mono text-slate-300 bg-slate-950 px-4 py-2.5 rounded-sm border border-slate-800 flex-shrink-0">
              <div><strong className="text-sky-400">{currentPlan.nodeHierarchy.length}</strong> Nodes</div>
              <span className="text-slate-700">|</span>
              <div><strong className="text-cyan-400">{currentPlan.gdscripts.length}</strong> GDScripts</div>
              <span className="text-slate-700">|</span>
              <div><strong className="text-amber-400">{currentPlan.issues.length}</strong> Tasks</div>
            </div>
          </div>

          {/* Blueprint persistence and handoff controls */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-sm px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                {planSource === 'ai' ? 'AI blueprint' : planSource === 'imported' ? 'Imported blueprint' : 'Preset blueprint'}
                {lastSavedAt ? ` · saved locally ${lastSavedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={handleExportBlueprint} className="px-3 py-1.5 rounded-sm border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" /> Save JSON
              </button>
              <label className="px-3 py-1.5 rounded-sm border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> Import JSON
                <input type="file" accept="application/json,.json" onChange={handleImportBlueprint} className="hidden" />
              </label>
              <button onClick={handleResetBlueprint} className="px-3 py-1.5 rounded-sm border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>
          </div>

          {/* Tab Content Views */}
          {activeTab === 'tree' && (
            <NodeHierarchyView
              nodes={currentPlan.nodeHierarchy}
              tscnContent={currentPlan.tscnContent}
              sceneTitle={currentPlan.sceneTitle}
            />
          )}

          {activeTab === 'chain' && (
            <ModularPlanningChain
              modules={currentPlan.modules}
              onSelectStageForGitHub={() => setActiveTab('github')}
            />
          )}

          {activeTab === 'gdscript' && (
            <GDScriptHub
              scripts={currentPlan.gdscripts}
              sceneTitle={currentPlan.sceneTitle}
              onUpdateScript={handleUpdateScript}
            />
          )}

          {activeTab === 'github' && (
            <GitHubProjectBoard
              issues={currentPlan.issues}
              milestones={currentPlan.milestones}
              sceneTitle={currentPlan.sceneTitle}
              onOpenSyncModal={() => setIsGitHubModalOpen(true)}
              onUpdateIssueStatus={handleUpdateIssueStatus}
            />
          )}

          {activeTab === 'project' && (
            <GodotProjectExporter plan={currentPlan} />
          )}

        </main>
      </div>

      {/* GitHub Sync Modal */}
      <GitHubSyncModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        milestones={currentPlan.milestones}
        issues={currentPlan.issues}
      />

      {/* Footer Control / Status */}
      <footer className="mt-12 h-12 bg-[#010409] flex items-center px-6 border-t border-slate-800/90 justify-between text-xs font-mono">
        <div className="flex space-x-6">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Engine Bridge</span>
            <span className="text-[10px] text-sky-400 font-bold">Godot 4.3</span>
          </div>
          <div className="hidden sm:flex items-center space-x-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Latency</span>
            <span className="text-[10px] text-emerald-400">18ms</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex space-x-1 items-center">
            <div className="w-2 h-2 bg-sky-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-sky-400/30 rounded-full"></div>
            <div className="w-2 h-2 bg-sky-400/30 rounded-full"></div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-sky-400">
            SYSTEM OPTIMIZED
          </span>
        </div>
      </footer>

    </div>
  );
}
