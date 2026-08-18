(function () {
  function mount(el, opts) {
    opts = opts || {};
    var Api = window.SwaymoonStatusApi;
    var t = opts.t || function (k) { return k; };
    var esc = opts.esc || function (s) { return String(s == null ? '' : s); };
    var days = opts.days || 7;
    var component = opts.component || null;

    el.innerHTML =
      '<section class="history-bar" aria-label="' + esc(t('history.bar.title')) + '">' +
      '<div class="history-bar-head">' +
      '<h2 class="dev-section-title">' + esc(t('history.bar.title')) + '</h2>' +
      '<div class="history-bar-legend">' +
      '<span><i class="history-swatch is-ok"></i>' + esc(t('history.bar.ok')) + '</span>' +
      '<span><i class="history-swatch is-minor"></i>' + esc(t('history.bar.minor')) + '</span>' +
      '<span><i class="history-swatch is-major"></i>' + esc(t('history.bar.major')) + '</span>' +
      '</div></div>' +
      '<div class="history-bar-track">' +
      '<div class="history-bar-days" role="list">' +
      '<p class="history-bar-loading">' + esc(t('history.bar.loading')) + '</p>' +
      '</div></div></section>';

    var daysEl = el.querySelector('.history-bar-days');
    var track = el.querySelector('.history-bar-track');
    var q = '/api/v1/history/days?days=' + encodeURIComponent(days);
    if (component) q += '&component=' + encodeURIComponent(component);

    return Api.json('GET', q).then(function (data) {
      var list = data.days || [];
      if (!list.length) {
        daysEl.innerHTML = '<p class="history-bar-loading">' + esc(t('history.bar.empty')) + '</p>';
        return data;
      }
      daysEl.innerHTML = list.map(function (day, idx) {
        var level = day.level || 'ok';
        var incs = day.incidents || [];
        var tip;
        if (!incs.length) {
          tip = day.date + ' · ' + t('history.bar.ok');
        } else {
          tip = day.date + '\n' + incs.map(function (inc) {
            return '· ' + (inc.title || '') + ' (' + (inc.severity || '') + ')';
          }).join('\n');
        }
        return (
          '<button type="button" class="history-day is-' + esc(level) + '" role="listitem" ' +
          'data-day-idx="' + idx + '" ' +
          'title="' + esc(tip) + '" aria-label="' + esc(tip.replace(/\n/g, ', ')) + '">' +
          '<span class="history-day-fill"></span>' +
          '</button>'
        );
      }).join('');
      daysEl.querySelectorAll('.history-day').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var idx = Number(btn.getAttribute('data-day-idx'));
          var day = list[idx];
          if (!day || !(day.incidents || []).length) return;
          var first = day.incidents[0];
          if (first && first.id) {
            location.href = '/incident.html?id=' + encodeURIComponent(first.id);
          }
        });
      });
      var axis = document.createElement('div');
      axis.className = 'history-bar-axis';
      axis.setAttribute('aria-hidden', 'true');
      axis.innerHTML =
        '<span>' + esc((list[0] && list[0].date) || '') + '</span>' +
        '<span>' + esc((list[list.length - 1] && list[list.length - 1].date) || '') + '</span>';
      var oldAxis = track.querySelector('.history-bar-axis');
      if (oldAxis) oldAxis.remove();
      track.appendChild(axis);
      return data;
    }).catch(function (err) {
      daysEl.innerHTML =
        '<p class="history-bar-loading">' + esc(String((err && err.message) || err)) + '</p>';
    });
  }

  window.SwaymoonHistoryBar = { mount: mount };
})();
