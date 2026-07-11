// 화면기획서.md의 "상호작용 경고 팝업(모달)" 구현
function ensureModalMounted() {
  if (document.getElementById('interaction-modal')) return;
  const overlay = document.createElement('div');
  overlay.id = 'interaction-modal';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-title">
        <span id="interaction-modal-badge" class="badge badge-coral">주의</span>
        <h3 style="margin:0;font-size:20px;">상호작용 주의</h3>
      </div>
      <p id="interaction-modal-summary" class="muted"></p>
      <div class="modal-actions">
        <button class="btn btn-secondary" id="interaction-modal-close">확인</button>
        <button class="btn btn-primary" id="interaction-modal-detail">자세히 보기</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#interaction-modal-close').addEventListener('click', () => {
    overlay.classList.remove('open');
  });
}

// interactionResult: { overallRisk, matches: [{items, severity, description}] }
function showInteractionModalIfNeeded(interactionResult) {
  if (!interactionResult || interactionResult.overallRisk === 'safe') return false;
  ensureModalMounted();
  const overlay = document.getElementById('interaction-modal');
  const badge = document.getElementById('interaction-modal-badge');
  const summary = document.getElementById('interaction-modal-summary');
  const detailBtn = document.getElementById('interaction-modal-detail');

  const isDanger = interactionResult.overallRisk === 'danger';
  badge.textContent = isDanger ? '위험' : '주의';
  badge.className = 'badge ' + (isDanger ? 'badge-coral' : 'badge-yellow');

  const first = interactionResult.matches[0];
  summary.textContent = `${first.items.join(' + ')}: ${first.description}`;

  const allItems = [...new Set(interactionResult.matches.flatMap((m) => m.items))];
  detailBtn.onclick = () => {
    location.href = '/guide.html?items=' + encodeURIComponent(allItems.join(','));
  };

  overlay.classList.add('open');
  return true;
}
