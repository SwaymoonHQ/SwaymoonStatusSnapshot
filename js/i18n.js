/**
 * 摇月全站语言：显式选择（Cookie）> 账户偏好 > 浏览器语言 / Accept-Language > zh-CN。
 * 自动检测不写 Cookie，以便用户改浏览器语言后仍会跟着切。
 */
(function (global) {
  'use strict';

  var COOKIE = 'swaymoon_locale';
  var SUPPORTED = ['zh-CN', 'zh-TW', 'en', 'ja'];
  var LABELS = {
    'zh-CN': '简体中文',
    'zh-TW': '繁體中文',
    en: 'English',
    ja: '日本語',
  };

  function cookieDomain() {
    var host = (location.hostname || '').toLowerCase();
    if (host === 'swaymoon.com' || host.endsWith('.swaymoon.com')) return '.swaymoon.com';
    return '';
  }

  function readCookie(name) {
    var parts = ('; ' + document.cookie).split('; ' + name + '=');
    if (parts.length < 2) return '';
    return decodeURIComponent(parts.pop().split(';').shift() || '');
  }

  function writeCookie(name, value) {
    var maxAge = 365 * 24 * 60 * 60;
    var bits = [
      name + '=' + encodeURIComponent(value),
      'Path=/',
      'Max-Age=' + maxAge,
      'SameSite=Lax',
    ];
    if (location.protocol === 'https:') bits.push('Secure');
    var domain = cookieDomain();
    if (domain) bits.push('Domain=' + domain);
    document.cookie = bits.join('; ');
  }

  function normalizeTag(raw) {
    return String(raw || '').trim().replace(/_/g, '-');
  }

  function matchOne(raw) {
    var tag = normalizeTag(raw);
    if (!tag) return null;
    var lower = tag.toLowerCase();
    if (lower === 'zh-cn' || lower === 'zh-hans' || lower === 'zh-sg' || lower === 'zh-my') return 'zh-CN';
    if (
      lower === 'zh-tw' ||
      lower === 'zh-hk' ||
      lower === 'zh-mo' ||
      lower === 'zh-hant' ||
      lower.indexOf('zh-hant') === 0
    ) {
      return 'zh-TW';
    }
    if (lower === 'zh' || lower.indexOf('zh-hans') === 0) return 'zh-CN';
    if (lower === 'en' || lower.indexOf('en-') === 0) return 'en';
    if (lower === 'ja' || lower.indexOf('ja-') === 0) return 'ja';
    for (var i = 0; i < SUPPORTED.length; i++) {
      if (SUPPORTED[i].toLowerCase() === lower) return SUPPORTED[i];
    }
    return null;
  }

  function fromLanguageList(list) {
    if (!list || !list.length) return null;
    for (var i = 0; i < list.length; i++) {
      var hit = matchOne(list[i]);
      if (hit) return hit;
    }
    return null;
  }

  function queryLang() {
    try {
      return matchOne(new URLSearchParams(location.search).get('lang'));
    } catch (e) {
      return null;
    }
  }

  function browserLangs() {
    var list = [];
    if (typeof navigator !== 'undefined') {
      if (navigator.languages && navigator.languages.length) {
        for (var i = 0; i < navigator.languages.length; i++) list.push(navigator.languages[i]);
      }
      if (navigator.language) list.push(navigator.language);
      if (navigator.userLanguage) list.push(navigator.userLanguage);
    }
    return list;
  }

  function detect(options) {
    options = options || {};
    var fromQuery = queryLang();
    if (fromQuery) return fromQuery;
    if (!options.ignoreCookie) {
      var cookie = matchOne(readCookie(COOKIE));
      if (cookie) return cookie;
    }
    if (options.accountLocale) {
      var fromAccount = matchOne(options.accountLocale);
      if (fromAccount) return fromAccount;
    }
    return fromLanguageList(browserLangs()) || 'zh-CN';
  }

  var catalogs = global.SWAYMOON_I18N_MESSAGES || {};
  var locale = detect();

  function setHtmlLang(next) {
    if (document.documentElement) document.documentElement.lang = next;
  }

  setHtmlLang(locale);

  function interpolate(template, vars) {
    if (template == null) return '';
    var s = String(template);
    if (!vars) return s;
    return s.replace(/\{(\w+)\}/g, function (_, key) {
      return vars[key] == null ? '' : String(vars[key]);
    });
  }

  function t(key, vars) {
    var pack = catalogs[locale] || catalogs['zh-CN'] || {};
    var fallback = catalogs['zh-CN'] || {};
    var template = pack[key];
    if (template == null) template = fallback[key];
    if (template == null) return key;
    return interpolate(template, vars);
  }

  function applyDom(root) {
    var scope = root || document;
    if (!scope.querySelectorAll) return;
    scope.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    scope.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      el.innerHTML = t(el.getAttribute('data-i18n-html'));
    });
    scope.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
    });
    scope.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
    });
    var titleEl = document.querySelector('title[data-i18n]');
    if (titleEl) document.title = t(titleEl.getAttribute('data-i18n'));
  }

  function persist(next, opts) {
    opts = opts || {};
    locale = matchOne(next) || 'zh-CN';
    writeCookie(COOKIE, locale);
    setHtmlLang(locale);
    if (opts.reload !== false) {
      try {
        var url = new URL(location.href);
        url.searchParams.delete('lang');
        location.replace(url.toString());
      } catch (e) {
        location.reload();
      }
    }
  }

  function setLocale(next) {
    persist(next, { reload: true });
  }

  function syncFromAccount(accountLocale) {
    var next = matchOne(accountLocale);
    if (!next) return locale;
    if (readCookie(COOKIE)) return locale;
    locale = next;
    setHtmlLang(locale);
    return locale;
  }

  function captchaLanguage() {
    if (locale === 'zh-TW') return 'tw';
    if (locale === 'en') return 'en';
    if (locale === 'ja') return 'ja';
    return 'cn';
  }

  function switcherHtml() {
    var bits = ['<nav class="locale-switcher" aria-label="' + t('locale.label') + '">'];
    for (var i = 0; i < SUPPORTED.length; i++) {
      var id = SUPPORTED[i];
      var cls = 'locale-switcher-item' + (id === locale ? ' is-active' : '');
      bits.push(
        '<button type="button" class="' +
          cls +
          '" data-locale="' +
          id +
          '">' +
          LABELS[id] +
          '</button>',
      );
    }
    bits.push('</nav>');
    return bits.join('');
  }

  function bindSwitcher(root) {
    var scope = root || document;
    if (!scope.addEventListener) return;
    scope.addEventListener('click', function (ev) {
      var btn = ev.target && ev.target.closest ? ev.target.closest('[data-locale]') : null;
      if (!btn) return;
      ev.preventDefault();
      var next = btn.getAttribute('data-locale');
      if (!next || next === locale) return;
      if (typeof global.SwaymoonI18nOnChange === 'function') {
        Promise.resolve(global.SwaymoonI18nOnChange(next)).then(function (result) {
          if (result && result.redirect) {
            persist(next, { reload: false });
            location.replace(result.redirect);
            return;
          }
          persist(next, { reload: true });
        });
        return;
      }
      persist(next, { reload: true });
    });
  }

  if (queryLang()) writeCookie(COOKIE, locale);

  global.SwaymoonI18n = {
    COOKIE: COOKIE,
    SUPPORTED: SUPPORTED,
    LABELS: LABELS,
    t: t,
    detect: detect,
    locale: function () {
      return locale;
    },
    setLocale: setLocale,
    persist: persist,
    syncFromAccount: syncFromAccount,
    applyDom: applyDom,
    switcherHtml: switcherHtml,
    bindSwitcher: bindSwitcher,
    captchaLanguage: captchaLanguage,
    matchOne: matchOne,
    fromLanguageList: fromLanguageList,
    interpolate: interpolate,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      applyDom(document);
      bindSwitcher(document);
    });
  } else {
    applyDom(document);
    bindSwitcher(document);
  }
})(window);
