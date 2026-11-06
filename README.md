# pi-memory

Long-term memory for the [pi coding agent](https://github.com/earendil-works/pi), modelled on Claude Code's auto memory. Memories are plain Markdown files. A short index goes into the system prompt on every run. The model decides what is worth saving and writes the files with pi's normal `write`, `edit`, and `bash` tools. No background model calls, no new tools, no database.

The guide teaches the model to save little: "most conversations need no memory at all". It uses plain language so weaker models can follow it. It was tested with DeepSeek V4.1 Flash, with Chinese conversations.

## How it works

Memory has three layers:

- **Index (`MEMORY.md`):** shown on every run, up to 200 lines per index.
- **Memory files:** read only when needed.
- **Cold storage (`archive/`):** not shown in the prompt. The model greps it when the user refers to the past, it meets an unknown name, or it is about to say it doesn't remember.

Wrong memories are deleted. Outdated ones (a passed date, a finished project, a replaced approach) move to cold storage. The guide tells the model to archive passed deadlines and events automatically at the start of a conversation, and to tidy memory when you run `/tidy`.

## Install

```bash
pi install git:github.com/zhoupb01/pi-memory
```

This adds the memory extension and the `/tidy` command.

## Where memory lives

- `~/.pi/agent/memory/global/`: about the user and how to work.
- `~/.pi/agent/memory/projects/<project path with / replaced by ->/`: about this project. The project is the nearest folder with `.git`, or the working folder if none exists.

Each folder has its own `MEMORY.md`, memory files, and `archive/`. `PI_MEMORY_DIR` overrides the memory root (`~/.pi/agent/memory/`). The files are plain Markdown: read, edit, or delete them by hand any time.

## Interactive use only

Memory is active in TUI and RPC mode. It does nothing in print (`-p`) and JSON mode, where the "user" is usually a script or another agent sending a task.

## Customizing

All memory behaviour is in `GUIDE.md`. It is re-read on every run, so edits apply on the next message without `/reload`.

## Testing

The sample conversations are in Chinese. These are model-driven checks; review the replies and file changes. The driver needs [Bun](https://bun.sh).

- `test/rpc-drive.ts` drives pi in RPC mode through fresh conversations and prints replies and tool calls.
- `test/sessions.json` checks saving preferences and project details, recall, corrections, forgetting, and refusing to save a secret.
- `test/seed-cold.sh` creates a test project and seeds duplicate preferences, dated memories, a missing script reference, and an archived payment provider. It deletes and recreates the target directory, so use a disposable path.
- `test/sessions-cold.json` checks archiving passed dates at startup, `/tidy`, and recall from cold storage. The seed uses fixed November 2026 dates; which events have passed depends on the day you run it.

From this package folder, run the basic conversations with an isolated memory root:

```bash
trial=$(mktemp -d)
mkdir -p "$trial/project/.git"
PI_MEMORY_DIR="$trial/mem" bun test/rpc-drive.ts \
  "$trial/project" '<provider/model>' test/sessions.json -ne -e "$PWD"
```

For the cold storage checks, seed a fresh disposable directory and run `test/sessions-cold.json`:

```bash
cold_trial=$(mktemp -d)
bash test/seed-cold.sh "$cold_trial"
PI_MEMORY_DIR="$cold_trial/mem" bun test/rpc-drive.ts \
  "$cold_trial/proj" '<provider/model>' test/sessions-cold.json -ne -e "$PWD"
```

## License

MIT. See [LICENSE](LICENSE).
