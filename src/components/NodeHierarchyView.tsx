import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Box,
  Layers,
  Sun,
  FileCode,
  Sparkles,
  Copy,
  Check,
  Code2,
  Info,
  Settings,
  Eye,
  Sliders
} from 'lucide-react';
import { GodotNodeItem, GodotProperty } from '../types';

interface NodeHierarchyViewProps {
  nodes: GodotNodeItem[];
  tscnContent: string;
  sceneTitle: string;
}

export const NodeHierarchyView: React.FC<NodeHierarchyViewProps> = ({
  nodes,
  tscnContent,
  sceneTitle,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>(nodes[0]?.id || '');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'node-root': true,
    'node-player': true,
    'node-boss': true,
    'node-2d-root': true,
  });
  const [viewMode, setViewMode] = useState<'dock' | 'tscn'>('dock');
  const [copiedTscn, setCopiedTscn] = useState<boolean>(false);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyTscn = () => {
    navigator.clipboard.writeText(tscnContent);
    setCopiedTscn(true);
    setTimeout(() => setCopiedTscn(false), 2000);
  };

  // Find selected node in recursive structure
  const findNodeRecursive = (items: GodotNodeItem[], targetId: string): GodotNodeItem | null => {
    for (const item of items) {
      if (item.id === targetId) return item;
      if (item.children) {
        const found = findNodeRecursive(item.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedNode = findNodeRecursive(nodes, selectedNodeId) || nodes[0];

  // Helper for node type badge colors matching Godot editor color themes
  const getNodeCategoryBadge = (type: string, category?: string) => {
    if (type.endsWith('3D') || category === '3d') {
      return { bg: 'bg-sky-950/80', text: 'text-sky-400', border: 'border-sky-500/30' };
    }
    if (type.endsWith('2D') || category === '2d') {
      return { bg: 'bg-rose-950/80', text: 'text-rose-400', border: 'border-rose-500/30' };
    }
    if (type.includes('Environment') || type.includes('Light') || category === 'environment') {
      return { bg: 'bg-amber-950/80', text: 'text-amber-400', border: 'border-amber-500/30' };
    }
    if (type.includes('Particle') || category === 'particles') {
      return { bg: 'bg-orange-950/80', text: 'text-orange-400', border: 'border-orange-500/30' };
    }
    if (type.includes('Control') || type.includes('UI') || category === 'control') {
      return { bg: 'bg-emerald-950/80', text: 'text-emerald-400', border: 'border-emerald-500/30' };
    }
    return { bg: 'bg-slate-900', text: 'text-slate-300', border: 'border-slate-700' };
  };

  // Render tree item recursively
  const renderTreeItem = (item: GodotNodeItem, depth: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedNodes[item.id] !== false; // default open
    const isSelected = selectedNodeId === item.id;
    const badgeStyle = getNodeCategoryBadge(item.type, item.iconCategory);

    return (
      <div key={item.id} className="select-none">
        <div
          onClick={() => setSelectedNodeId(item.id)}
          style={{ paddingLeft: `${depth * 1.25 + 0.5}rem` }}
          className={`flex items-center justify-between py-1.5 px-2 rounded-sm cursor-pointer transition-all border my-0.5 ${
            isSelected
              ? 'bg-sky-950/80 border-sky-500 text-white shadow-sm font-semibold'
              : 'hover:bg-slate-900 border-transparent text-slate-300'
          }`}
        >
          <div className="flex items-center space-x-2 truncate">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleExpand(item.id, e)}
                className="p-0.5 rounded hover:bg-slate-800 text-slate-400"
              >
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <span className="w-4" />
            )}

            <Box className={`w-3.5 h-3.5 flex-shrink-0 ${badgeStyle.text}`} />

            <span className="font-medium text-xs truncate tracking-wide">{item.name}</span>

            {item.scriptName && (
              <span className="text-[10px] bg-sky-950 text-sky-400 px-1.5 py-0.2 rounded-sm font-mono border border-sky-500/30 uppercase font-bold">
                .gd
              </span>
            )}
          </div>

          <span
            className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-sm border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
          >
            {item.type}
          </span>
        </div>

        {hasChildren && isExpanded && (
          <div className="border-l border-slate-800 ml-3">
            {item.children!.map((child) => renderTreeItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-[#010409] border border-slate-800 rounded-sm p-6 shadow-2xl relative overflow-hidden">
      
      {/* Background Section Index Number */}
      <div className="absolute right-4 top-0 pointer-events-none select-none opacity-10 text-slate-700 font-black text-8xl md:text-9xl tracking-tighter leading-none">
        02
      </div>

      {/* Header View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 relative z-10">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold tracking-widest text-sky-400 uppercase bg-sky-950/60 px-2 py-0.5 border border-sky-500/30">
              02 // SCENE DOCK
            </span>
            <h3 className="font-black text-white text-base uppercase tracking-tight">
              Godot Hierarchy &amp; Inspector
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 uppercase font-mono tracking-wider">
            Interactive Node Tree &amp; Inspector properties for "{sceneTitle}"
          </p>
        </div>

        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-sm border border-slate-800">
          <button
            onClick={() => setViewMode('dock')}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider transition-all rounded-sm flex items-center gap-1.5 ${
              viewMode === 'dock'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Node Dock &amp; Inspector
          </button>
          <button
            onClick={() => setViewMode('tscn')}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider transition-all rounded-sm flex items-center gap-1.5 ${
              viewMode === 'tscn'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-400" />
            Raw .tscn
          </button>
        </div>
      </div>

      {viewMode === 'dock' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4 relative z-10">
          
          {/* Left Column: Node Tree Dock */}
          <div className="lg:col-span-6 bg-slate-950 border border-slate-800 rounded-sm p-4 min-h-[420px] max-h-[580px] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                <Box className="w-3.5 h-3.5 text-sky-400" /> Scene Dock ({nodes.length} top nodes)
              </span>
              <span className="text-[10px] text-slate-500 font-mono uppercase">
                Godot 4 Tree
              </span>
            </div>

            <div className="space-y-0.5">
              {nodes.map((node) => renderTreeItem(node))}
            </div>
          </div>

          {/* Right Column: Inspector Panel */}
          <div className="lg:col-span-6 bg-slate-950 border border-slate-800 rounded-sm p-5 flex flex-col justify-between">
            {selectedNode ? (
              <div className="space-y-4">
                
                {/* Node Title & Badge */}
                <div className="border-b border-slate-800 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-widest flex items-center gap-1">
                      <Settings className="w-3.5 h-3.5 text-slate-400" /> Inspector Dock
                    </span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-sm bg-sky-950 text-sky-300 border border-sky-500/30 uppercase">
                      {selectedNode.type}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-lg text-white mt-1.5 flex items-center gap-2">
                    {selectedNode.name}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {selectedNode.description}
                  </p>
                </div>

                {/* Attached Script Badge */}
                {selectedNode.scriptName && (
                  <div className="bg-sky-950/40 border border-sky-500/30 rounded-sm p-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <FileCode className="w-4 h-4 text-sky-400" />
                      <div>
                        <div className="text-xs font-mono font-bold uppercase text-sky-200">Attached GDScript</div>
                        <div className="text-[11px] font-mono text-sky-400 font-semibold">{selectedNode.scriptName}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Properties Table */}
                <div>
                  <h5 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Sliders className="w-3 h-3 text-amber-400" /> Configured Properties
                  </h5>
                  {selectedNode.properties && selectedNode.properties.length > 0 ? (
                    <div className="bg-[#080d1a] border border-slate-800 rounded-sm overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-900 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                          <tr>
                            <th className="px-3 py-2">Property</th>
                            <th className="px-3 py-2">Type</th>
                            <th className="px-3 py-2">Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 font-mono text-slate-200">
                          {selectedNode.properties.map((prop: GodotProperty, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-900/50">
                              <td className="px-3 py-2 text-sky-300 font-bold">{prop.name}</td>
                              <td className="px-3 py-2 text-slate-400 text-[11px]">{prop.type}</td>
                              <td className="px-3 py-2 text-emerald-400 font-bold">{prop.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic bg-[#080d1a] p-3 rounded-sm border border-slate-800">
                      Standard Godot default inspector properties apply.
                    </p>
                  )}
                </div>

                {/* Godot Editor Setup Hint */}
                <div className="bg-[#080d1a] border border-sky-500/20 rounded-sm p-3 text-xs text-slate-300">
                  <div className="font-mono text-[10px] font-bold text-sky-400 mb-1 flex items-center gap-1 uppercase tracking-wider">
                    <Info className="w-3.5 h-3.5" /> Editor Dock Steps:
                  </div>
                  <p className="text-slate-400 leading-normal font-sans">
                    In Godot 4 Editor, right-click parent node → <strong className="text-slate-200">Add Child Node</strong> → Search <span className="font-mono text-sky-300">"{selectedNode.type}"</span> → Rename to <span className="font-mono text-emerald-400">"{selectedNode.name}"</span>.
                  </p>
                </div>

              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs font-mono">
                Select a node from the Scene Dock to view properties.
              </div>
            )}
          </div>

        </div>
      ) : (
        /* Raw TSCN View Mode */
        <div className="mt-4 space-y-3 relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-emerald-400" />
              res://scenes/main_scene.tscn
            </span>
            <button
              onClick={handleCopyTscn}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-sm bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors shadow"
            >
              {copiedTscn ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedTscn ? 'Copied TSCN!' : 'Copy TSCN File'}</span>
            </button>
          </div>

          <pre className="bg-[#080d1a] border border-slate-800 rounded-sm p-4 font-mono text-xs text-emerald-300 overflow-x-auto max-h-[500px] leading-relaxed shadow-inner">
            {tscnContent}
          </pre>
        </div>
      )}

    </div>
  );
};
