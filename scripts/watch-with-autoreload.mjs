import { execFile } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const reloadPath = resolve(root, 'dist/__reload.txt');

function touchReload(reason) {
  try {
    const marker = `${Date.now()} ${reason}\n`;
    writeFileSync(reloadPath, marker);
    process.stdout.write(`[watch] reload marker updated: ${marker}`);
  } catch {
    // Ignore during first compile when dist may not exist yet.
  }
}

function runPrepareDemo() {
  return new Promise((resolvePromise, rejectPromise) => {
    execFile(process.execPath, ['./scripts/prepare-demo.mjs'], { cwd: root }, (error, stdout, stderr) => {
      if (stdout) {
        process.stdout.write(stdout);
      }
      if (stderr) {
        process.stderr.write(stderr);
      }
      if (error) {
        rejectPromise(error);
        return;
      }
      resolvePromise();
    });
  });
}

let pipeline = Promise.resolve();

function queuePrepare(reason) {
  process.stdout.write(`[watch] queue prepare: ${reason}\n`);
  pipeline = pipeline
    .then(async () => {
      await runPrepareDemo();
      touchReload(reason);
    })
    .catch((error) => {
      console.error('[watch] prepare-demo failed:', error instanceof Error ? error.message : String(error));
    });
}

function startCompilerWatch() {
  const cmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  const args = [
    'exec',
    'tsc',
    '-p',
    'tsconfig.build.json',
    '--watch',
    '--preserveWatchOutput',
    '--watchFile',
    'dynamicprioritypolling',
    '--watchDirectory',
    'dynamicprioritypolling'
  ];

  const child = execFile(cmd, args, { cwd: root });
  let compileCycle = 0;
  let preparedForCycle = -1;

  const onOutput = (chunk, writer) => {
    const text = chunk.toString();
    writer(text);

    if (text.includes('Starting compilation in watch mode') || text.includes('File change detected. Starting')) {
      compileCycle += 1;
    }

    if (text.includes('Watching for file changes') && preparedForCycle !== compileCycle) {
      preparedForCycle = compileCycle;
      queuePrepare('tsc-compiled');
    }
  };

  child.stdout?.on('data', (chunk) => onOutput(chunk, (text) => process.stdout.write(text)));
  child.stderr?.on('data', (chunk) => onOutput(chunk, (text) => process.stderr.write(text)));

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}

startCompilerWatch();
