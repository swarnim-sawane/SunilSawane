(function (window) {
  'use strict';

  const PLACEHOLDER_IMAGE =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e0e0e0" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" font-size="18"%3ENo Image%3C/text%3E%3C/svg%3E';

  function text(value) {
    return value === undefined || value === null ? '' : String(value);
  }

  function safeUrl(value, fallback) {
    const url = text(value).trim();
    const defaultUrl = fallback || '#';

    if (!url) return defaultUrl;

    try {
      const parsed = new URL(url, window.location.href);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return url;
      if (parsed.protocol === 'data:' && /^data:image\//i.test(url)) return url;
      if (!/^[a-z][a-z0-9+.-]*:/i.test(url)) return url;
    } catch (error) {
      if (/^(?:\.{0,2}\/|#|\?)/.test(url)) return url;
    }

    return defaultUrl;
  }

  function clear(element) {
    if (element) element.replaceChildren();
  }

  function el(tagName, options) {
    const element = document.createElement(tagName);
    const opts = options || {};

    if (opts.className) element.className = opts.className;
    if (opts.text !== undefined) element.textContent = text(opts.text);

    Object.keys(opts.attrs || {}).forEach((name) => {
      const value = opts.attrs[name];
      if (value !== undefined && value !== null) {
        element.setAttribute(name, text(value));
      }
    });

    (opts.children || []).forEach((child) => {
      if (child !== undefined && child !== null) element.append(child);
    });

    return element;
  }

  function formatINR(value, options) {
    return '\u20b9' + (Number(value) || 0).toLocaleString('en-IN', options);
  }

  window.domUtils = {
    PLACEHOLDER_IMAGE,
    text,
    safeUrl,
    clear,
    el,
    formatINR
  };
})(window);
