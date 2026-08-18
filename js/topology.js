(function () {
  var esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  /* visitor left; virginia mid-top; hangzhou mid-bottom; mac right — VA → HZ → Mac */
  var NODE_POS = {
    visitor: { x: 70, y: 130 },
    virginia: { x: 240, y: 50 },
    hangzhou: { x: 240, y: 210 },
    mac: { x: 460, y: 130 },
  };

  var EDGE_KEYS = [
    'visitor>hangzhou',
    'visitor>virginia',
    'virginia>hangzhou',
    'hangzhou>mac',
  ];

  function pathD(a, b) {
    /* Stop short of node disks so arrowheads stay visible */
    var pad = 22;
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    var len = Math.hypot(dx, dy) || 1;
    var ux = dx / len;
    var uy = dy / len;
    var start = { x: a.x + ux * pad, y: a.y + uy * pad };
    var end = { x: b.x - ux * pad, y: b.y - uy * pad };
    var mx = (start.x + end.x) / 2;
    return (
      'M' + start.x + ' ' + start.y +
      ' C' + mx + ' ' + start.y + ', ' + mx + ' ' + end.y + ', ' + end.x + ' ' + end.y
    );
  }

  function pathId(key) {
    return 'topo-p-' + String(key).replace(/>/g, '-');
  }

  function mid(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  function flowArrowsHtml(d, key) {
    var pid = pathId(key);
    /* Three chevrons, phase-offset to match dash period (1.6s / 20px). */
    var phases = ['0s', '-0.53s', '-1.07s'];
    return phases.map(function (begin) {
      return (
        '<polygon class="topo-flow-arrow" points="-5,-3.5 5,0 -5,3.5">' +
        '<animateMotion dur="1.6s" repeatCount="indefinite" rotate="auto" begin="' + begin + '" ' +
        'calcMode="linear">' +
        '<mpath href="#' + pid + '" xlink:href="#' + pid + '"/>' +
        '</animateMotion></polygon>'
      );
    }).join('');
  }

  function loadingEdges() {
    var out = {};
    EDGE_KEYS.forEach(function (k) {
      out[k] = { loading: true, ok: null, latencyMs: null, reason: '' };
    });
    return out;
  }

  function cloneEdges(src) {
    var out = {};
    EDGE_KEYS.forEach(function (k) {
      var e = (src && src[k]) || {};
      out[k] = {
        loading: !!e.loading,
        ok: e.ok,
        latencyMs: e.latencyMs,
        reason: e.reason || '',
      };
    });
    return out;
  }

  function edgeView(e, t, edgeKey) {
    e = e || {};
    var hasSample = e.ok != null || e.latencyMs != null || (!!e.reason && !e.loading);
    var loading = !!e.loading && !hasSample;
    var ok = !!e.ok;
    var downCls = 'topo-edge is-down';
    /* Non-origin hop down → yellow; origin (hangzhou>mac) down → red. */
    if (!ok && !loading && edgeKey && edgeKey !== 'hangzhou>mac') {
      downCls = 'topo-edge is-degraded';
    }
    return {
      loading: loading,
      ok: ok,
      cls: loading ? 'topo-edge is-loading' : (ok ? 'topo-edge is-up' : downCls),
      lat: loading
        ? t('latency.loading')
        : (ok && e.latencyMs != null ? e.latencyMs + ' ms' : '—'),
      reason: loading
        ? t('latency.loading')
        : (e.reason || 'unreachable'),
    };
  }

  function bindTooltip(container) {
    var tip = container.querySelector('.topo-tooltip');
    if (!tip || tip.dataset.bound === '1') return;
    tip.dataset.bound = '1';
    container.querySelectorAll('.topo-edge').forEach(function (g) {
      g.addEventListener('mouseenter', function (ev) {
        tip.hidden = false;
        tip.textContent = g.getAttribute('data-reason') || '';
        tip.style.left = ev.offsetX + 'px';
        tip.style.top = ev.offsetY + 'px';
      });
      g.addEventListener('mousemove', function (ev) {
        tip.style.left = (ev.offsetX + 12) + 'px';
        tip.style.top = (ev.offsetY + 12) + 'px';
      });
      g.addEventListener('mouseleave', function () { tip.hidden = true; });
    });
  }

  function updateEdgeGroup(g, view, m) {
    if (g.className.baseVal !== undefined) {
      if (g.getAttribute('class') !== view.cls) g.setAttribute('class', view.cls);
    } else if (g.className !== view.cls) {
      g.className = view.cls;
    }
    g.setAttribute('data-reason', view.reason);
    var latEl = g.querySelector('.topo-latency');
    if (latEl && latEl.textContent !== view.lat) latEl.textContent = view.lat;
    var cross = g.querySelector('.topo-cross');
    var needCross = !view.ok && !view.loading;
    if (needCross && !cross) {
      var ns = 'http://www.w3.org/2000/svg';
      var cg = document.createElementNS(ns, 'g');
      cg.setAttribute('class', 'topo-cross');
      cg.setAttribute('transform', 'translate(' + m.x + ',' + m.y + ')');
      [['-8', '-8', '8', '8'], ['8', '-8', '-8', '8']].forEach(function (pts) {
        var line = document.createElementNS(ns, 'line');
        line.setAttribute('x1', pts[0]);
        line.setAttribute('y1', pts[1]);
        line.setAttribute('x2', pts[2]);
        line.setAttribute('y2', pts[3]);
        cg.appendChild(line);
      });
      g.appendChild(cg);
    } else if (!needCross && cross) {
      cross.remove();
    }
  }

  function render(container, opts) {
    opts = opts || {};
    var t = opts.t || function (k) { return k; };
    var edges = opts.edges || {};
    var labels = {
      visitor: t('node.visitor'),
      hangzhou: t('node.hangzhou'),
      virginia: t('node.virginia'),
      mac: t('node.mac'),
    };
    var pairs = [
      ['visitor', 'hangzhou'],
      ['visitor', 'virginia'],
      ['virginia', 'hangzhou'],
      ['hangzhou', 'mac'],
    ];

    var existing = container.querySelector('.topo-svg');
    if (existing && !existing.querySelector('.topo-flow-arrows')) {
      container.innerHTML = '';
      existing = null;
    }
    if (existing) {
      pairs.forEach(function (p) {
        var from = p[0];
        var to = p[1];
        var key = from + '>' + to;
        var g = existing.querySelector('.topo-edge[data-edge="' + key + '"]');
        if (!g) return;
        updateEdgeGroup(g, edgeView(edges[key], t, key), mid(NODE_POS[from], NODE_POS[to]));
      });
      var titleEl = container.querySelector('.dev-section-title');
      if (opts.title && titleEl && titleEl.textContent !== opts.title) {
        titleEl.textContent = opts.title;
      }
      return;
    }

    var paths = pairs.map(function (p) {
      var from = p[0];
      var to = p[1];
      var key = from + '>' + to;
      var view = edgeView(edges[key], t, key);
      var a = NODE_POS[from];
      var b = NODE_POS[to];
      var m = mid(a, b);
      var cross = (!view.ok && !view.loading)
        ? '<g class="topo-cross" transform="translate(' + m.x + ',' + m.y + ')">' +
          '<line x1="-8" y1="-8" x2="8" y2="8"/><line x1="8" y1="-8" x2="-8" y2="8"/></g>'
        : '';
      var d = pathD(a, b);
      var pid = pathId(key);
      return (
        '<g class="' + view.cls + '" data-edge="' + esc(key) + '" data-reason="' + esc(view.reason) + '">' +
        '<path id="' + pid + '" d="' + d + '" class="topo-line"/>' +
        '<g class="topo-flow-arrows" aria-hidden="true">' + flowArrowsHtml(d, key) + '</g>' +
        '<text class="topo-latency" x="' + m.x + '" y="' + (m.y - 12) + '">' + esc(view.lat) + '</text>' +
        cross + '</g>'
      );
    }).join('');

    var nodes = Object.keys(NODE_POS).map(function (id) {
      var p = NODE_POS[id];
      return (
        '<g class="topo-node" transform="translate(' + p.x + ',' + p.y + ')">' +
        '<circle r="18"/><text y="38">' + esc(labels[id] || id) + '</text></g>'
      );
    }).join('');

    container.innerHTML =
      '<div class="topo-wrap">' +
      (opts.title ? '<h2 class="dev-section-title">' + esc(opts.title) + '</h2>' : '') +
      '<div class="topo-svg-wrap">' +
      '<svg class="topo-svg" viewBox="0 0 540 270" role="img" xmlns:xlink="http://www.w3.org/1999/xlink">' +
      paths + nodes + '</svg>' +
      '<div class="topo-tooltip" hidden></div></div></div>';

    bindTooltip(container);
  }

  function ping(url) {
    var t0 = performance.now();
    var opts = { cache: 'no-store', credentials: 'omit', mode: 'cors' };
    if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
      opts.signal = AbortSignal.timeout(2500);
    }
    return fetch(url, opts)
      .then(function (res) {
        var ms = Math.round(performance.now() - t0);
        return res.json().then(function (body) {
          return { ok: res.ok && body && body.ok !== false, latencyMs: ms, body: body, reason: null };
        }).catch(function () {
          return { ok: res.ok, latencyMs: ms, body: null, reason: 'HTTP ' + res.status };
        });
      })
      .catch(function (err) {
        return { ok: false, latencyMs: null, body: null, reason: String(err && err.message || err) };
      });
  }

  /**
   * Continuous per-edge measure.
   * - Keeps prior samples until that edge's new probe finishes (no full reset).
   * - opts.edges: shared state object (mutated in place)
   * - opts.inFlight: shared map of edgeKey → true while probing
   * Only starts a hop if that hop is not already in flight.
   */
  function measureSite(siteId, onUpdate, opts) {
    opts = opts || {};
    var cfg = window.SwaymoonConfig || {};
    if (cfg.SNAPSHOT_MODE) {
      var t = opts.t || (window.SwaymoonStatusShell && window.SwaymoonStatusShell.t) || function (k) { return k; };
      if (typeof onUpdate === 'function') {
        onUpdate({ static: true, message: t('snapshot.topologyStatic') });
      }
      return;
    }
    var hz = (cfg.EDGE_HZ || 'https://status-hz.swaymoon.com').replace(/\/$/, '');
    var va = (cfg.EDGE_VA || 'https://status-va.swaymoon.com').replace(/\/$/, '');
    var edges = opts.edges || loadingEdges();
    var inFlight = opts.inFlight || {};
    var t = opts.t || (window.SwaymoonStatusShell && window.SwaymoonStatusShell.t) || function (k) { return k; };
    var labelHz = t('node.hangzhou');
    var labelVa = t('node.virginia');
    var labelMac = t('node.mac');

    function notify() {
      if (typeof onUpdate === 'function') onUpdate(edges);
    }

    function setEdge(key, value) {
      edges[key] = value;
      notify();
    }

    function runHop(key, work) {
      if (inFlight[key]) return Promise.resolve();
      inFlight[key] = true;
      return Promise.resolve()
        .then(work)
        .then(function (value) {
          setEdge(key, value);
        })
        .finally(function () {
          inFlight[key] = false;
        });
    }

    var jobs = [
      runHop('visitor>hangzhou', function () {
        return ping(hz + '/api/v1/ping').then(function (vHz) {
          return {
            loading: false,
            ok: vHz.ok,
            latencyMs: vHz.latencyMs,
            reason: vHz.ok
              ? (labelHz + ' ' + vHz.latencyMs + ' ms')
              : (vHz.reason || (labelHz + ' unreachable')),
          };
        });
      }),
      runHop('visitor>virginia', function () {
        return ping(va + '/api/v1/ping').then(function (vVa) {
          return {
            loading: false,
            ok: vVa.ok,
            latencyMs: vVa.latencyMs,
            reason: vVa.ok
              ? (labelVa + ' ' + vVa.latencyMs + ' ms')
              : (vVa.reason || (labelVa + ' unreachable')),
          };
        });
      }),
      runHop('virginia>hangzhou', function () {
        return ping(va + '/api/v1/upstream/hangzhou').then(function (up) {
          var body = up.body || {};
          return {
            loading: false,
            ok: !!body.ok,
            latencyMs: body.latencyMs != null ? body.latencyMs : up.latencyMs,
            reason: body.publicReason || body.reason || up.reason ||
              (labelVa + ' → ' + labelHz + ' failed'),
          };
        });
      }),
      runHop('hangzhou>mac', function () {
        return ping(hz + '/api/v1/origin/' + encodeURIComponent(siteId)).then(function (oHz) {
          return {
            loading: false,
            ok: !!(oHz.body && oHz.body.ok),
            latencyMs: oHz.body && oHz.body.latencyMs,
            reason: (oHz.body && (oHz.body.publicReason || oHz.body.reason)) || oHz.reason ||
              (labelHz + ' → ' + labelMac + ' failed'),
          };
        });
      }),
    ];

    return Promise.all(jobs).then(function () { return edges; });
  }

  window.SwaymoonTopology = {
    render: render,
    measureSite: measureSite,
    loadingEdges: loadingEdges,
    cloneEdges: cloneEdges,
  };
})();
