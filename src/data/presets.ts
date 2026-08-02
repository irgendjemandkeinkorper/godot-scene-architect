import { TranslatedScenePlan } from '../types';

export interface ScenePreset {
  id: string;
  title: string;
  genre: string;
  cameraMode: '3D' | '2D' | '2.5D';
  prompt: string;
  summary: string;
  samplePlan: TranslatedScenePlan;
}

export const SCENE_PRESETS: ScenePreset[] = [
  {
    id: 'boss-arena-3d',
    title: 'Crumbling Obsidian Boss Arena',
    genre: 'Action RPG / Souls-like',
    cameraMode: '3D',
    summary: '3D boss fight with phase transitions, dynamic arena crumble hazards, volumetric fog, and state chart AI.',
    prompt: 'A dark fantasy boss arena set atop an ancient crumbling obsidian tower. Features two boss phases, falling arena platforms, volumetric dynamic lighting with lava glow, boss state machine, and player dodge roll mechanics.',
    samplePlan: {
      sceneTitle: 'Crumbling Obsidian Boss Arena',
      description: 'Dynamic 3D Dark Fantasy Boss Battleground featuring destruction mechanics, multi-phase boss state machine, dynamic lighting, and environmental hazards in Godot 4.',
      genre: 'Action RPG / Dark Fantasy',
      godotVersion: 'Godot 4.3',
      cameraMode: '3D',
      nodeHierarchy: [
        {
          id: 'node-root',
          name: 'BossArenaScene',
          type: 'Node3D',
          iconCategory: '3d',
          description: 'Root scene node managing world environment, boss state transitions, and arena hazards.',
          properties: [
            { name: 'process_mode', type: 'ProcessMode', value: 'PROCESS_MODE_INHERIT' }
          ],
          children: [
            {
              id: 'node-env',
              name: 'WorldEnvironment',
              type: 'WorldEnvironment',
              iconCategory: 'environment',
              description: 'Glow, volumetric fog, dark ambient lighting and sky shader.',
              properties: [
                { name: 'environment/background_mode', type: 'enum', value: 'BG_SKY' },
                { name: 'environment/glow_enabled', type: 'bool', value: 'true' },
                { name: 'environment/volumetric_fog_enabled', type: 'bool', value: 'true' },
                { name: 'environment/volumetric_fog_density', type: 'float', value: '0.04' }
              ]
            },
            {
              id: 'node-sun',
              name: 'LavaSunLight',
              type: 'DirectionalLight3D',
              iconCategory: '3d',
              description: 'Primary atmospheric key light with warm lava glow tint.',
              properties: [
                { name: 'light_color', type: 'Color', value: 'Color(1.0, 0.35, 0.1, 1.0)' },
                { name: 'light_energy', type: 'float', value: '2.5' },
                { name: 'shadow_enabled', type: 'bool', value: 'true' }
              ]
            },
            {
              id: 'node-player',
              name: 'PlayerCharacter',
              type: 'CharacterBody3D',
              iconCategory: 'physics',
              scriptName: 'res://scripts/player_controller.gd',
              description: '3D player character with stamina-based dodge rolling, camera arm spring, and lock-on target system.',
              properties: [
                { name: 'collision_layer', type: 'int', value: '1 (Player)' },
                { name: 'collision_mask', type: 'int', value: '6 (World + Boss + Hazards)' }
              ],
              children: [
                {
                  id: 'node-player-col',
                  name: 'CollisionCapsule',
                  type: 'CollisionShape3D',
                  iconCategory: 'physics',
                  description: 'Capsule collision shape for player body.',
                  properties: [{ name: 'shape', type: 'CapsuleShape3D', value: 'Radius: 0.4m, Height: 1.8m' }]
                },
                {
                  id: 'node-springarm',
                  name: 'CameraSpringArm',
                  type: 'SpringArm3D',
                  iconCategory: '3d',
                  description: 'SpringArm for collision-free third-person camera orbiting.',
                  properties: [{ name: 'spring_length', type: 'float', value: '4.5' }],
                  children: [
                    {
                      id: 'node-camera',
                      name: 'Main3DCamera',
                      type: 'Camera3D',
                      iconCategory: '3d',
                      description: 'Primary third-person active camera with camera shake trauma script.',
                      properties: [{ name: 'fov', type: 'float', value: '75.0' }]
                    }
                  ]
                }
              ]
            },
            {
              id: 'node-boss',
              name: 'ObsidianTitanBoss',
              type: 'CharacterBody3D',
              iconCategory: 'physics',
              scriptName: 'res://scripts/boss_ai_state_machine.gd',
              description: 'Boss character with phase 1 slash combo, phase 2 lava floor slam, and dynamic health threshold signals.',
              properties: [
                { name: 'collision_layer', type: 'int', value: '2 (Enemy)' },
                { name: 'collision_mask', type: 'int', value: '5 (World + Player)' }
              ],
              children: [
                {
                  id: 'node-boss-col',
                  name: 'BossCollision',
                  type: 'CollisionShape3D',
                  iconCategory: 'physics',
                  description: 'Large cylinder collision volume.',
                  properties: [{ name: 'shape', type: 'CylinderShape3D', value: 'Radius: 1.5m, Height: 3.5m' }]
                },
                {
                  id: 'node-boss-hurtbox',
                  name: 'HurtboxArea',
                  type: 'Area3D',
                  iconCategory: 'physics',
                  description: 'Area3D detecting incoming player attack hitboxes.',
                  properties: [{ name: 'monitoring', type: 'bool', value: 'true' }]
                },
                {
                  id: 'node-boss-particles',
                  name: 'Phase2LavaEmbers',
                  type: 'GPUParticles3D',
                  iconCategory: 'particles',
                  description: 'GPU particle emitter emitting fiery ember sparks in phase 2.',
                  properties: [{ name: 'amount', type: 'int', value: '250' }]
                }
              ]
            },
            {
              id: 'node-arena-geom',
              name: 'ArenaGeometry',
              type: 'Node3D',
              iconCategory: '3d',
              description: 'Container for static floor platforms and breaking pillar chunks.',
              properties: [],
              children: [
                {
                  id: 'node-floor-center',
                  name: 'MainArenaFloor',
                  type: 'StaticBody3D',
                  iconCategory: 'physics',
                  description: 'Obsidian center platform with static collision body.',
                  properties: [{ name: 'collision_layer', type: 'int', value: '4 (Environment)' }]
                },
                {
                  id: 'node-crumble-zone',
                  name: 'OuterCrumblingPlatforms',
                  type: 'Node3D',
                  iconCategory: '3d',
                  scriptName: 'res://scripts/crumbling_floor_manager.gd',
                  description: 'Manages timed floor collapses triggered when boss reaches Phase 2.',
                  properties: [{ name: 'collapse_delay', type: 'float', value: '2.5s' }]
                }
              ]
            }
          ]
        }
      ],
      modules: [
        {
          id: 'mod-1',
          stageNumber: 1,
          title: 'Scene Architecture & Lighting Setup',
          description: 'Establish Godot 3D WorldEnvironment, volumetric fog, key directional lights, and obsidian platform collision geometry.',
          estimatedHours: 4,
          editorSteps: [
            'In Godot Scene Dock, create a new 3D Scene with Node3D named "BossArenaScene".',
            'Add child node "WorldEnvironment". Create a new Environment resource in Inspector.',
            'Enable Glow (Bicubic mode) and Volumetric Fog with Density set to 0.04 and Color set to Dark Charcoal.',
            'Add child "DirectionalLight3D" named "LavaSunLight". Set color to Warm Lava Orange (Hex #FF591A) and enable Shadow Max Distance to 60m.'
          ],
          godotNodesInvolved: ['Node3D', 'WorldEnvironment', 'DirectionalLight3D', 'StaticBody3D', 'CollisionShape3D']
        },
        {
          id: 'mod-2',
          stageNumber: 2,
          title: 'Third-Person Player Controller & SpringArm',
          description: 'Implement CharacterBody3D player movement, stamina-based dodge roll iframe mechanics, and SpringArm3D camera orbiting.',
          estimatedHours: 6,
          editorSteps: [
            'Add CharacterBody3D named "PlayerCharacter". Attach script "res://scripts/player_controller.gd".',
            'Add Capsule CollisionShape3D (radius 0.4m, height 1.8m).',
            'Add SpringArm3D node with Spring Length set to 4.5m and position at head offset Y = 1.6m.',
            'Add Camera3D child to SpringArm3D and check Current = true in Inspector.'
          ],
          godotNodesInvolved: ['CharacterBody3D', 'CollisionShape3D', 'SpringArm3D', 'Camera3D'],
          keyGdscriptSnippets: [
            {
              filename: 'res://scripts/player_controller.gd',
              snippet: 'extends CharacterBody3D\n\n@export var SPEED: float = 6.0\n@export var DODGE_SPEED: float = 12.0\nvar is_dodging: bool = false\n\nfunc _physics_process(delta: float) -> void:\n    if not is_on_floor():\n        velocity.y -= 20.0 * delta\n    move_and_slide()',
              explanation: 'Applies gravity and handles move_and_slide for Godot 4.3 CharacterBody3D movement.'
            }
          ]
        },
        {
          id: 'mod-3',
          stageNumber: 3,
          title: 'Boss AI State Machine & Phase Transition System',
          description: 'Build Boss CharacterBody3D state chart engine handling Idle, Slash Combo, Lava Ground Slam, and Phase 2 Enrage.',
          estimatedHours: 8,
          editorSteps: [
            'Create CharacterBody3D named "ObsidianTitanBoss". Set Collision Layer to 2 (Enemy).',
            'Attach script "res://scripts/boss_ai_state_machine.gd".',
            'Add Area3D named "HurtboxArea" with CylinderShape3D for detecting player sword swings.',
            'Add GPUParticles3D named "Phase2LavaEmbers" with ProcessMaterial emissive particle shader.'
          ],
          godotNodesInvolved: ['CharacterBody3D', 'Area3D', 'GPUParticles3D', 'AnimationPlayer']
        },
        {
          id: 'mod-4',
          stageNumber: 4,
          title: 'Crumbling Arena Floor Hazards & Lava Collapse',
          description: 'Script platform crumbling manager that emits warnings, shakes platform meshes, and drops obsidian floor tiles into lava.',
          estimatedHours: 5,
          editorSteps: [
            'Group outer floor mesh instances under "OuterCrumblingPlatforms" Node3D.',
            'Attach script "res://scripts/crumbling_floor_manager.gd".',
            'Connect signal `boss_phase_2_started` from Titan Boss script to `trigger_arena_collapse()`.'
          ],
          godotNodesInvolved: ['Node3D', 'StaticBody3D', 'Tween', 'Area3D']
        }
      ],
      gdscripts: [
        {
          filename: 'res://scripts/player_controller.gd',
          nodeTarget: 'PlayerCharacter (CharacterBody3D)',
          description: '3D Third-person player controller with stamina, dodge roll i-frames, and rotation facing camera direction.',
          code: `extends CharacterBody3D

signal stamina_changed(current_stamina: float, max_stamina: float)

@export_category("Movement Settings")
@export var max_speed: float = 7.0
@export var acceleration: float = 24.0
@export var friction: float = 18.0
@export var jump_impulse: float = 9.0
@export var gravity: float = 22.0

@export_category("Dodge Roll Settings")
@export var dodge_speed: float = 14.0
@export var dodge_duration: float = 0.35
@export var max_stamina: float = 100.0
@export var dodge_stamina_cost: float = 25.0

@onready var camera_spring_arm: SpringArm3D = $CameraSpringArm

var current_stamina: float = 100.0
var is_dodging: bool = false
var dodge_timer: float = 0.0
var dodge_direction: Vector3 = Vector3.ZERO

func _ready() -> void:
	current_stamina = max_stamina
	emit_signal("stamina_changed", current_stamina, max_stamina)

func _physics_process(delta: float) -> void:
	# Stamina Regeneration
	if not is_dodging and current_stamina < max_stamina:
		current_stamina = min(max_stamina, current_stamina + 20.0 * delta)
		emit_signal("stamina_changed", current_stamina, max_stamina)

	# Gravity
	if not is_on_floor():
		velocity.y -= gravity * delta

	# Handle Dodge Roll
	if is_dodging:
		dodge_timer -= delta
		velocity.x = dodge_direction.x * dodge_speed
		velocity.z = dodge_direction.z * dodge_speed
		if dodge_timer <= 0.0:
			is_dodging = false
		move_and_slide()
		return

	# Player Input
	var input_dir := Input.get_vector("move_left", "move_right", "move_forward", "move_back")
	var move_direction := (camera_spring_arm.global_transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()
	move_direction.y = 0.0

	if Input.is_action_just_pressed("dodge") and current_stamina >= dodge_stamina_cost and input_dir != Vector2.ZERO:
		start_dodge_roll(move_direction)
		move_and_slide()
		return

	if move_direction != Vector3.ZERO:
		velocity.x = move_toward(velocity.x, move_direction.x * max_speed, acceleration * delta)
		velocity.z = move_toward(velocity.z, move_direction.z * max_speed, acceleration * delta)
		# Smooth mesh rotation
		var target_angle := atan2(-move_direction.x, -move_direction.z)
		rotation.y = lerp_angle(rotation.y, target_angle, 12.0 * delta)
	else:
		velocity.x = move_toward(velocity.x, 0.0, friction * delta)
		velocity.z = move_toward(velocity.z, 0.0, friction * delta)

	move_and_slide()

func start_dodge_roll(direction: Vector3) -> void:
	is_dodging = true
	dodge_timer = dodge_duration
	dodge_direction = direction
	current_stamina -= dodge_stamina_cost
	emit_signal("stamina_changed", current_stamina, max_stamina)
`
        },
        {
          filename: 'res://scripts/boss_ai_state_machine.gd',
          nodeTarget: 'ObsidianTitanBoss (CharacterBody3D)',
          description: 'Boss State Machine controlling Phase 1 slashing and Phase 2 ground slam arena crumble triggers.',
          code: `extends CharacterBody3D

signal boss_health_changed(current: float, max: float)
signal boss_phase_2_started

enum BossState { IDLE, CHASE, MELEE_COMBO, LAVA_SLAM, PHASE_TRANSITION, DEAD }

@export var max_health: float = 1200.0
@export var phase_2_threshold: float = 600.0

var current_health: float = 1200.0
var current_state: BossState = BossState.IDLE
var target_player: Node3D = null
var phase_2_triggered: bool = false

@onready var lava_embers_particles: GPUParticles3D = $Phase2LavaEmbers

func _ready() -> void:
	current_health = max_health
	emit_signal("boss_health_changed", current_health, max_health)
	lava_embers_particles.emitting = false

func take_damage(amount: float) -> void:
	if current_state == BossState.DEAD or current_state == BossState.PHASE_TRANSITION:
		return

	current_health = max(0.0, current_health - amount)
	emit_signal("boss_health_changed", current_health, max_health)

	if current_health <= phase_2_threshold and not phase_2_triggered:
		trigger_phase_2()
	elif current_health <= 0.0:
		current_state = BossState.DEAD

func trigger_phase_2() -> void:
	phase_2_triggered = true
	current_state = BossState.PHASE_TRANSITION
	lava_embers_particles.emitting = true
	emit_signal("boss_phase_2_started")
	print("BOSS ENTERED PHASE 2 - Triggering Arena Collapse!")
`
        }
      ],
      tscnContent: `[gd_scene load_steps=6 format=3 uid="uid://c8n1x2p3q4r5"]

[ext_resource type="Script" path="res://scripts/player_controller.gd" id="1_player"]
[ext_resource type="Script" path="res://scripts/boss_ai_state_machine.gd" id="2_boss"]

[sub_resource type="CapsuleShape3D" id="CapsuleShape3D_player"]
radius = 0.4
height = 1.8

[sub_resource type="CylinderShape3D" id="CylinderShape3D_boss"]
height = 3.5
radius = 1.5

[node name="BossArenaScene" type="Node3D"]

[node name="WorldEnvironment" type="WorldEnvironment" parent="."]

[node name="LavaSunLight" type="DirectionalLight3D" parent="."]
transform = Transform3D(1, 0, 0, 0, 0.707107, 0.707107, 0, -0.707107, 0.707107, 0, 10, 0)
light_color = Color(1, 0.35, 0.1, 1)
light_energy = 2.5
shadow_enabled = true

[node name="PlayerCharacter" type="CharacterBody3D" parent="."]
transform = Transform3D(1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 12)
script = ExtResource("1_player")

[node name="CollisionCapsule" type="CollisionShape3D" parent="PlayerCharacter"]
shape = SubResource("CapsuleShape3D_player")

[node name="CameraSpringArm" type="SpringArm3D" parent="PlayerCharacter"]
transform = Transform3D(1, 0, 0, 0, 0.939693, 0.34202, 0, -0.34202, 0.939693, 0, 1.6, 0)
spring_length = 4.5

[node name="Main3DCamera" type="Camera3D" parent="PlayerCharacter/CameraSpringArm"]
current = true

[node name="ObsidianTitanBoss" type="CharacterBody3D" parent="."]
transform = Transform3D(1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1.75, -8)
script = ExtResource("2_boss")

[node name="BossCollision" type="CollisionShape3D" parent="ObsidianTitanBoss"]
shape = SubResource("CylinderShape3D_boss")

[node name="Phase2LavaEmbers" type="GPUParticles3D" parent="ObsidianTitanBoss"]
amount = 250
`,
      projectGodotContent: `; Engine configuration file for Godot 4.3
config_version=5

[application]
config/name="Obsidian Titan Boss Fight"
run/main_scene="res://scenes/boss_arena_scene.tscn"
config/features=PackedStringArray("4.3", "Forward Plus")

[rendering]
anti_aliasing/quality/msaa_3d=2
glow/enabled=true
volumetric_fog/enabled=true
`,
      milestones: [
        {
          id: 'ms-1',
          title: 'Milestone 1: Arena World Setup & Lighting',
          description: '3D Node hierarchy setup, environment glowing sky, lava light rig, and static platform geometry.',
          dueDateWeeks: 1,
          state: 'open'
        },
        {
          id: 'ms-2',
          title: 'Milestone 2: Player Character Mechanics & Camera',
          description: 'CharacterBody3D controller with stamina, dodge roll i-frames, and spring arm 3D camera controller.',
          dueDateWeeks: 2,
          state: 'open'
        },
        {
          id: 'ms-3',
          title: 'Milestone 3: Boss AI State Machine & Destruction',
          description: 'Boss state machine script, phase 2 transition triggers, and crumbling platform hazard system.',
          dueDateWeeks: 3,
          state: 'open'
        }
      ],
      issues: [
        {
          id: 'iss-1',
          title: '[Godot Node] Create Root Node3D and WorldEnvironment Lighting Rig',
          moduleTitle: 'Scene Architecture & Lighting Setup',
          milestoneTitle: 'Milestone 1: Arena World Setup & Lighting',
          type: 'architecture',
          status: 'todo',
          labels: ['godot-4.3', 'environment', 'lighting', 'node-tree'],
          assigneeRole: 'Environment Tech Artist',
          acceptanceCriteria: [
            'Create main scene `boss_arena_scene.tscn` with `Node3D` root.',
            'Add `WorldEnvironment` node with Glow and Volumetric Fog enabled.',
            'Add `DirectionalLight3D` named `LavaSunLight` with warm orange light tint (#FF591A) and shadow mapping enabled.'
          ],
          editorInstructions: [
            'Open Godot 4 Editor -> Scene Dock -> New 3D Scene.',
            'Rename root node to `BossArenaScene`.',
            'Right click root -> Add Child Node -> `WorldEnvironment`.',
            'In Inspector -> Environment -> New Environment -> Toggle Volumetric Fog ON.'
          ],
          bodyMarkdown: `## 🎮 Task Summary
Set up the core 3D scene environment for the Obsidian Titan Boss Fight in Godot 4.3.

### 📋 Technical Requirements
- Node Hierarchy: \`Node3D (BossArenaScene)\` -> \`WorldEnvironment\` + \`DirectionalLight3D\`
- Volumetric Fog density set to \`0.04\`
- Light color warm orange (#FF591A) with shadow distance set to \`60m\`

### ✅ Acceptance Criteria
- [ ] WorldEnvironment glow and fog render smoothly in preview
- [ ] Key light shadows project realistically onto floor mesh`
        },
        {
          id: 'iss-2',
          title: '[GDScript] Implement Player Controller with Dodge Roll & Stamina',
          moduleTitle: 'Third-Person Player Controller & SpringArm',
          milestoneTitle: 'Milestone 2: Player Character Mechanics & Camera',
          type: 'scripting',
          status: 'todo',
          labels: ['gdscript', 'player-controller', 'characterbody3d', 'physics'],
          assigneeRole: 'Gameplay Programmer',
          acceptanceCriteria: [
            'Attach `res://scripts/player_controller.gd` to `PlayerCharacter` node.',
            'Player accelerates smoothly relative to `SpringArm3D` camera angle.',
            'Pressing Dodge action consumes 25 stamina and performs i-frame dash.'
          ],
          editorInstructions: [
            'Select `PlayerCharacter` node -> Inspector -> Script -> Quick Load -> `player_controller.gd`.',
            'Project -> Project Settings -> Input Map -> Add Actions: `move_forward`, `move_back`, `move_left`, `move_right`, `dodge`.'
          ],
          relatedScript: 'res://scripts/player_controller.gd',
          bodyMarkdown: `## 🕹️ Task Summary
Implement full GDScript 3D movement and stamina dodge mechanics for Godot 4.3.

### 📜 Code Reference
See \`res://scripts/player_controller.gd\` in repository for the GDScript class implementation.

### ✅ Acceptance Criteria
- [ ] Character move_and_slide handles slope navigation
- [ ] Stamina regenerates when not dodging
- [ ] Dodge roll cancels direction changes during duration`
        },
        {
          id: 'iss-3',
          title: '[Godot AI] Boss State Machine & Phase 2 Enrage Transition',
          moduleTitle: 'Boss AI State Machine & Phase Transition System',
          milestoneTitle: 'Milestone 3: Boss AI State Machine & Destruction',
          type: 'feature',
          status: 'todo',
          labels: ['boss-ai', 'state-machine', 'signals', 'gameplay'],
          assigneeRole: 'AI & Systems Programmer',
          acceptanceCriteria: [
            'Boss health drops below 50% triggers `boss_phase_2_started` signal.',
            '`GPUParticles3D` lava embers activate upon Phase 2 enrage.',
            'Console logs Phase 2 trigger event correctly.'
          ],
          editorInstructions: [
            'In Scene Dock, inspect `ObsidianTitanBoss`.',
            'Verify script `boss_ai_state_machine.gd` attached.',
            'Connect `boss_phase_2_started` signal to `OuterCrumblingPlatforms` hazard manager.'
          ],
          relatedScript: 'res://scripts/boss_ai_state_machine.gd',
          bodyMarkdown: `## 👹 Task Summary
Create the multi-phase state machine for the Obsidian Titan Boss AI in Godot 4.3.

### ✅ Acceptance Criteria
- [ ] Health threshold detection calculates current_health vs phase_2_threshold
- [ ] Phase 2 emits global signal for scene destruction`
        }
      ]
    }
  },
  {
    id: 'cyberpunk-2d-platformer',
    title: 'Cyberpunk Metroidvania Neon District',
    genre: '2D Metroidvania / Cyberpunk Action',
    cameraMode: '2D',
    summary: '2D side-scroller with wall-slide, grapple points, animated neon signs, Area2D hazard zones, and state machine player.',
    prompt: 'A 2D cyberpunk Metroidvania street district with rain particle effects, grapple hook targets, wall-sliding, neon light TileMap, Area2D laser grids, and enemy drone patrol AI.',
    samplePlan: {
      sceneTitle: 'Cyberpunk Metroidvania Neon District',
      description: '2D Metroidvania district with TileMapLayer setup, Area2D laser security, GrappleHook Area2D, and drone patrol state machine.',
      genre: '2D Metroidvania / Cyberpunk',
      godotVersion: 'Godot 4.3',
      cameraMode: '2D',
      nodeHierarchy: [
        {
          id: 'node-2d-root',
          name: 'NeonDistrictScene',
          type: 'Node2D',
          iconCategory: '2d',
          description: 'Root 2D scene holding tilemap layers, parallax background, and drone manager.',
          properties: [],
          children: [
            {
              id: 'node-parallax',
              name: 'ParallaxBackground',
              type: 'ParallaxBackground',
              iconCategory: '2d',
              description: 'Multi-layer city skyline with scrolling parallax speeds.',
              properties: [{ name: 'scroll_offset', type: 'Vector2', value: 'Vector2(0, 0)' }]
            },
            {
              id: 'node-tilemap',
              name: 'CityTileMapLayer',
              type: 'TileMapLayer',
              iconCategory: '2d',
              description: 'Godot 4.3 TileMapLayer for neon rooftops and wall-run surfaces.',
              properties: [{ name: 'tile_set', type: 'TileSet', value: 'res://tilesets/neon_city.tres' }]
            },
            {
              id: 'node-player-2d',
              name: 'CyberNinjaPlayer',
              type: 'CharacterBody2D',
              iconCategory: 'physics',
              scriptName: 'res://scripts/ninja_player_2d.gd',
              description: '2D character controller with wall-slide, double jump, and grapple hook mechanics.',
              properties: [{ name: 'collision_layer', type: 'int', value: '1 (Player)' }],
              children: [
                {
                  id: 'node-camera-2d',
                  name: 'Camera2D',
                  type: 'Camera2D',
                  iconCategory: '2d',
                  description: 'Smooth position smoothing Camera2D with drag margins.',
                  properties: [{ name: 'position_smoothing_enabled', type: 'bool', value: 'true' }]
                }
              ]
            },
            {
              id: 'node-drone',
              name: 'PatrolDroneEnemy',
              type: 'CharacterBody2D',
              iconCategory: 'physics',
              scriptName: 'res://scripts/drone_patrol_ai.gd',
              description: 'Hovering security drone with laser sight and alarm state signal.',
              properties: [{ name: 'collision_layer', type: 'int', value: '2 (Enemy)' }]
            }
          ]
        }
      ],
      modules: [
        {
          id: 'mod-2d-1',
          stageNumber: 1,
          title: 'TileMapLayer & Parallax City Skyline',
          description: 'Set up Godot 4.3 TileMapLayer with custom collision physics physics layers and background scrolling.',
          estimatedHours: 3,
          editorSteps: [
            'Add TileMapLayer node named "CityTileMapLayer".',
            'In Inspector -> TileSet -> Create Physics Layer 0 for solid collision.',
            'Draw neon rooftop platforms and wall collision tiles.'
          ],
          godotNodesInvolved: ['Node2D', 'TileMapLayer', 'ParallaxBackground']
        },
        {
          id: 'mod-2d-2',
          stageNumber: 2,
          title: '2D Player Controller: Wall-Slide & Grapple Anchor',
          description: 'Program CharacterBody2D movement, wall-slide detection with RayCast2D, and grapple point snapping.',
          estimatedHours: 5,
          editorSteps: [
            'Attach script `res://scripts/ninja_player_2d.gd` to `CyberNinjaPlayer`.',
            'Add RayCast2D facing left/right to detect wall contacts.'
          ],
          godotNodesInvolved: ['CharacterBody2D', 'RayCast2D', 'Camera2D']
        }
      ],
      gdscripts: [
        {
          filename: 'res://scripts/ninja_player_2d.gd',
          nodeTarget: 'CyberNinjaPlayer (CharacterBody2D)',
          description: '2D Player Controller with Wall Sliding and Double Jump in Godot 4.3',
          code: `extends CharacterBody2D

@export var move_speed: float = 280.0
@export var jump_velocity: float = -420.0
@export var wall_slide_speed: float = 80.0

var gravity: float = ProjectSettings.get_setting("physics/2d/default_gravity")
var can_double_jump: bool = true
var is_wall_sliding: bool = false

@onready var wall_ray_right: RayCast2D = $WallRayRight
@onready var wall_ray_left: RayCast2D = $WallRayLeft

func _physics_process(delta: float) -> void:
	# Add Gravity
	if not is_on_floor():
		velocity.y += gravity * delta

	# Check Wall Slide
	var is_on_wall_side := (wall_ray_right.is_colliding() or wall_ray_left.is_colliding()) and not is_on_floor()
	if is_on_wall_side and velocity.y > 0:
		is_wall_sliding = true
		velocity.y = min(velocity.y, wall_slide_speed)
	else:
		is_wall_sliding = false

	# Jump
	if Input.is_action_just_pressed("jump"):
		if is_on_floor():
			velocity.y = jump_velocity
			can_double_jump = true
		elif is_wall_sliding:
			velocity.y = jump_velocity
			var push_dir: float = -1.0 if wall_ray_right.is_colliding() else 1.0
			velocity.x = push_dir * move_speed
		elif can_double_jump:
			velocity.y = jump_velocity * 0.85
			can_double_jump = false

	# Horizontal Movement
	var direction := Input.get_axis("move_left", "move_right")
	if direction != 0:
		velocity.x = direction * move_speed
	else:
		velocity.x = move_toward(velocity.x, 0, move_speed * 10 * delta)

	move_and_slide()
`
        }
      ],
      tscnContent: `[gd_scene load_steps=2 format=3 uid="uid://b2d3e4f5g6h7"]

[ext_resource type="Script" path="res://scripts/ninja_player_2d.gd" id="1_ninja"]

[node name="NeonDistrictScene" type="Node2D"]

[node name="CityTileMapLayer" type="TileMapLayer" parent="."]

[node name="CyberNinjaPlayer" type="CharacterBody2D" parent="."]
script = ExtResource("1_ninja")

[node name="WallRayRight" type="RayCast2D" parent="CyberNinjaPlayer"]
target_position = Vector2(16, 0)

[node name="WallRayLeft" type="RayCast2D" parent="CyberNinjaPlayer"]
target_position = Vector2(-16, 0)

[node name="Camera2D" type="Camera2D" parent="CyberNinjaPlayer"]
position_smoothing_enabled = true
`,
      projectGodotContent: `; Engine configuration file for Godot 4.3 (2D)
config_version=5

[application]
config/name="Cyberpunk Metroidvania"
run/main_scene="res://scenes/neon_district_scene.tscn"
`,
      milestones: [
        {
          id: 'ms-2d-1',
          title: 'Milestone 1: TileMap & Wall Movement',
          description: 'Godot 4 2D TileMap setup, wall sliding, double jump physics.',
          dueDateWeeks: 1,
          state: 'open'
        }
      ],
      issues: [
        {
          id: 'iss-2d-1',
          title: '[GDScript 2D] Implement Ninja Wall Slide and RayCast2D Detection',
          moduleTitle: '2D Player Controller: Wall-Slide & Grapple Anchor',
          milestoneTitle: 'Milestone 1: TileMap & Wall Movement',
          type: 'scripting',
          status: 'todo',
          labels: ['godot-2d', 'gdscript', 'characterbody2d', 'raycast2d'],
          assigneeRole: '2D Gameplay Developer',
          acceptanceCriteria: [
            'RayCast2D nodes check left/right wall contacts.',
            'Wall sliding caps downward fall speed to 80px/s.',
            'Wall jumping pushes player off wall surface.'
          ],
          editorInstructions: [
            'Create RayCast2D nodes under CyberNinjaPlayer.',
            'Set target position X to 16 for Right and -16 for Left.'
          ],
          relatedScript: 'res://scripts/ninja_player_2d.gd',
          bodyMarkdown: `## 🥷 Task Summary\nImplement 2D wall sliding and double jump mechanics in GDScript for Godot 4.`
        }
      ]
    }
  }
];
