// Drives pi in RPC mode through several sessions of prompts and prints what the model said and which tools it called.
// usage: bun rpc-drive.ts <cwd> <model> <sessions.json> [extra pi args...]
// sessions.json: string[][] — each inner array is one fresh pi process (a new conversation).
import { spawn } from "node:child_process";

const [cwd, model, file, ...extra] = process.argv.slice(2);
const sessions: string[][] = JSON.parse(await Bun.file(file).text());

for (const [i, prompts] of sessions.entries()) {
  console.log(`\n========== session ${i + 1} ==========`);
  const p = spawn("pi", ["--mode", "rpc", "--no-session", "--model", model, ...extra], {
    cwd, env: process.env, stdio: ["pipe", "pipe", "inherit"],
  });
  let buf = "";
  let settle: (() => void) | undefined;
  p.stdout.on("data", (d) => {
    buf += d;
    let n;
    while ((n = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, n).replace(/\r$/, "");
      buf = buf.slice(n + 1);
      if (!line.trim()) continue;
      const rec = JSON.parse(line);
      if (rec.type === "tool_execution_start") {
        const a = rec.args ?? {};
        const shown = a.path ?? a.command ?? a.file_path ?? JSON.stringify(a).slice(0, 200);
        console.log(`  [tool ${rec.toolName}] ${shown}`);
        if (rec.toolName === "write" && a.content) console.log(a.content.replace(/^/gm, "      | "));
        if (rec.toolName === "edit") console.log(JSON.stringify(a).slice(0, 600).replace(/^/gm, "      | "));
      } else if (rec.type === "message_end" && rec.message?.role === "assistant") {
        const text = (rec.message.content ?? []).filter((c: any) => c.type === "text").map((c: any) => c.text).join("");
        if (text.trim()) console.log(`  AI: ${text.trim().replace(/\n/g, "\n      ")}`);
      } else if (rec.type === "response" && rec.success === false) {
        console.log(`  !! ${JSON.stringify(rec)}`);
      } else if (rec.type === "agent_settled") {
        settle?.();
      }
    }
  });
  for (const [j, msg] of prompts.entries()) {
    console.log(`\n  USER: ${msg}`);
    const done = new Promise<void>((r) => (settle = r));
    p.stdin.write(JSON.stringify({ id: `p${i}-${j}`, type: "prompt", message: msg }) + "\n");
    await done;
  }
  p.stdin.end();
  await new Promise((r) => p.on("exit", r));
}
