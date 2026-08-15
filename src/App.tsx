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
import { parseScenePlan } from './schema/scenePlan';
import { Run, hashBrief } from './runs/types';
import { estimateCost } from './runs/cost';
import { Download, Upload, RotateCcw, CheckCircle2, AlertTriangle } from 'lucide-react';

const BLUEPRINT_STORAGE_KEY = 'godot-scene-architect:blueprint:v1';
const RUN_STORAGE_KEY = 'godot-scene-architect:run:v2';

function readSavedBlueprint(): TranslatedScenePlan | null {
  if (typeof window === 'undefined') return null;

  try {
    const saved = window.localStorage.getItem(BLUEPRINT_STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    const result = parseScenePlan(parsed);
    if (result.ok) {
      return result.plan;
    }
    return null;
  } catch {
    return null;
  }
}

function createRun(plan: TranslatedScenePlan, provider: string, brief: Run['brief']): Run {
  return {
    id: `run-${Date.now()}`,
    briefHash: hashBrief(brief),
    brief,
    provider,
    model: provider === 'preset' ? 'Preset' : 'Imported blueprint',
    status: 'succeeded',
    startedAt: Date.now(),
    plan,
  };
}

function readSavedRun(): Run | null {
  if (typeof window === 'undefined') return null;
  try {
    const savedRun = window.localStorage.getItem(RUN_STORAGE_KEY);
    if (savedRun) {
      const parsed = JSON.parse(savedRun) as Run;
      if (parsed?.plan && parsed.status && parsed.briefHash) return parsed;
    }
    const blueprint = readSavedBlueprint();
    if (!blueprint) return null;
    const brief = {
      prompt: blueprint.sceneTitle,
      genre: blueprint.genre,
      cameraMode: blueprint.cameraMode,
      godotVersion: blueprint.godotVersion,
    };
    const run = createRun(blueprint, 'import', brief);
    window.localStorage.setItem(RUN_STORAGE_KEY, JSON.stringify(run));
    return run;
  } catch {
    return null;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('tree');
  const [godotVersion, setGodotVersion] = useState<GodotVersion>('Godot 4.3');
  const [selectedPresetId, setSelectedPresetId] = useState<string>(() => readSavedRun() ? '' : SCENE_PRESETS[0].id);
  const [currentRun, setCurrentRun] = useState<Run>(() => readSavedRun() || createRun(
    SCENE_PRESETS[0].samplePlan,
    'preset',
    { prompt: SCENE_PRESETS[0].samplePlan.sceneTitle, genre: SCENE_PRESETS[0].samplePlan.genre, cameraMode: SCENE_PRESETS[0].samplePlan.cameraMode, godotVersion: SCENE_PRESETS[0].samplePlan.godotVersion },
  ));
  const currentPlan = currentRun.plan || SCENE_PRESETS[0].samplePlan;
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [rawOutput, setRawOutput] = useState<string>('');

  useEffect(() => {
    try {
      window.localStorage.setItem(RUN_STORAGE_KEY, JSON.stringify(currentRun));
      setLastSavedAt(new Date());
    } catch (err) {
      console.warn('Unable to save blueprint locally:', err);
    }
  }, [currentRun]);

  // Handle Preset Selection
  const handleSelectPreset = (preset: ScenePreset) => {
    setSelectedPresetId(preset.id);
    setCurrentRun(createRun(preset.samplePlan, 'preset', {
      prompt: preset.samplePlan.sceneTitle,
      genre: preset.samplePlan.genre,
      cameraMode: preset.samplePlan.cameraMode,
      godotVersion: preset.samplePlan.godotVersion,
    }));
    setErrorMessage('');
  };

  // Handle Generating Scene Plan from Prompt
  const handleGeneratePlan = async (prompt: string, cameraMode: GodotCameraMode, genre: string) => {
    setIsGenerating(true);
    setErrorMessage('');
    setRawOutput('');
    const brief = { prompt, genre, cameraMode, godotVersion };
    const startedAt = Date.now();

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
        setRawOutput(typeof errData.rawOutput === 'string' ? errData.rawOutput : '');
        throw new Error(errData.error || errData.details || 'Failed to translate scene concept.');
      }

      const generatedResult = await response.json();
      const generatedData: TranslatedScenePlan = generatedResult.plan;

      // Ensure fallback properties if any optional field missing
      const fullPlan = { ...generatedData, genre: generatedData.genre || genre, godotVersion, cameraMode };
      const usage = generatedResult.usage;
      const provider = generatedResult.provider || 'gemini';
      const model = generatedResult.model || 'unknown';
      setCurrentRun({
        id: `run-${Date.now()}`,
        briefHash: hashBrief(brief),
        brief,
        provider,
        model,
        status: 'succeeded',
        startedAt: generatedResult.timings?.startedAt || startedAt,
        latencyMs: generatedResult.timings?.latencyMs ?? Date.now() - startedAt,
        usage,
        costEstimateUSD: generatedResult.costEstimateUSD ?? estimateCost(usage, undefined),
        plan: fullPlan,
      });
      setSelectedPresetId('');
      setActiveTab('tree'); // Switch to Node Dock on generation
    } catch (err: any) {
      console.error('Error generating plan:', err);
      setCurrentRun((previous) => ({ ...previous, status: 'failed', error: err.message || String(err) }));
      setErrorMessage(err.message || 'An error occurred while generating the Godot scene architecture.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadRawOutput = () => {
    const blob = new Blob([rawOutput], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'godot-scene-model-output.txt';
    anchor.click();
    URL.revokeObjectURL(url);
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
        const parsed = JSON.parse(String(reader.result));
        const result = parseScenePlan(parsed);
        if (!result.ok) {
          throw new Error('This file is not a complete Godot blueprint.');
        }
        setCurrentRun(createRun(result.plan, 'import', {
          prompt: result.plan.sceneTitle,
          genre: result.plan.genre,
          cameraMode: result.plan.cameraMode,
          godotVersion: result.plan.godotVersion,
        }));
        setSelectedPresetId('');
        setErrorMessage('');
      } catch (err: any) {
        setErrorMessage(err.message || 'Unable to import blueprint JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetBlueprint = () => {
    setCurrentRun(createRun(SCENE_PRESETS[0].samplePlan, 'preset', {
      prompt: SCENE_PRESETS[0].samplePlan.sceneTitle,
      genre: SCENE_PRESETS[0].samplePlan.genre,
      cameraMode: SCENE_PRESETS[0].samplePlan.cameraMode,
      godotVersion: SCENE_PRESETS[0].samplePlan.godotVersion,
    }));
    setSelectedPresetId(SCENE_PRESETS[0].id);
    setErrorMessage('');
  };

  // Handle Script updates
  const handleUpdateScript = (filename: string, newCode: string) => {
    setCurrentRun((prev) => ({ ...prev, plan: {
      ...(prev.plan || currentPlan),
      gdscripts: (prev.plan || currentPlan).gdscripts.map((sc) => sc.filename === filename ? { ...sc, code: newCode } : sc),
    } }));
  };

  // Handle Issue Status Move
  const handleUpdateIssueStatus = (issueId: string, newStatus: GitHubIssueItem['status']) => {
    setCurrentRun((prev) => ({ ...prev, plan: {
      ...(prev.plan || currentPlan),
      issues: (prev.plan || currentPlan).issues.map((iss) => iss.id === issueId ? { ...iss, status: newStatus } : iss),
    } }));
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
              <div className="flex items-center gap-3">
                {rawOutput && (
                  <button onClick={handleDownloadRawOutput} className="text-rose-200 hover:text-white font-mono uppercase tracking-wider">
                    Download raw output
                  </button>
                )}
                <button
                  onClick={() => { setErrorMessage(''); setRawOutput(''); }}
                  className="text-slate-400 hover:text-white font-mono font-bold"
                >
                  ✕
                </button>
              </div>
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
                {currentRun.provider === 'preset' ? 'Preset blueprint' : currentRun.provider === 'import' ? 'Imported blueprint' : `${currentRun.provider} · ${currentRun.model}`}
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
            <span className="text-[10px] text-sky-400 font-bold">{godotVersion}</span>
          </div>
          <div className="text-[10px] text-slate-500 uppercase tracking-widest">
            {currentRun.provider} · {currentRun.model}
            {currentRun.latencyMs != null ? ` · ${currentRun.latencyMs}ms` : ''}
            {currentRun.usage?.inputTokens != null ? ` · ${currentRun.usage.inputTokens + (currentRun.usage.outputTokens || 0)} tokens` : ''}
            {currentRun.costEstimateUSD != null ? ` · $${currentRun.costEstimateUSD.toFixed(4)}` : ''}
          </div>
        </div>
      </footer>

    </div>
  );
}
