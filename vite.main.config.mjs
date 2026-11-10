import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

function copyServicesPlugin() {
  return {
    name: 'copy-services-plugin',
    writeBundle() {
      const srcDir = path.resolve('src/services');
      const destDir = path.resolve('.vite/build/services');
      if (fs.existsSync(srcDir)) {
        fs.mkdirSync(destDir, { recursive: true });
        for (const file of fs.readdirSync(srcDir)) {
          fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
        }
      }
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
