import { describe, it, expect } from 'vitest';
import { parseScenePlan, boundedNodeItemSchema } from './scenePlan';
import { SCENE_PRESETS } from '../data/presets';
import { z } from 'zod';

describe('Scene Plan Zod Schema & Parser', () => {
  it('should successfully round-trip the two presets unchanged', () => {
    for (const preset of SCENE_PRESETS) {
      const result = parseScenePlan(preset.samplePlan);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.plan.sceneTitle).toBe(preset.samplePlan.sceneTitle);
        expect(result.plan.cameraMode).toBe(preset.samplePlan.cameraMode);
        expect(result.plan.godotVersion).toBe(preset.samplePlan.godotVersion);
        expect(result.plan.nodeHierarchy.length).toBe(preset.samplePlan.nodeHierarchy.length);
        expect(result.plan.modules.length).toBe(preset.samplePlan.modules.length);
        expect(result.plan.gdscripts.length).toBe(preset.samplePlan.gdscripts.length);
        expect(result.plan.milestones.length).toBe(preset.samplePlan.milestones.length);
        expect(result.plan.issues.length).toBe(preset.samplePlan.issues.length);
      }
    }
  });

  it('should apply defaults for a truncated or empty object', () => {
    const result = parseScenePlan({});
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.plan.sceneTitle).toBe('Custom Godot Scene');
      expect(result.plan.description).toBe('AI-generated scene layout for Godot Engine.');
      expect(result.plan.genre).toBe('Action / Adventure');
      expect(result.plan.godotVersion).toBe('Godot 4.3');
      expect(result.plan.cameraMode).toBe('3D');
      expect(result.plan.nodeHierarchy).toEqual([]);
      expect(result.plan.modules).toEqual([]);
      expect(result.plan.gdscripts).toEqual([]);
      expect(result.plan.milestones).toEqual([]);
      expect(result.plan.issues).toEqual([]);
      expect(result.plan.projectGodotContent).toContain('Engine configuration file');
    }
  });

  it('should return ok: false for garbage inputs', () => {
    // String is invalid
    const result1 = parseScenePlan('garbage');
    expect(result1.ok).toBe(false);
    expect(result1.issues).toBeDefined();

    // Array is invalid
    const result2 = parseScenePlan([]);
    expect(result2.ok).toBe(false);
    expect(result2.issues).toBeDefined();

    // null is invalid
    const result3 = parseScenePlan(null);
    expect(result3.ok).toBe(false);
    expect(result3.issues).toBeDefined();

    // Field types totally wrong and cannot be parsed or coerced
    const result4 = parseScenePlan({
      sceneTitle: 12345, // will coerce or fail depending on schema? Wait, sceneTitle is z.string(). Since it's not coerced, 12345 should fail or maybe pass if not strict? Actually z.string() rejects numbers.
      godotVersion: 'Godot 5.0', // invalid enum
    });
    expect(result4.ok).toBe(false);
  });

  it('should robustly preprocess iconCategory to lower case and fallback to node', () => {
    const input = {
      nodeHierarchy: [
        {
          id: '1',
          name: 'MyNode',
          type: 'Node',
          iconCategory: 'PHYSICS', // uppercase
        },
        {
          id: '2',
          name: 'AnotherNode',
          type: 'Node',
          iconCategory: 'invalid-category-here', // invalid
        }
      ]
    };

    const result = parseScenePlan(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.plan.nodeHierarchy[0].iconCategory).toBe('physics');
      expect(result.plan.nodeHierarchy[1].iconCategory).toBe('node');
    }
  });

  it('should gracefully coerce fields with defaults', () => {
    const input = {
      modules: [
        {
          id: 'm1',
          estimatedHours: '8', // string number coerced to number
        }
      ],
      issues: [
        {
          id: 'iss-1',
          status: 'IN-PROGRESS', // preprocessing converts to in_progress
          type: 'SCRIPTING', // preprocessing converts to scripting
        }
      ],
      milestones: [
        {
          id: 'ms-1',
          dueDateWeeks: '2', // coerced to number
          state: 'CLOSED', // preprocessing converts to closed
        }
      ]
    };

    const result = parseScenePlan(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.plan.modules[0].estimatedHours).toBe(8);
      expect(result.plan.issues[0].status).toBe('in_progress');
      expect(result.plan.issues[0].type).toBe('scripting');
      expect(result.plan.milestones[0].dueDateWeeks).toBe(2);
      expect(result.plan.milestones[0].state).toBe('closed');
    }
  });

  describe('boundedNodeItemSchema', () => {
    it('should generate a non-recursive schema with correct max depth', () => {
      const maxDepth = 3;
      const schema = boundedNodeItemSchema(maxDepth);

      // Verify that boundedNodeItemSchema(3) is a Zod schema
      expect(schema).toBeInstanceOf(z.ZodType);

      // Deepest level (level 3, indexing from 0 as level 0, 1, 2, 3)
      // Level 0: has children
      // Level 1: has children
      // Level 2: has children
      // Level 3: has no children (omitted)

      // Let's parse valid 3-level deep data
      const validData = {
        id: '0',
        name: 'root',
        type: 'Node3D',
        children: [
          {
            id: '1',
            name: 'child-level-1',
            type: 'Node3D',
            children: [
              {
                id: '2',
                name: 'child-level-2',
                type: 'Node3D',
                children: [
                  {
                    id: '3',
                    name: 'child-level-3',
                    type: 'Node3D',
                    // Level 3 should not have children parsed (it's omitted from schema)
                  }
                ]
              }
            ]
          }
        ]
      };

      const parseResult = schema.safeParse(validData);
      expect(parseResult.success).toBe(true);
      if (parseResult.success) {
        const parsed = parseResult.data;
        expect(parsed.name).toBe('root');
        expect(parsed.children[0].name).toBe('child-level-1');
        expect(parsed.children[0].children[0].name).toBe('child-level-2');
        expect(parsed.children[0].children[0].children[0].name).toBe('child-level-3');
        // Check that children is not present or is unconstrained at level 3
        expect(parsed.children[0].children[0].children[0].children).toBeUndefined();
      }
    });

    it('should handle depth 0 correctly', () => {
      const schema = boundedNodeItemSchema(0);
      const data = {
        id: '0',
        name: 'root',
        type: 'Node3D',
        children: [] // Should be ignored or stripped because depth 0 doesn't have children
      };
      const parseResult = schema.safeParse(data);
      expect(parseResult.success).toBe(true);
      if (parseResult.success) {
        expect(parseResult.data.children).toBeUndefined();
      }
    });
  });
});
