import React, { useState } from 'react';
import { Sparkles, Wand2, Compass, Layers, Bot, Lightbulb } from 'lucide-react';
import { SCENE_PRESETS, ScenePreset } from '../data/presets';
import { GodotCameraMode } from '../types';

interface PromptInputPanelProps {
  onGenerate: (prompt: string, cameraMode: GodotCameraMode, genre: string) => void;
  onSelectPreset: (preset: ScenePreset) => void;
  isGenerating: boolean;
  selectedPresetId?: string;
}

export const PromptInputPanel: React.FC<PromptInputPanelProps> = ({
  onGenerate,
  onSelectPreset,
  isGenerating,
  selectedPresetId,
}) => {
  const [prompt, setPrompt] = useState<string>(
    'A dark fantasy boss arena set atop an ancient crumbling obsidian tower. Features two boss phases, falling arena platforms, volumetric dynamic lighting with lava glow, boss state machine, and player dodge roll mechanics.'
  );
  const [cameraMode, setCameraMode] = useState<GodotCameraMode>('3D');
  const [genre, setGenre] = useState<string>('Action RPG / Souls-like');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;
    onGenerate(prompt.trim(), cameraMode, genre);
  };

  return (
    <div className="bg-[#010409] border border-slate-800 rounded-sm p-6 shadow-2xl mb-6 relative overflow-hidden">
      
      {/* Background Section Index Number */}
      <div className="absolute right-4 top-0 pointer-events-none select-none opacity-10 text-slate-700 font-black text-8xl md:text-9xl tracking-tighter leading-none">
        01
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
        
        {/* Header Title & Presets bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold tracking-widest text-sky-400 uppercase bg-sky-950/60 px-2 py-0.5 border border-sky-500/30">
                01 // SCENE DECONSTRUCTION
              </span>
              <h2 className="text-base font-black text-white uppercase tracking-tight">
                Concept Prompt Input
              </h2>
            </div>
            <p className="text-[11px] font-mono text-slate-400 mt-1 uppercase tracking-wider">
              Describe scene concept — AI auto-translates to Godot 4 Nodes + GDScripts + GitHub Tasks
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              Presets:
            </span>
            {SCENE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setPrompt(preset.prompt);
                  setCameraMode(preset.cameraMode);
                  setGenre(preset.genre);
                  onSelectPreset(preset);
                }}
                className={`px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wider rounded-sm border transition-all whitespace-nowrap ${
                  selectedPresetId === preset.id
                    ? 'bg-sky-950/80 border-sky-400 text-sky-300 shadow'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'
                }`}
              >
                {preset.title}
              </button>
            ))}
          </div>
        </div>

        {/* Text Area Prompt */}
        <div className="relative">
          <textarea
            id="scene-prompt-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="Describe your game scene idea (e.g. A cyberpunk hallway with laser traps, hacking terminals, guard patrol AI, and tilemap lights...)"
            className="w-full bg-[#080d1a] border border-slate-800 rounded-sm p-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors resize-y font-sans leading-relaxed shadow-inner"
          />
        </div>

        {/* Controls Bar: Camera Mode, Genre, Generate Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-1">
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Camera Mode */}
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-sm border border-slate-800">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-sky-400" /> Mode:
              </span>
              {(['3D', '2D', '2.5D'] as GodotCameraMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setCameraMode(mode)}
                  className={`px-3 py-1 text-xs font-mono font-bold uppercase transition-all rounded-sm ${
                    cameraMode === mode
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Genre Input */}
            <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-sm border border-slate-800">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Genre:</span>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="e.g. Action RPG, Platformer"
                className="bg-transparent text-xs text-sky-300 font-mono font-bold focus:outline-none w-32 sm:w-44 uppercase"
              />
            </div>
          </div>

          {/* Action Submit Button */}
          <button
            id="generate-plan-btn"
            type="submit"
            disabled={isGenerating || !prompt.trim()}
            className="flex items-center justify-center space-x-2 px-6 py-3 rounded-sm bg-sky-600 hover:bg-sky-500 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-sky-600/20 transition-all border border-sky-400/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Bot className="w-4 h-4 animate-spin text-sky-200" />
                <span>Deconstructing Scene Structure...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>Deconstruct Scene Blueprint</span>
              </>
            )}
          </button>
        </div>

        {/* Prompt Suggestions Footer */}
        <div className="flex items-center gap-2 pt-2 text-xs text-slate-400 border-t border-slate-800/80">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span className="font-sans">
            <strong className="text-slate-200 uppercase font-mono text-[10px] tracking-wider">Pro-tip:</strong> Include mechanics (grapple hook, boss phases, lava shaders, particle systems) for rich node hierarchies and GDScripts.
          </span>
        </div>

      </form>
    </div>
  );
};

