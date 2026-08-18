(function () {
  var cfg = window.SwaymoonConfig || {};
  if (!cfg.SNAPSHOT_MODE) return;

  function snapshotUrl(path) {
    var bucket = Math.floor(Date.now() / 300000);
    var sep = path.indexOf('?') >= 0 ? '&' : '?';
    return path + sep + 'v=' + bucket;
  }

  function loadJson(path) {
    return fetch(snapshotUrl(path), { cache: 'no-store', credentials: 'omit' }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) {
          var err = new Error((data && data.error) || res.statusText);
          err.status = res.status;
          err.data = data;
          throw err;
        }
        return data;
      });
    });
  }

  function parseQuery(path) {
    var q = path.indexOf('?');
    if (q < 0) return {};
    var params = {};
    path.slice(q + 1).split('&').forEach(function (pair) {
      var i = pair.indexOf('=');
      if (i < 0) return;
      params[decodeURIComponent(pair.slice(0, i))] = decodeURIComponent(pair.slice(i + 1));
    });
    return params;
  }

  function pathOnly(path) {
    var q = path.indexOf('?');
    return q < 0 ? path : path.slice(0, q);
  }

  function sliceHistory(data, days) {
    var list = (data && data.days) || [];
    if (!days || days >= list.length) return { days: list };
    return { days: list.slice(list.length - days) };
  }

  function json(method, path, body) {
    if (method !== 'GET') {
      return Promise.reject(new Error('snapshot_read_only'));
    }
    var p = pathOnly(path);
    var qs = parseQuery(path);

    if (p.indexOf('/api/v1/auth/') === 0 || p.indexOf('/api/v1/subscribe/') === 0 || p.indexOf('/api/v1/admin/') === 0) {
      return Promise.reject(new Error('snapshot_read_only'));
    }
    if (p === '/api/v1/summary') {
      return loadJson('data/summary.json');
    }
    if (p === '/api/v1/incidents') {
      return loadJson('data/incidents-list.json');
    }
    if (p.indexOf('/api/v1/incidents/') === 0) {
      var id = decodeURIComponent(p.slice('/api/v1/incidents/'.length));
      return loadJson('data/incidents-detail.json').then(function (map) {
        var inc = map[id];
        if (!inc) {
          var err = new Error('not_found');
          err.status = 404;
          throw err;
        }
        return { incident: inc };
      });
    }
    if (p === '/api/v1/history/days') {
      var days = parseInt(qs.days || '7', 10);
      if (isNaN(days) || days < 1) days = 7;
      return loadJson('data/history-days-90.json').then(function (data) {
        return sliceHistory(data, days);
      });
    }
    return Promise.reject(new Error('snapshot_unknown_path: ' + p));
  }

  window.SwaymoonStatusApi = {
    json: json,
    url: function (path) {
      return path;
    },
  };
})();
