import fs from "node:fs";
import path from "node:path";
import { stringify } from "yaml";
import { loomDir } from "../utils/paths.js";
import { gitInit, gitCommit } from "../utils/git.js";
import { ensureDir } from "../utils/sources.js";
import type { LoomConfig } from "../types/index.js";

export interface InitAction {
  name: string;
  needed: () => boolean;
  run: () => void;
}

const SUBDIRS = ["global/instructions", "global/skills", "global/agents", "projects"];
const GITIGNORE_ENTRIES = ["dist/", ".deployed/"];

export function buildInitActions(dir: string): InitAction[] {
  const dirActions: InitAction[] = SUBDIRS.map((sub) => {
    const subDir = path.join(dir, sub);
    return {
      name: `create ${sub}/`,
      needed: () => !fs.existsSync(subDir),
      run: () => ensureDir(subDir),
    };
  });

  const configPath = path.join(dir, "config.yaml");

  const gitignorePath = path.join(dir, ".gitignore");

  return [
    ...dirActions,
    {
      name: "create config.yaml",
      needed: () => !fs.existsSync(configPath),
      run: () => {
        ensureDir(dir);
        const config: LoomConfig = {
          targets: ["claude", "copilot", "codex", "gemini"],
          projects: {},
        };
        fs.writeFileSync(configPath, stringify(config), "utf-8");
      },
    },
    {
      name: "create .gitignore",
      needed: () => {
        if (!fs.existsSync(gitignorePath)) return true;
        const content = fs.readFileSync(gitignorePath, "utf-8");
        return GITIGNORE_ENTRIES.some((entry) => !content.includes(entry));
      },
      run: () => {
        ensureDir(dir);
        const existing = fs.existsSync(gitignorePath)
          ? fs.readFileSync(gitignorePath, "utf-8")
          : "";
        const missing = GITIGNORE_ENTRIES.filter((entry) => !existing.includes(entry));
        const updated = existing.trimEnd() + (existing ? "\n" : "") + missing.join("\n") + "\n";
        fs.writeFileSync(gitignorePath, updated, "utf-8");
      },
    },
    {
      name: "git init",
      needed: () => !fs.existsSync(path.join(dir, ".git")),
      run: () => gitInit(dir),
    },
    {
      name: "git commit",
      needed: () => true,
      run: () => gitCommit(dir, "loom init"),
    },
  ];
}

export async function init(_args: string[]): Promise<void> {
  const dir = loomDir();
  const actions = buildInitActions(dir);

  let ran = 0;
  for (const action of actions) {
    if (action.needed()) {
      action.run();
      console.log(`  ${action.name}`);
      ran++;
    }
  }

  if (ran === 0) {
    console.log(`Loom already initialised at ${dir}`);
  } else {
    console.log(`\nLoom initialised at ${dir}`);
  }
}
