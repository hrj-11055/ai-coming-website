const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data');
const backupRoot = path.join(rootDir, 'backups', 'data');

function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function createSnapshotName() {
    return new Date().toISOString().replace(/[:.]/g, '-');
}

function main() {
    if (!fs.existsSync(dataDir)) {
        throw new Error('data directory not found');
    }

    ensureDir(backupRoot);

    const snapshotName = createSnapshotName();
    const snapshotDir = path.join(backupRoot, snapshotName);
    const snapshotDataDir = path.join(snapshotDir, 'data');

    ensureDir(snapshotDir);
    fs.cpSync(dataDir, snapshotDataDir, { recursive: true });

    const metadata = {
        snapshot: snapshotName,
        created_at: new Date().toISOString(),
        source: path.relative(rootDir, dataDir),
        files: fs.readdirSync(dataDir).length
    };

    fs.writeFileSync(path.join(snapshotDir, 'metadata.json'), JSON.stringify(metadata, null, 2));

    console.log(`backup_created=${path.relative(rootDir, snapshotDir)}`);
}

main();
