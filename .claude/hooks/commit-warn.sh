#!/bin/bash
# git commit 전에 경고만 (막지 않음). PreToolUse(Bash) 훅.
input=$(cat)
cmd=$(printf '%s' "$input" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("tool_input",{}).get("command",""))' 2>/dev/null)
case "$cmd" in *"git commit"*) ;; *) exit 0 ;; esac
cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || exit 0
files=$(git diff --cached --name-only 2>/dev/null)
[ -z "$files" ] && exit 0
warn=""
bad=$(printf '%s\n' "$files" | grep -Ei '\.(jks|keystore|p12|pem|key)$|(^|/)\.env' )
[ -n "$bad" ] && warn="$warn\n- 서명 키·환경 파일이 포함됨: $(echo $bad | head -c 200)"
sec=$(git diff --cached -U0 -- . ':(exclude).claude/hooks' 2>/dev/null | grep -E '^\+' | grep -Ei 'service_role|sk_live_|AIza[0-9A-Za-z_-]{30}|-----BEGIN (RSA |EC )?PRIVATE KEY|client_secret' | head -3)
[ -n "$sec" ] && warn="$warn\n- 비밀 키처럼 보이는 줄이 있음"
for d in $(printf '%s\n' "$files" | grep -oE '^public/games/[^/]+' | sort -u); do
  id=${d#public/games/}
  grep -q "id: \"$id\"" src/lib/games.ts 2>/dev/null || warn="$warn\n- $id 가 src/lib/games.ts 에 등록되지 않음"
done
if printf '%s\n' "$files" | grep -qE '^public/games/[^/]+/assets/'; then
  warn="$warn\n- 새 에셋 포함: 라이선스(상업 사용) 확인했는지 확인"
fi
[ -z "$warn" ] && exit 0
msg=$(printf "커밋 전 확인:%b" "$warn")
python3 -c 'import json,sys; print(json.dumps({"systemMessage": sys.argv[1]}))' "$msg"
exit 0
