(() => {
  'use strict';
  const repo = 'pbrosvsanubias-star/nova-strike-updates';
  const status = document.getElementById('status');
  const version = document.getElementById('version');
  const download = document.getElementById('download');
  status.textContent = 'Die neueste APK wird gesucht …';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  async function start() {
    try {
      // Only public release metadata is read. No manifest, APK or notes are fetched here.
      const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
        headers: { Accept: 'application/vnd.github+json' },
        credentials: 'omit', cache: 'no-store', signal: controller.signal
      });
      if (!response.ok) throw new Error('Release metadata unavailable');
      const release = await response.json();
      if (!release || release.draft !== false || release.prerelease !== false) {
        throw new Error('Not a public stable release');
      }
      const match = /^v(\d+\.\d+(?:\.\d+)?)$/.exec(release.tag_name);
      if (!match || !Array.isArray(release.assets)) throw new Error('Invalid release');
      const appVersion = match[1];
      const name = `Nova-Strike-${appVersion}.apk`;
      const matches = release.assets.filter(asset => asset.name === name);
      if (matches.length !== 1) throw new Error('APK missing or ambiguous');
      const apk = matches[0];
      const expected = `https://github.com/${repo}/releases/download/v${appVersion}/${name}`;
      if (apk.state !== 'uploaded' || !Number.isSafeInteger(apk.size) || apk.size <= 0 ||
          apk.browser_download_url !== expected) throw new Error('Invalid APK destination');
      download.href = expected;
      download.textContent = 'APK herunterladen ↓';
      version.textContent = `Version ${appVersion} · ${(apk.size / 1024 / 1024).toLocaleString('de-DE', { maximumFractionDigits: 1 })} MB`;
      if (typeof release.body === 'string' && release.body.trim()) {
        document.getElementById('notes-text').textContent = release.body;
        document.getElementById('notes').hidden = false;
      }
      status.textContent = 'Dein APK-Download wird angefordert …';
      // One navigation per visit. The browser may ask the user to allow the download.
      window.location.assign(expected);
    } catch (_) {
      status.textContent = 'Der automatische Download ist gerade nicht verfügbar. Öffne die Downloads und wähle dort die APK aus.';
    } finally {
      clearTimeout(timeout);
    }
  }
  start();
})();
