import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

function copyServicesPlugin() {
  return {
    name: 'copy-services-plugin',
    writeBundle() {
      const copyDir = (src, dest) => {
        if (!fs.existsSync(src)) return;
        fs.mkdirSync(dest, { recursive: true });
        for (const item of fs.readdirSync(src)) {
          const s = path.join(src, item);
          const d = path.join(dest, item);
          if (fs.statSync(s).isDirectory()) {
            copyDir(s, d);
          } else {
            fs.copyFileSync(s, d);
          }
        }
      };

      copyDir(path.resolve('src/services'), path.resolve('.vite/build/services'));
      copyDir(path.resolve('src/menuProfiles'), path.resolve('.vite/build/menuProfiles'));
      copyDir(path.resolve('src/helpers/bin'), path.resolve('.vite/build/helpers/bin'));
    },
  };
}

// https://vitejs.dev/config
export default defineConfig({
  plugins: [copyServicesPlugin()],
  build: {
    minify: true,
    reportCompressedSize: false,
  },
});
