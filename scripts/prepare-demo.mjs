import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();

const launchSourcePath = resolve(root, 'examples/vanilla-launch.js');
const launchDistPath = resolve(root, 'dist/vanilla-launch.js');

const htmlSourcePath = resolve(root, 'examples/vanilla-index.html');
const htmlDistPath = resolve(root, 'dist/vanilla-index.html');
const vendorDistPath = resolve(root, 'dist/vendor/joint-core');
const jointCoreSourcePath = resolve(root, 'node_modules/@joint/core');
const rbushDistPath = resolve(root, 'dist/vendor/rbush');
const rbushSourcePath = resolve(root, 'node_modules/rbush');
const quickselectDistPath = resolve(root, 'dist/vendor/quickselect');
const quickselectSourcePath = resolve(root, 'node_modules/.pnpm/node_modules/quickselect');
const reloadMarkerPath = resolve(root, 'dist/__reload.txt');

const launchSource = readFileSync(launchSourcePath, 'utf8');
const htmlSource = readFileSync(htmlSourcePath, 'utf8');

mkdirSync(resolve(root, 'dist'), { recursive: true });

const launchDist = launchSource.replace("from '../dist/index.js'", "from './index.js'");
const htmlDist = htmlSource.replace('src="/examples/vanilla-launch.js"', 'src="/vanilla-launch.js"');

writeFileSync(launchDistPath, launchDist);
writeFileSync(htmlDistPath, htmlDist);

rmSync(vendorDistPath, { recursive: true, force: true });
rmSync(rbushDistPath, { recursive: true, force: true });
rmSync(quickselectDistPath, { recursive: true, force: true });
mkdirSync(resolve(root, 'dist/vendor'), { recursive: true });
cpSync(jointCoreSourcePath, vendorDistPath, {
  recursive: true,
  dereference: true
});
cpSync(rbushSourcePath, rbushDistPath, {
  recursive: true,
  dereference: true
});
cpSync(quickselectSourcePath, quickselectDistPath, {
  recursive: true,
  dereference: true
});

writeFileSync(reloadMarkerPath, `${Date.now()} build\n`);
