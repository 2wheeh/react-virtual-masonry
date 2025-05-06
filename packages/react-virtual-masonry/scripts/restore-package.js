'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resotrePackage() {
  const backupPath = path.join(__dirname, '..', 'package.json.bak');
  const packagePath = path.join(__dirname, '..', 'package.json');

  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, packagePath);
    fs.unlinkSync(backupPath);
  }
}

resotrePackage();
