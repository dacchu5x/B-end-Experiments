// Reusable 3D cupboard scene: one separate 3D cupboard per rack, each with shelves, sample books and doors.
// Look and door behaviour are ported from the index.html projection (style.css / script.js).
//   Cupboard3D.render(host, { racks, shelves, doors })  draw the scene into host (doors start closed)
//   Cupboard3D.setDoors(host, doors)                     change only the door type
//   Cupboard3D.setOpen(host, p)                          open amount of every door, 0 closed to 1 open
//   Cupboard3D.toggle(host)                              open all, or close all: 'open' | 'closed' | 'none'
// Clicking a door toggles it, dragging a door moves it. Pair with cupboard3d.css.
window.Cupboard3D = (function () {
  const INK = ['#7b2d26', '#2f4858', '#3d5a3d', '#8a6d1f', '#5c3a5e', '#1f4f5f', '#6b4226'];
  const DOOR_TYPES = {
    'Sliding Doors': { door: 'sliding', material: 'glass' },
    'Side Opening': { door: 'openclose', material: 'glass' },
    'Top Opening': { door: 'dropdown', material: 'glass' },
    'Open Shelves': { door: 'none', material: 'glass' },
    'Glass Doors': { door: 'openclose', material: 'glass' },
    'Wooden Doors': { door: 'openclose', material: 'wood' },
    'Open/Close Doors': { door: 'dropdown', material: 'glass' },
  };
  const NO_DOORS = { door: 'none', material: 'glass' }; // an unknown door type draws no doors
  const GAP = 14;
  const DRAG_MIN = 0.04;
  const drags = new WeakMap();

  const rand = (n) => Math.floor(Math.random() * n);
  const count = (n) => Math.min(8, Math.max(1, Math.round(Number(n)) || 1));
  // The panels that open in the current door mode: the front doors, or one glass flap per compartment.
  const panelsOf = (host) => Array.from(host.querySelectorAll(host.dataset.door === 'dropdown' ? '.c3d-flap' : '.c3d-door'));
  const openAmount = (panel) => Number(panel.style.getPropertyValue('--p')) || 0;

  // A compartment holds nothing, a full row, half a row or a random amount, as on index.html.
  function booksHtml(cap) {
    const n = Math.round([0, 1, 0.5, Math.random()][rand(4)] * cap);
    let html = '';
    for (let k = 0; k < n; k++) {
      const tilt = Math.random() < 0.15 ? 8 : 0;
      const delay = 0.3 + Math.min(k, 12) * 0.04;
      html += `<div class="c3d-book" style="--r:${tilt}deg;--d:${delay}s;width:${5 + rand(6)}px;height:${55 + rand(36)}%;background:${INK[rand(INK.length)]}"></div>`;
    }
    return html;
  }

  function render(host, opts) {
    const racks = count(opts.racks);
    const shelves = count(opts.shelves);
    host.classList.add('c3d');
    host.setAttribute('role', 'img');
    host.setAttribute('aria-label', `3D preview: ${racks} separate cupboards with ${shelves} shelves each`);
    host.innerHTML = '<div class="c3d-frame"><div class="c3d-grid"></div></div>';

    const frame = host.firstElementChild;
    const unitWidth = ((frame.clientWidth || 500) - (racks - 1) * GAP) / racks;
    const cap = Math.max(2, Math.floor((unitWidth - 16) / 10));
    let html = '';
    for (let i = 0; i < racks; i++) {
      let unit = '<div class="c3d-back"></div>';
      for (let j = 0; j < shelves; j++) {
        const top = `${j * 100 / shelves}%`;
        unit += (j ? `<div class="c3d-shelf" style="top:${top}"></div>` : '') +
          `<div class="c3d-books" style="top:${top};height:${100 / shelves}%">${booksHtml(cap)}</div>` +
          `<div class="c3d-flap" style="top:${top};height:${100 / shelves}%"></div>`;
      }
      html += `<div class="c3d-unit" style="--d:${i * 0.09}s">${unit}<div class="c3d-door c3d-left"></div><div class="c3d-door c3d-right"></div></div>`;
    }
    frame.firstElementChild.innerHTML = html;

    bindPointer(host);
    setDoors(host, opts.doors);
  }

  function setDoors(host, doors) {
    const type = DOOR_TYPES[doors] || NO_DOORS;
    host.dataset.door = type.door;
    host.dataset.material = type.material;
  }

  function setOpen(host, p) {
    // Sliding doors run on two tracks. If both panels moved they would swap places and the
    // cupboard would still look shut, so only the front (left) panel glides.
    const frontOnly = host.dataset.door === 'sliding';
    panelsOf(host).forEach((panel) => {
      panel.style.setProperty('--p', frontOnly && panel.classList.contains('c3d-right') ? 0 : p);
    });
  }

  function toggle(host) {
    if (!host.dataset.door || host.dataset.door === 'none') return 'none';
    const wasOpen = panelsOf(host).some((panel) => openAmount(panel) > 0.5);
    setOpen(host, wasOpen ? 0 : 1);
    return wasOpen ? 'closed' : 'open';
  }

  // One set of handlers per host (event delegation), so render() can run again and again.
  function bindPointer(host) {
    if (host.dataset.c3dBound) return;
    host.dataset.c3dBound = '1';

    host.addEventListener('pointerdown', (e) => {
      const door = e.target.closest('.c3d-door, .c3d-flap');
      if (!door) return;
      drags.set(host, { door, x: e.clientX, y: e.clientY, p: openAmount(door), w: door.offsetWidth, h: door.offsetHeight, moved: false });
      door.classList.add('c3d-dragging');
      door.setPointerCapture(e.pointerId);
    });

    host.addEventListener('pointermove', (e) => {
      const drag = drags.get(host);
      if (!drag) return;
      // A left door opens by dragging right, a right door by dragging left, a fold-down flap by dragging down.
      let delta;
      if (drag.door.classList.contains('c3d-flap')) delta = (e.clientY - drag.y) / drag.h;
      else delta = (drag.door.classList.contains('c3d-right') ? drag.x - e.clientX : e.clientX - drag.x) / drag.w;
      if (Math.abs(delta) > DRAG_MIN) drag.moved = true;
      drag.door.style.setProperty('--p', Math.min(Math.max(drag.p + delta, 0), 1));
    });

    const release = () => {
      const drag = drags.get(host);
      if (!drag) return;
      drag.door.classList.remove('c3d-dragging');
      if (!drag.moved) drag.door.style.setProperty('--p', drag.p > 0.5 ? 0 : 1);
      drags.delete(host);
    };
    host.addEventListener('pointerup', release);
    host.addEventListener('pointercancel', release);
  }

  return { render, setDoors, setOpen, toggle };
})();
