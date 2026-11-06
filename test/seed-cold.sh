#!/usr/bin/env bash
# Seeds a test memory root and project for the hot/cold memory test.
# usage: bash test/seed-cold.sh <test dir>   → creates <test dir>/proj (with .git) and <test dir>/mem
set -euo pipefail
T=$1
rm -rf "$T"
mkdir -p "$T/proj/.git"
G="$T/mem/global"
P="$T/mem/projects/$(echo "$T/proj" | tr / -)"
mkdir -p "$G" "$P/archive"

mem() { # file type description body
  printf -- '---\nname: %s\ndescription: %s\ntype: %s\n---\n\n%s\n' "$(basename "$1" .md)" "$3" "$2" "$4" > "$1"
}

mem "$G/answer-short.md" feedback "回答三句话以内，用大白话" "回答三句话以内，用大白话。

**为什么：** 用户 2026-11-02 说回答太长。
**怎么用：** 默认短答。"
mem "$G/answer-brief.md" feedback "回答要简短，别啰嗦" "回答要简短，别啰嗦。

**为什么：** 用户 2026-11-04 又说了一次太长。
**怎么用：** 能一句说完就一句。"
mem "$G/use-bun.md" feedback "装依赖和跑脚本用 bun，别用 npm" "装依赖、跑脚本都用 bun。

**为什么：** 用户 2026-10-21 定的。
**怎么用：** npm install 换成 bun install。"
cat > "$G/MEMORY.md" <<'IDX'
- [回答要短](answer-short.md) — 三句话以内，用大白话
- [回答简短](answer-brief.md) — 别啰嗦
- [用 bun](use-bun.md) — 装依赖和跑脚本用 bun，别用 npm
IDX

mem "$P/demo-2026-11-01.md" project "2026-11-01 给老板演示" "2026-11-01 要给老板演示这个项目。

**为什么：** 用户 2026-10-25 说的。
**怎么用：** 方案优先保证 11-01 前能跑。"
mem "$P/release-2026-11-20.md" project "2026-11-20 正式上线" "2026-11-20 正式上线。

**为什么：** 赶双十二前的流量。
**怎么用：** 11-20 前不做大改动。"
mem "$P/deploy-script.md" reference "部署用 scripts/deploy.sh" "部署跑 scripts/deploy.sh，要先登录 VPN。"
cat > "$P/MEMORY.md" <<'IDX'
- [演示 11-01](demo-2026-11-01.md) — 2026-11-01 给老板演示
- [上线 11-20](release-2026-11-20.md) — 2026-11-20 正式上线
- [部署脚本](deploy-script.md) — 部署用 scripts/deploy.sh，先登录 VPN
IDX

mem "$P/archive/payment-vendor.md" reference "以前收款用 PayPal，后来换成 Stripe" "以前收款用 PayPal，商户后台 https://dashboard.paypal.example，2026-09 换成了 Stripe。

**Archived:** 2026-10-01, payments moved to Stripe."
echo "seeded $T"
