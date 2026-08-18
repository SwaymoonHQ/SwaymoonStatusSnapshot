(function () {
  var cfg = window.SwaymoonConfig || {};
  var DOCS = (cfg.DOCS_FRONTEND || 'https://docs.swaymoon.com').replace(/\/$/, '');
  var PASSPORT = (cfg.PASSPORT_FRONTEND || 'https://passport.swaymoon.com').replace(/\/$/, '');
  var DOCS_LEGAL_TERMS = DOCS + '/legal/status/terms.html';
  var DOCS_LEGAL_PRIVACY = DOCS + '/legal/status/privacy.html';
  var DOCS_LEGAL_ABUSE = DOCS + '/legal/status/abuse.html';
  var SITES = [
    'passport', 'develop', 'docs', 'reportaproblem', 'sitemap', 'admin'
  ];

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

  function masthead() {
    return (
      '<header class="dev-topnav" role="banner">' +
      '<div class="dev-topnav-inner">' +
      '<a class="dev-brand" href="/">' +
      '<span class="dev-brand-name">' + esc(t('brand')) + '</span>' +
      '<span class="dev-brand-sub">' + esc(t('chrome.statusMonitor')) + '</span></a>' +
      '<span class="dev-topnav-spacer"></span>' +
      '<div class="dev-account">' +
      '<a class="dev-account-link" href="' + esc(DOCS) + '">' + esc(t('nav.docs')) + '</a>' +
      '<a class="dev-account-link" href="' + esc(PASSPORT) + '">' + esc(t('nav.account')) + '</a>' +
      '</div></div></header>'
    );
  }

  function sidebar(active) {
    function item(id, href, label) {
      var cls = 'dev-nav-item' + (active === id ? ' is-active' : '');
      if (active === id) {
        return '<span class="' + cls + '">' + esc(label) + '</span>';
      }
      return '<a class="' + cls + '" href="' + esc(href) + '">' + esc(label) + '</a>';
    }
    var siteLinks = SITES.map(function (id) {
      return item(id, '/site.html?id=' + encodeURIComponent(id), t('component.' + id));
    }).join('');
    return (
      '<aside class="dev-sidebar" aria-label="' + esc(t('section.sites')) + '">' +
      '<h2 class="dev-sidebar-heading">' + esc(t('chrome.statusMonitor')) + '</h2>' +
      '<nav class="dev-sidebar-nav">' +
      item('home', '/', t('nav.overview')) +
      item('history', '/history.html', t('nav.history')) +
      '<div class="dev-sidebar-divider" aria-hidden="true"></div>' +
      '<h3 class="dev-sidebar-subheading">' + esc(t('section.sites')) + '</h3>' +
      siteLinks +
      '</nav></aside>'
    );
  }

  function footer() {
    return (
      '<footer class="dev-footer">' +
      '<div class="dev-footer-inner">' +
      '<div class="dev-footer-bread">' +
      '<a href="/">' + esc(t('chrome.statusMonitor')) + '</a>' +
      '</div>' +
      '<div class="dev-footer-cols">' +
      '<div class="dev-footer-col">' +
      '<div class="dev-footer-heading">' + esc(t('chrome.legalPrivacy')) + '</div>' +
      '<a href="' + esc(DOCS_LEGAL_TERMS) + '">' + esc(t('chrome.terms')) + '</a>' +
      '<a href="' + esc(DOCS_LEGAL_PRIVACY) + '">' + esc(t('chrome.privacy')) + '</a>' +
      '<a href="' + esc(DOCS_LEGAL_ABUSE) + '">' + esc(t('chrome.abuse')) + '</a>' +
      '</div>' +
      '<div class="dev-footer-col">' +
      '<div class="dev-footer-heading">' + esc(t('chrome.resources')) + '</div>' +
      '<a href="' + esc(DOCS) + '">' + esc(t('nav.docs')) + '</a>' +
      '<a href="' + esc(PASSPORT) + '">' + esc(t('nav.account')) + '</a>' +
      '</div></div>' +
      '<div class="dev-footer-copy">' + esc(t('chrome.copyright')) +
      (window.SwaymoonI18n && window.SwaymoonI18n.switcherHtml ? window.SwaymoonI18n.switcherHtml() : '') +
      '</div></div></footer>'
    );
  }

  function mount(opts) {
    opts = opts || {};
    var root = document.getElementById('app-chrome');
    if (!root) return null;
    root.className = 'app-chrome';
    root.innerHTML =
      masthead() +
      '<div class="dev-shell">' +
      sidebar(opts.active || 'home') +
      '<main class="dev-main"><div class="dev-main-inner" id="page-main"></div></main>' +
      '</div>' +
      footer();
    if (window.SwaymoonI18n && window.SwaymoonI18n.bindSwitcher) {
      window.SwaymoonI18n.bindSwitcher(root);
    }
    return document.getElementById('page-main');
  }

  window.SwaymoonStatusShell = { mount: mount, esc: esc, t: t, SITES: SITES };
})();
