import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { getAgentDir } from "@earendil-works/pi-coding-agent";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

function readIndex(folder: string): string {
  let content: string;
  try {
    content = readFileSync(join(folder, "MEMORY.md"), "utf8").trimEnd();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return "(no memories yet)";
    throw error;
  }
  if (!content) return "(no memories yet)";
  const lines = content.split("\n");
  return lines.length > 200
    ? `${lines.slice(0, 200).join("\n")}\n(MEMORY.md is over 200 lines; the rest is not shown. Move outdated entries to cold storage to bring it back under 200 lines.)`
    : content;
}

function countArchive(archive: string): number {
  try {
    return readdirSync(archive).filter((name) => name.endsWith(".md")).length;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return 0;
    throw error;
  }
}

export default function (pi: ExtensionAPI) {
  pi.on("before_agent_start", (event, ctx) => {
    if (!ctx.hasUI) return;

    const guide = readFileSync(new URL("./GUIDE.md", import.meta.url), "utf8").trimEnd();
    const root = resolve(process.env.PI_MEMORY_DIR ?? join(getAgentDir(), "memory"));
    let projectRoot = resolve(ctx.cwd);
    while (!existsSync(join(projectRoot, ".git"))) {
      const parent = dirname(projectRoot);
      if (parent === projectRoot) {
        projectRoot = resolve(ctx.cwd);
        break;
      }
      projectRoot = parent;
    }
    const globalFolder = join(root, "global");
    const projectFolder = join(root, "projects", projectRoot.replaceAll("/", "-"));
    const globalArchive = join(globalFolder, "archive");
    const projectArchive = join(projectFolder, "archive");
    const today = new Date();
    const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    event.systemPromptOptions.sections.memory = `${guide}

## Current state

- Today is ${date}
- Global memory folder: ${globalFolder}
- Global cold storage: ${globalArchive} (${countArchive(globalArchive)} memories)
- Project memory folder: ${projectFolder} (project: ${projectRoot})
- Project cold storage: ${projectArchive} (${countArchive(projectArchive)} memories)

### Global MEMORY.md

${readIndex(globalFolder)}

### Project MEMORY.md

${readIndex(projectFolder)}`;
  });
}
