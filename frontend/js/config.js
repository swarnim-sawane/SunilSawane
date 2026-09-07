// js/config.js - browser-global configuration for static pages.
(function (window) {
    'use strict';

    const localApiBaseUrl = 'http://127.0.0.1:1337/api';
    const remoteApiBaseUrl = 'https://growing-approval-51840080fc.strapiapp.com/api';
    const isLocalFrontend = ['localhost', '127.0.0.1', '::1', ''].includes(window.location.hostname);

    window.ART_CONFIG = Object.assign({
        apiBaseUrl: isLocalFrontend ? localApiBaseUrl : remoteApiBaseUrl,
        emailjs: {
            serviceId: 'service_vetp2fb',
            templateId: 'template_8326uqf',
            publicKey: 'CH1xkEcNl5g1ENnrb'
        }
    }, window.ART_CONFIG || {});
})(window);
