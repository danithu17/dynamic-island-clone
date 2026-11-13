const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const path = require('path');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const { MakerSquirrel } = require('@electron-forge/maker-squirrel');
const { MakerZIP } = require('@electron-forge/maker-zip');

module.exports = {
  packagerConfig: {
    asar: true,
    executableName: 'aura-island',
    icon: path.join(__dirname, 'src/assets/icons/icon'),
    extraResource: [
      path.join(__dirname, 'src/assets/icons/icon.ico'),
      path.join(__dirname, 'src/assets/icons/icon.png'),
    ],
  },
  hooks: {
    postMake: async (forgeConfig, makeResults) => {
      const fs = require('fs');
      const path = require('path');
      const { version } = require('./package.json');

      for (const result of makeResults) {
        const os = 'Windows';
        const renamedArtifacts = [];

        for (const artifactPath of result.artifacts) {
          const ext = path.extname(artifactPath);
          // Skip non-installer files (e.g. blockmap, yml)
          if (!['.msi', '.zip', '.exe'].includes(ext)) {
            renamedArtifacts.push(artifactPath);
            continue;
          }

          const portableSuffix = ext === '.zip' ? '-Portable' : '';
          const newName = `AuraIsland-${os}-v${version}${portableSuffix}${ext}`;
          const newPath = path.join(path.dirname(artifactPath), newName);

          fs.renameSync(artifactPath, newPath);
          console.log(`Renamed: ${path.basename(artifactPath)} → ${newName}`);
          renamedArtifacts.push(newPath);

          // If .exe installer, also ensure -Setup.exe alias exists for updater compatibility
          if (ext === '.exe' && !newName.includes('-Setup')) {
            const setupName = `AuraIsland-${os}-v${version}-Setup${ext}`;
            const setupPath = path.join(path.dirname(artifactPath), setupName);
            try {
              fs.copyFileSync(newPath, setupPath);
              renamedArtifacts.push(setupPath);
            } catch (_) {}
          }

          // Also alias AuraIsland-Setup-${version}.exe and AuraIsland-${version}-portable.zip
          if (ext === '.exe') {
            const aliasName = `AuraIsland-Setup-${version}.exe`;
            const aliasPath = path.join(path.dirname(artifactPath), aliasName);
            try {
              fs.copyFileSync(newPath, aliasPath);
              renamedArtifacts.push(aliasPath);
            } catch (_) {}
          } else if (ext === '.zip') {
            const aliasZipName = `AuraIsland-${version}-portable.zip`;
            const aliasZipPath = path.join(path.dirname(artifactPath), aliasZipName);
            try {
              fs.copyFileSync(newPath, aliasZipPath);
              renamedArtifacts.push(aliasZipPath);
            } catch (_) {}
          }
        }

        result.artifacts = renamedArtifacts;
      }

      return makeResults;
    },
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      name: 'aura_island',
      authors: 'Aura Island Contributors',
      description: 'An island-style notch widget for Windows',
      setupIcon: path.join(__dirname, 'src/assets/icons/icon.ico')
    }),
    new MakerZIP({}, ['win32']),
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-vite',
      config: {
        build: [
          {
            entry: 'src/main.js',
            config: 'vite.main.config.mjs',
            target: 'main',
          },
          {
            entry: 'src/preload.js',
            config: 'vite.preload.config.mjs',
            target: 'preload',
          },
        ],
        renderer: [
          {
            name: 'main_window',
            config: 'vite.renderer.config.mjs',
          },
          {
            name: 'settings_window',
            config: 'vite.settings.config.mjs',
          },
        ],
      },
    },
  ],
};
