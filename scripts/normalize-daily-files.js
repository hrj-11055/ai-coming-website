const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data');
const logsDir = path.join(rootDir, 'logs');
const targetDirs = [
    dataDir,
    path.join(dataDir, 'archive', 'daily')
];

const shouldApply = process.argv.includes('--apply');

function normalizeNewsPayload(rawData) {
    if (Array.isArray(rawData)) {
        return rawData;
    }
    if (rawData && Array.isArray(rawData.articles)) {
        return rawData.articles;
    }
    return [];
}

function dedupeArticles(articles) {
    const seen = new Set();
    const output = [];

    for (const article of articles) {
        const key = [
            article.id || '',
            article.title || '',
            article.source_url || article.url || '',
            article.published_at || '',
            article.created_at || ''
        ].join('|');

        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        output.push(article);
    }

    return output;
}

function readArticles(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const raw = JSON.parse(content);
    return normalizeNewsPayload(raw);
}

function collectDateFiles(dirPath) {
    if (!fs.existsSync(dirPath)) {
        return new Map();
    }

    const files = fs.readdirSync(dirPath).filter((file) => file.endsWith('.json'));
    const dateMap = new Map();

    for (const file of files) {
        let date = null;
        let preferred = false;

        const prefixedMatch = file.match(/^news-(\d{4}-\d{2}-\d{2})\.json$/);
        const plainMatch = file.match(/^(\d{4}-\d{2}-\d{2})\.json$/);

        if (prefixedMatch) {
            date = prefixedMatch[1];
            preferred = true;
        } else if (plainMatch) {
            date = plainMatch[1];
        }

        if (!date) {
            continue;
        }

        if (!dateMap.has(date)) {
            dateMap.set(date, []);
        }

        dateMap.get(date).push({
            file,
            filePath: path.join(dirPath, file),
            preferred
        });
    }

    return dateMap;
}

function normalizeDir(dirPath) {
    const dateMap = collectDateFiles(dirPath);
    const operations = [];

    for (const [date, entries] of dateMap.entries()) {
        const targetFile = `news-${date}.json`;
        const targetPath = path.join(dirPath, targetFile);
        const hasOnlyCanonical = entries.length === 1 && entries[0].file === targetFile;

        if (hasOnlyCanonical) {
            continue;
        }

        let merged = [];
        for (const entry of entries) {
            try {
                merged = merged.concat(readArticles(entry.filePath));
            } catch (error) {
                operations.push({
                    type: 'read_error',
                    dirPath,
                    date,
                    file: entry.file,
                    error: error.message
                });
            }
        }

        const deduped = dedupeArticles(merged);
        const removeFiles = entries
            .map((entry) => entry.filePath)
            .filter((filePath) => filePath !== targetPath);

        operations.push({
            type: 'normalize_daily_file',
            dirPath,
            date,
            targetFile,
            sourceFiles: entries.map((entry) => entry.file),
            dedupedCount: deduped.length,
            removeFiles: removeFiles.map((filePath) => path.basename(filePath))
        });

        if (!shouldApply) {
            continue;
        }

        fs.writeFileSync(targetPath, JSON.stringify(deduped, null, 2));
        for (const filePath of removeFiles) {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
    }

    return operations;
}

function saveLog(log) {
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFile = path.join(logsDir, `data-normalize-${stamp}.json`);
    fs.writeFileSync(logFile, JSON.stringify(log, null, 2));
    return logFile;
}

function main() {
    const allOperations = [];

    for (const dirPath of targetDirs) {
        const operations = normalizeDir(dirPath);
        allOperations.push(...operations);
    }

    const summary = {
        mode: shouldApply ? 'apply' : 'dry-run',
        timestamp: new Date().toISOString(),
        operations: allOperations,
        totalOperations: allOperations.length
    };

    const logFile = saveLog(summary);

    console.log(`mode=${summary.mode}`);
    console.log(`total_operations=${summary.totalOperations}`);
    console.log(`log=${path.relative(rootDir, logFile)}`);

    if (!shouldApply) {
        console.log('No files were modified. Re-run with --apply to execute changes.');
    }
}

main();
