(function(){
  const state = {
    data: null,
    root: null,
    board: null,
    thumb: null,
    track: null,
    dragging: false
  };

  const statusInfo = {
    live: { label: 'Live', color: '#4aa3ff' },
    done: { label: 'Done', color: '#1fbf75' },
    'in-progress': { label: 'In progress', color: '#f5a524' },
    todo: { label: 'Not started', color: '#8992a3' }
  };

  function css(){
    if (document.getElementById('roadmap-styles')) return;
    const style = document.createElement('style');
    style.id = 'roadmap-styles';
    style.textContent = `
      #roadmap-root{--navy:#0b1324;--navy-700:#101b31;--border:#23314f;--text:#eef4ff;--muted:#9ba8be}
      .rm-wrap{background:var(--navy);color:var(--text);border-radius:8px;padding:14px;border:1px solid var(--border)}
      .rm-top{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:12px}
      .rm-title{font-size:18px;font-weight:800}
      .rm-progress{color:var(--muted);font-size:13px}
      .rm-legend,.rm-chips,.rm-scrollbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:10px 0}
      .rm-legend span,.rm-chip{border:1px solid var(--border);background:var(--navy-700);border-radius:999px;padding:5px 9px;font-size:12px;color:var(--muted)}
      .rm-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;vertical-align:middle}
      .rm-priority{display:inline-block;width:8px;height:8px;background:#f05252;border-radius:2px;margin-right:6px}
      .rm-chip{cursor:pointer;min-width:98px;color:var(--text)}
      .rm-chip small{display:block;color:var(--muted);margin-bottom:4px}
      .rm-chip-bar{height:3px;background:#1c2942;border-radius:999px;overflow:hidden}
      .rm-chip-bar i{display:block;height:100%;width:0}
      .rm-scrollbar{flex-wrap:nowrap}
      .rm-scroll-btn{width:32px;height:28px;padding:0;border-radius:6px;border:1px solid var(--border);background:var(--navy-700);color:var(--text);cursor:pointer}
      .rm-track{position:relative;flex:1;height:12px;background:#111a2c;border:1px solid var(--border);border-radius:999px;cursor:pointer}
      .rm-thumb{position:absolute;top:1px;left:0;height:8px;width:80px;border-radius:999px;background:#6f7fa3;cursor:grab}
      .rm-board{display:flex;gap:12px;overflow-x:auto;scrollbar-width:none;padding:2px 0 4px;scroll-behavior:smooth}
      .rm-board::-webkit-scrollbar{display:none}
      .rm-layer{flex:0 0 220px;background:var(--navy-700);border:1px solid var(--border);border-radius:8px;overflow:hidden}
      .rm-layer-head{padding:10px;border-bottom:1px solid var(--border)}
      .rm-layer-title{font-weight:800;font-size:13px;line-height:1.3}
      .rm-mvp{display:inline-block;margin-left:6px;border:1px solid currentColor;border-radius:999px;padding:1px 5px;font-size:10px;color:#1fbf75}
      .rm-layer-desc{color:var(--muted);font-size:11px;margin-top:5px;line-height:1.35}
      .rm-layer-meta{display:flex;justify-content:space-between;align-items:center;margin-top:8px;color:var(--muted);font-size:11px}
      .rm-bar{height:4px;background:#172239;border-radius:999px;overflow:hidden;margin-top:6px}
      .rm-bar i{display:block;height:100%;width:0}
      .rm-items{display:flex;flex-direction:column;gap:8px;padding:10px}
      .rm-card{position:relative;border:1px solid var(--border);border-radius:8px;background:#0e1729;padding:9px;cursor:pointer}
      .rm-card.done{opacity:.42}.rm-card.live{opacity:.7}
      .rm-card-main{display:grid;grid-template-columns:auto 1fr auto;gap:7px;align-items:start}
      .rm-card-title{font-weight:800;font-size:12px;line-height:1.35}
      .rm-chevron{color:var(--muted);font-weight:800}
      .rm-detail{display:none;color:var(--muted);font-size:12px;line-height:1.4;margin-top:8px}
      .rm-card.open .rm-detail{display:block}
      .rm-hi{position:absolute;top:7px;right:7px;width:7px;height:7px;background:#f05252;border-radius:2px}
      .rm-error{border:1px solid #7f1d1d;background:#2a1111;color:#fecaca;border-radius:8px;padding:12px}
    `;
    document.head.appendChild(style);
  }

  function doneCount(items){
    return items.filter(item => item.status === 'done').length;
  }

  function progress(items){
    return items.length ? Math.round((doneCount(items) / items.length) * 100) : 0;
  }

  function dot(status){
    const info = statusInfo[status] || statusInfo.todo;
    return `<span class="rm-dot" style="background:${info.color}"></span>`;
  }

  function renderHeader(data){
    const all = data.layers.flatMap(layer => layer.items || []);
    const complete = doneCount(all);
    return `
      <div class="rm-top">
        <div class="rm-title">Roadmap</div>
        <div class="rm-progress">${complete} of ${all.length} items complete across ${data.layers.length} layers</div>
      </div>
      <div class="rm-legend">
        ${Object.entries(statusInfo).map(([key, info]) => `<span>${dot(key)}${info.label}</span>`).join('')}
        <span><i class="rm-priority"></i>High priority</span>
      </div>
    `;
  }

  function renderChips(layers){
    return `<div class="rm-chips">${layers.map((layer, idx) => {
      const items = layer.items || [];
      const pct = progress(items);
      return `
        <button class="rm-chip" type="button" onclick="roadmapJumpTo(${idx})">
          <small>${layer.label}</small>
          ${doneCount(items)}/${items.length}
          <div class="rm-chip-bar"><i style="width:${pct}%;background:${layer.color}"></i></div>
        </button>
      `;
    }).join('')}</div>`;
  }

  function renderScroll(){
    return `
      <div class="rm-scrollbar">
        <button class="rm-scroll-btn" type="button" data-dir="-1">&lsaquo;</button>
        <div class="rm-track"><div class="rm-thumb"></div></div>
        <button class="rm-scroll-btn" type="button" data-dir="1">&rsaquo;</button>
      </div>
    `;
  }

  function renderLayer(layer){
    const items = layer.items || [];
    const pct = progress(items);
    return `
      <section class="rm-layer">
        <div class="rm-layer-head">
          <div class="rm-layer-title">${layer.label}${layer.mvp ? '<span class="rm-mvp">MVP</span>' : ''}</div>
          <div class="rm-layer-desc">${layer.description || ''}</div>
          <div class="rm-layer-meta"><span>${doneCount(items)}/${items.length} done</span><span>${pct}%</span></div>
          <div class="rm-bar"><i style="width:${pct}%;background:${layer.color}"></i></div>
        </div>
        <div class="rm-items">${items.map(renderCard).join('')}</div>
      </section>
    `;
  }

  function renderCard(item){
    const status = item.status || 'todo';
    const hasDetail = !!item.detail;
    return `
      <article class="rm-card ${status}" tabindex="0" role="button">
        ${item.priority === 'high' ? '<span class="rm-hi"></span>' : ''}
        <div class="rm-card-main">
          ${dot(status)}
          <div class="rm-card-title">${item.title}</div>
          <div class="rm-chevron">${hasDetail ? '&rsaquo;' : ''}</div>
        </div>
        ${hasDetail ? `<div class="rm-detail">${item.detail}</div>` : ''}
      </article>
    `;
  }

  function syncThumb(){
    if (!state.board || !state.track || !state.thumb) return;
    const maxScroll = state.board.scrollWidth - state.board.clientWidth;
    const trackW = state.track.clientWidth;
    const thumbW = Math.max(40, Math.round((state.board.clientWidth / state.board.scrollWidth) * trackW));
    const maxLeft = Math.max(0, trackW - thumbW - 2);
    const left = maxScroll ? Math.round((state.board.scrollLeft / maxScroll) * maxLeft) : 0;
    state.thumb.style.width = `${thumbW}px`;
    state.thumb.style.left = `${left}px`;
  }

  function bind(root){
    state.board = root.querySelector('.rm-board');
    state.track = root.querySelector('.rm-track');
    state.thumb = root.querySelector('.rm-thumb');
    root.querySelectorAll('.rm-card').forEach(card => {
      card.addEventListener('click', () => {
        card.classList.toggle('open');
        const chev = card.querySelector('.rm-chevron');
        if (chev && chev.textContent) chev.innerHTML = card.classList.contains('open') ? '&lsaquo;' : '&rsaquo;';
      });
    });
    root.querySelectorAll('.rm-scroll-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const dir = Number(btn.dataset.dir || 1);
        state.board.scrollBy({ left: dir * 464, behavior: 'smooth' });
      });
    });
    state.board.addEventListener('scroll', syncThumb);
    window.addEventListener('resize', syncThumb);
    state.track.addEventListener('click', e => {
      if (e.target === state.thumb) return;
      const rect = state.track.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      state.board.scrollTo({ left: ratio * (state.board.scrollWidth - state.board.clientWidth), behavior: 'smooth' });
    });
    state.thumb.addEventListener('pointerdown', e => {
      state.dragging = { startX: e.clientX, startLeft: state.board.scrollLeft };
      state.thumb.setPointerCapture(e.pointerId);
    });
    state.thumb.addEventListener('pointermove', e => {
      if (!state.dragging) return;
      const maxScroll = state.board.scrollWidth - state.board.clientWidth;
      const maxLeft = state.track.clientWidth - state.thumb.clientWidth;
      const dx = e.clientX - state.dragging.startX;
      state.board.scrollLeft = state.dragging.startLeft + (dx / maxLeft) * maxScroll;
    });
    state.thumb.addEventListener('pointerup', () => { state.dragging = false; });
    syncThumb();
  }

  window.roadmapJumpTo = function(idx){
    const board = state.board;
    if (!board) return;
    board.scrollTo({ left: idx * 232, behavior: 'smooth' });
  };

  window.initRoadmap = async function(){
    css();
    state.root = document.getElementById('roadmap-root');
    if (!state.root) return;
    state.root.innerHTML = '<div class="rm-wrap">Loading roadmap...</div>';
    try {
      const res = await fetch('/data/roadmap.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Roadmap fetch failed (${res.status})`);
      state.data = await res.json();
      state.root.innerHTML = `
        <div class="rm-wrap">
          ${renderHeader(state.data)}
          ${renderChips(state.data.layers || [])}
          ${renderScroll()}
          <div class="rm-board">${(state.data.layers || []).map(renderLayer).join('')}</div>
        </div>
      `;
      bind(state.root);
    } catch (err) {
      state.root.innerHTML = `<div class="rm-error">${err.message}</div>`;
    }
  };
})();
