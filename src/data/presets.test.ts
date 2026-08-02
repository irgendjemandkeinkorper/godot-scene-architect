import { describe, it, expect } from 'vitest';
import { SCENE_PRESETS } from './presets';

describe('SCENE_PRESETS presets validation smoke tests', () => {
  it('should have at least the two standard presets', () => {
    expect(Array.isArray(SCENE_PRESETS)).toBe(true);
    expect(SCENE_PRESETS.length).toBeGreaterThanOrEqual(2);
  });

  it('should satisfy TranslatedScenePlan TS shape at runtime for each preset', () => {
    SCENE_PRESETS.forEach((preset) => {
      expect(preset).toBeDefined();
      expect(preset.id).toBeTypeOf('string');
      expect(preset.title).toBeTypeOf('string');
      expect(preset.genre).toBeTypeOf('string');
      expect(preset.cameraMode).toMatch(/^(3D|2D|2\.5D)$/);
      expect(preset.prompt).toBeTypeOf('string');
      expect(preset.summary).toBeTypeOf('string');

      const plan = preset.samplePlan;
      expect(plan).toBeDefined();
      expect(plan.sceneTitle).toBeTypeOf('string');
      expect(plan.sceneTitle.length).toBeGreaterThan(0);
      expect(plan.description).toBeTypeOf('string');
      expect(plan.genre).toBeTypeOf('string');
      expect(plan.godotVersion).toBeTypeOf('string');
      expect(plan.cameraMode).toMatch(/^(3D|2D|2\.5D)$/);

      // nodeHierarchy non-empty, required arrays present
      expect(Array.isArray(plan.nodeHierarchy)).toBe(true);
      expect(plan.nodeHierarchy.length).toBeGreaterThan(0);

      expect(Array.isArray(plan.modules)).toBe(true);
      expect(Array.isArray(plan.gdscripts)).toBe(true);

      expect(plan.tscnContent).toBeTypeOf('string');
      expect(plan.projectGodotContent).toBeTypeOf('string');

      expect(Array.isArray(plan.milestones)).toBe(true);
      expect(Array.isArray(plan.issues)).toBe(true);
    });
  });
});
