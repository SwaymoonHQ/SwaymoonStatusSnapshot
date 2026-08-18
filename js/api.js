(function () {
  var cfg = window.SwaymoonConfig || {};
  if (cfg.SNAPSHOT_MODE) return;
  var base = (cfg.API_BASE || '').replace(/\/$/, '');

  function url(path) {
    if (!path) return base || '';
    if (path.indexOf('http') === 0) return path;
    return (base || '') + path;
  }

  function json(method, path, body) {
    var opts = {
      method: method,
      credentials: 'include',
      headers: { Accept: 'application/json' },
    };
    if (body != null) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = typeof body === 'string' ? body : JSON.stringify(body);
    }
    return fetch(url(path), opts).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) {
          var err = new Error((data && data.error) || res.statusText);
          err.status = res.status;
          err.data = data;
          throw err;
        }
        return data;
      }).catch(function (e) {
        if (e.status) throw e;
        if (!res.ok) {
          var err2 = new Error(res.statusText);
          err2.status = res.status;
          throw err2;
        }
        throw e;
      });
    });
  }

  window.SwaymoonStatusApi = { json: json, url: url };
})();
