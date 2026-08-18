(function () {
  var cfg = window.SwaymoonConfig || {};
  if (!cfg.SNAPSHOT_MODE) return;

  function t(key) {
    return window.SwaymoonI18n && window.SwaymoonI18n.t ? window.SwaymoonI18n.t(key) : key;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fmtTime(ms) {
    if (ms == null) return '—';
    try { return new Date(ms).toLocaleString(); } catch (e) { return String(ms); }
  }

  window.SwaymoonSnapshotChrome = {
    mountBanner: function (slotId) {
      var slot = document.getElementById(slotId || 'snapshot-banner-slot');
      if (!slot) return Promise.resolve();
      var live = (cfg.LIVE_ORIGIN || 'https://status.swaymoon.com').replace(/\/$/, '');
      var bucket = Math.floor(Date.now() / 300000);
      return fetch('/data/meta.json?v=' + bucket, { cache: 'no-store' }).then(function (res) { return res.json(); }).then(function (meta) {
        var down = !!meta.originUnreachable;
        var stale = !down && !!meta.stale;
        var when = fmtTime(meta.generatedAt);
        var extra = down ? t('snapshot.originDown') : (stale ? t('snapshot.stale') : '');
        slot.innerHTML =
          '<aside class="status-snapshot-banner' + (down ? ' is-down' : (stale ? ' is-stale' : '')) + '" role="note">' +
          '<p><strong>' + esc(t('snapshot.banner')) + '</strong> · ' +
          esc(t('snapshot.updated')) + ' ' + esc(when) +
          (extra ? ' · ' + esc(extra) : '') +
          ' · <a href="' + esc(live) + '">' + esc(t('snapshot.openLive')) + '</a></p>' +
          '</aside>';
      }).catch(function () {
        slot.innerHTML =
          '<aside class="status-snapshot-banner" role="note">' +
          '<p><strong>' + esc(t('snapshot.banner')) + '</strong> · ' +
          '<a href="' + esc(live) + '">' + esc(t('snapshot.openLive')) + '</a></p></aside>';
      });
    },
  };
})();
