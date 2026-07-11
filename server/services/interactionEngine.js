const fs = require('fs');
const path = require('path');
const { checkDurPairs } = require('./durService');

const localData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'data', 'interactions.json'), 'utf-8')
);

function normalize(name) {
  return name.trim();
}

function localCheck(itemNames) {
  const names = itemNames.map(normalize);
  const matches = [];
  for (const entry of localData) {
    const hit = entry.items.every((required) =>
      names.some((name) => name.includes(required) || required.includes(name))
    );
    if (hit) matches.push({ ...entry, source: '내부 참고자료' });
  }
  return matches;
}

// items: string[] (약물/영양제/음식 이름, 자유 입력)
async function checkInteractions(itemNames) {
  const names = itemNames.map(normalize).filter(Boolean);
  const local = localCheck(names);
  const dur = await checkDurPairs(names);

  // 같은 조합이 로컬/DUR 양쪽에서 잡히면 로컬 설명을 우선하고 중복 제거
  const seen = new Set(local.map((m) => m.items.slice().sort().join('|')));
  const merged = [...local];
  for (const d of dur) {
    const key = d.items.slice().sort().join('|');
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(d);
    }
  }

  const overallRisk = merged.some((m) => m.severity === 'danger')
    ? 'danger'
    : merged.length > 0
    ? 'caution'
    : 'safe';

  return { overallRisk, matches: merged };
}

module.exports = { checkInteractions };
