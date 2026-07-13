#!/usr/bin/env bash
set -euo pipefail

cd "${1:-.}"

python - <<'PY'
from pathlib import Path
p = Path('frontend/app/sourcing/page.tsx')
text = p.read_text(encoding='utf-8')
text = text.replace('CommerceOS Foundation v1.0', 'CommerceOS AI Sourcing v1.1')
text = text.replace('상품 후보 등록', '상품 후보 분석')
text = text.replace('AI 점수 계산', '무료 점수 계산 및 등록')
p.write_text(text, encoding='utf-8')

css = Path('frontend/app/styles.css')
style = css.read_text(encoding='utf-8')
if '.metrics{' not in style:
    style += '\n.metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin:26px 0}.metrics article{background:#121d35;border:1px solid #2d3e64;border-radius:16px;padding:20px}.metrics span{display:block;color:#91a1c5;margin-bottom:10px}.metrics strong{font-size:28px}\n'
css.write_text(style, encoding='utf-8')

changelog = Path('CHANGELOG.md')
entry = '''\n## 1.1.0\n\n- Expanded the AI Sourcing input workflow\n- Kept the engine free and rule-based\n- Prepared score, margin and approval UI upgrades\n'''
if changelog.exists():
    current = changelog.read_text(encoding='utf-8')
    if '## 1.1.0' not in current:
        changelog.write_text(current.rstrip() + '\n' + entry, encoding='utf-8')
else:
    changelog.write_text('# Changelog\n' + entry, encoding='utf-8')
PY

docker compose up -d --build frontend
sleep 8
docker compose ps

echo
printf '%s\n' 'AI Sourcing v1.1 patch applied.'
