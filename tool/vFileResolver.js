import { readFileSync } from 'fs';
import path from 'path';

const vfilePkgPath = require.resolve('vfile/package.json');
const vfilePkg = JSON.parse(readFileSync(vfilePkgPath).toString());
const vfileDirPath = path.dirname(vfilePkgPath);
const vfileBrowser = vfilePkg.browser;
const vfileBrowserKeys = Object.keys(vfileBrowser);

export default {
  name: 'resolve vfile',
  resolveId: (request, from) => {
    for (const key of vfileBrowserKeys) {
      if (request === path.resolve(vfileDirPath, key)) {
        return path.resolve(vfileDirPath, vfileBrowser[key]);
      }
    }
  },
};
