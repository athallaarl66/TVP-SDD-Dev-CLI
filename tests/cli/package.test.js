const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { CLI_DIR } = require('./helpers');

const ALLOWED_ROOTS = ['lib/', 'templates/', 'skill-templates/', 'workflow-templates/'];
const ALLOWED_FILES = ['package.json', 'README.md', 'LICENSE', 'CHANGELOG.md', 'index.js'];

function runNpm(args, cwd) {
  if (process.platform === 'win32') {
    const cli = path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
    return spawnSync(process.execPath, [cli, ...args], { cwd, encoding: 'utf-8' });
  }
  return spawnSync('npm', args, { cwd, encoding: 'utf-8' });
}

// Pack once per file run: both the allowlist check and the smoke test use it.
let packed = null;

function packOnce() {
  if (packed) return packed;
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-pack-'));
  const result = runNpm(['pack', '--pack-destination', dest, '--json'], CLI_DIR);
  assert.strictEqual(result.status, 0, result.stderr);
  const info = JSON.parse(result.stdout)[0];
  packed = { dir: dest, info, tarball: path.join(dest, info.filename) };
  return packed;
}

test('package: tarball contains only intended files', () => {
  const { info } = packOnce();
  const paths = info.files.map((f) => f.path);

  for (const p of paths) {
    const allowed = ALLOWED_FILES.includes(p) || ALLOWED_ROOTS.some((root) => p.startsWith(root));
    assert.ok(allowed, `unexpected file in package: ${p}`);
  }
  for (const forbidden of ['tests/', 'scripts/', 'openspec/', 'docs/', '.github/', 'node_modules/']) {
    assert.ok(
      !paths.some((p) => p.startsWith(forbidden)),
      `package must not ship ${forbidden}`
    );
  }
  // Runtime essentials really are present.
  assert.ok(paths.includes('index.js'));
  assert.ok(paths.some((p) => p.startsWith('templates/')));
  assert.ok(paths.some((p) => p.startsWith('skill-templates/')));
  assert.ok(paths.some((p) => p.startsWith('workflow-templates/')));
});

test('package: tarball runs a real command with shipped templates', () => {
  const { tarball, dir } = packOnce();
  const extractDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-extract-'));
  // GNU tar (git-bash) parses "C:" as a remote host; bsdtar does not know
  // --force-local. Try the portable form first, then fall back.
  let untar = spawnSync('tar', ['--force-local', '-xzf', tarball, '-C', extractDir], { encoding: 'utf-8' });
  if (untar.error || untar.status !== 0) {
    untar = spawnSync('tar', ['-xzf', tarball, '-C', extractDir], { encoding: 'utf-8' });
  }
  if (untar.error) {
    fs.removeSync(extractDir);
    fs.removeSync(dir);
    packed = null;
    return; // tar unavailable on this host; the allowlist test still covers contents
  }
  assert.strictEqual(untar.status, 0, untar.stderr);

  const pkgDir = path.join(extractDir, 'package');
  // The tarball ships no dependencies (npm installs them). Link the repo's
  // installed tree so the packaged CLI can actually run offline.
  const depsLink = path.join(pkgDir, 'node_modules');
  try {
    fs.symlinkSync(path.join(CLI_DIR, 'node_modules'), depsLink, 'junction');
  } catch (error) {
    fs.copySync(path.join(CLI_DIR, 'node_modules'), depsLink);
  }

  const cli = path.join(pkgDir, 'index.js');
  const pkg = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf-8'));

  const version = spawnSync(process.execPath, [cli, '--version'], { encoding: 'utf-8' });
  assert.strictEqual(version.status, 0, version.stderr);
  assert.match(version.stdout, new RegExp(pkg.version));

  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-smoke-'));
  const prd = spawnSync(process.execPath, [cli, '--yes', '/prd', 'smoke-feature'], {
    cwd: project,
    encoding: 'utf-8',
    env: { ...process.env, FORCE_COLOR: '0', SDD_CLI_ROOT: pkgDir }
  });
  assert.strictEqual(prd.status, 0, `${prd.stdout}\n${prd.stderr}`);
  assert.ok(
    fs.pathExistsSync(path.join(project, 'docs', 'features', 'smoke-feature-prd.md')),
    'packed templates must be able to generate a PRD'
  );

  fs.removeSync(project);
  // Unlink the dependency junction first: removing the parent directory can
  // follow a junction and delete the repo's own node_modules.
  try {
    fs.unlinkSync(depsLink);
  } catch (error) {
    // already gone or a real copy, which removeSync handles
  }
  fs.removeSync(extractDir);
});
