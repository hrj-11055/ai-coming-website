const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data');
const backupRoot = path.join(rootDir, 'backups', 'data');

function usage() {
    console.log('Usage: node scripts/data-restore.js <snapshot-dir-or-name>');
    process.exit(1);
}

function resolveSnapshot(input) {
    const directPath = path.resolve(rootDir, input);
    if (fs.existsSync(path.join(directPath, 'data'))) {
        return directPath;
    }

    const namedPath = path.join(backupRoot, input);
    if (fs.existsSync(path.join(namedPath, 'data'))) {
        return namedPath;
    }

    return null;
}

function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function main() {
    const input = process.argv[2];
    if (!input) {
        usage();
    }

    const snapshotDir = resolveSnapshot(input);
    if (!snapshotDir) {
        throw new Error(`snapshot not found: ${input}`);
    }

    const snapshotDataDir = path.join(snapshotDir, 'data');
    const preRestoreRoot = path.join(backupRoot, '_pre_restore');
    ensureDir(preRestoreRoot);

    const preRestoreName = new Date().toISOString().replace(/[:.]/g, '-');
    const preRestoreDir = path.join(preRestoreRoot, preRestoreName);

    if (fs.existsSync(dataDir)) {
        fs.cpSync(dataDir, preRestoreDir, { recursive: true });
        fs.rmSync(dataDir, { recursive: true, force: true });
    }

    fs.cpSync(snapshotDataDir, dataDir, { recursive: true });

    console.log(`restored_from=${path.relative(rootDir, snapshotDir)}`);
    console.log(`pre_restore_backup=${path.relative(rootDir, preRestoreDir)}`);
}

main();
