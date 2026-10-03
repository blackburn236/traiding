// Service worker intentionally disabled in V20.2 PRO to prevent stale dashboard versions.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',()=>self.clients.claim());
