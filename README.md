# Godot Scene Architect

Godot Scene Architect turns a game-scene idea into an implementation-ready blueprint: a Godot node hierarchy, GDScript files, a `.tscn` scene, a Godot project bundle, and a GitHub-sized task plan.

## What it is for

Use it when you are starting a Godot feature and want to move from a vague concept to a handoff that can be opened in the Godot editor and tracked in GitHub.

- **Prototype a scene:** choose an offline preset and inspect the node tree, modular build chain, and sample scripts.
- **Plan a custom mechanic:** describe a scene in plain language and generate a structured Godot 4 blueprint with Gemini.
- **Hand work to a team:** review the generated milestones and issue cards, then sync them to an existing GitHub repository.
- **Create a starter project:** export a ZIP containing `project.godot`, a `.tscn`, scripts, issue templates, and setup notes.
- **Iterate safely:** refine a script with AI, save a blueprint to JSON, import it later, or continue from the browser's local snapshot.

## Quick start

Prerequisites: Node.js 20+ and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app works without an API key through its built-in presets. To enable custom scene generation and GDScript refinement, set `GEMINI_API_KEY` in `.env.local`:

```env
GEMINI_API_KEY=your-gemini-api-key
PORT=3000
```

The key is read by the local Express server and is never placed in the browser bundle.

## Primary workflow

1. Start with a preset or describe a scene, including mechanics, camera style, and genre.
2. Review the generated **Node Dock**, **Modular Chain**, **GDScript Hub**, and **GitHub Tasks** tabs.
3. Use **Save JSON** for a portable blueprint checkpoint. **Import JSON** restores a previous plan; the latest plan is also saved locally in the browser.
4. Use **Exporter** to download a ready-to-import Godot project bundle.
5. Create or open a GitHub repository, then use **Sync Repo** to create the plan's milestones, labels, and issues.

## GitHub sync safety

Sync requires a GitHub personal access token with repository issue and milestone write access. The token is sent to the server only for the requested API call and is not stored by this app. The sync route creates missing labels, milestones, and issues in the repository you provide; it does not create a repository or push source code.

For a safer first run, export the ZIP and review the generated issue list before syncing.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Express + Vite development server |
| `npm run lint` | Run TypeScript checks |
| `npm run build` | Build the browser app and production server |
| `npm start` | Run the production build |

## Project layout

```text
src/
  components/       UI for the blueprint workflow
  data/presets.ts   Offline sample scene plans
  types.ts          Shared blueprint and GitHub types
server.ts           Express API and Gemini/GitHub integrations
```

## Scope and next steps

The current MVP is a planning and export bridge, not a Godot runtime or a GitHub repository provisioner. The next useful product steps are OAuth-based GitHub sign-in, duplicate-safe sync updates, generated project validation in Godot's headless editor, and a small history view for multiple blueprints.

## License

No license has been selected yet. Choose one before distributing the repository publicly.
