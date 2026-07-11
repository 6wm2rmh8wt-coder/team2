// 식약처 공공데이터포털 "의약품안전사용서비스(DUR)품목정보" - 병용금기 오퍼레이션 연동
// https://www.data.go.kr/data/15059486/openapi.do
const DUR_ENDPOINT = 'http://apis.data.go.kr/1471000/DURPrdlstInfoService03/getUsjntTabooInfoList03';

// 서비스키는 data.go.kr에서 이미 URL 인코딩된 형태로 제공되므로 재인코딩하지 않고 그대로 붙인다.
async function fetchDurTabooByItemName(itemName) {
  const key = process.env.DUR_API_KEY_ENCODED;
  if (!key) return [];

  const url = `${DUR_ENDPOINT}?serviceKey=${key}&itemName=${encodeURIComponent(itemName)}&type=json&numOfRows=50`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = await res.json();
    const items = data?.body?.items;
    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  } catch (err) {
    // 네트워크 오류·키 미승인 등: 검색엔진 전체를 실패시키지 않고 조용히 빈 결과로 대체
    console.warn('[durService] DUR API 호출 실패, 로컬 데이터로 대체:', err.message);
    return [];
  }
}

// itemNames 중 실제로 서로를 병용금기 상대로 지목하는 쌍을 찾는다.
// 동일 성분의 제품이 여러 개 등록되어 있어 같은 조합이 중복 조회되므로, 조합 단위로 중복을 제거한다.
async function checkDurPairs(itemNames) {
  const seen = new Set();
  const results = [];
  for (const name of itemNames) {
    const rows = await fetchDurTabooByItemName(name);
    for (const row of rows) {
      // 상대 물질은 성분명(MIXTURE_INGR_KOR_NAME) 또는 제품명(MIXTURE_ITEM_NAME) 어느 쪽에든 걸릴 수 있다.
      const mixtureNames = [row.MIXTURE_INGR_KOR_NAME, row.MIXTURE_ITEM_NAME].filter(Boolean);
      const matchedOther = itemNames.find(
        (other) => other !== name && mixtureNames.some((m) => m.includes(other))
      );
      if (!matchedOther) continue;

      const key = [name, matchedOther].sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);

      results.push({
        items: [name, matchedOther],
        severity: 'danger',
        description: row.PROHBT_CONTENT || row.prohbtContent || '식약처 DUR 병용금기 정보에 등록된 조합입니다.',
        alternatives: [],
        source: 'DUR API',
      });
    }
  }
  return results;
}

module.exports = { checkDurPairs };
