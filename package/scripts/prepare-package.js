'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function preparePackage() {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

  const backupPath = path.join(__dirname, '..', 'package.json.bak');
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(packagePath, backupPath);
  }

  if (pkg.exports) {
    Object.keys(pkg.exports).forEach((key) => {
      const entry = pkg.exports[key];
      if (typeof entry === 'object') {
        if (entry.development && entry.development.includes('src/')) {
          delete entry.development;
        }
      }
    });
  }

  fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
}

preparePackage();
