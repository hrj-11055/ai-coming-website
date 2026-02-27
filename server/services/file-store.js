const fs = require('fs');

function createJsonFileStore() {
    function readJson(filePath, fallbackValue = []) {
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`读取文件 ${filePath} 失败:`, error);
            return fallbackValue;
        }
    }

    function writeJson(filePath, data) {
        try {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error(`写入文件 ${filePath} 失败:`, error);
            return false;
        }
    }

    return {
        readJson,
        writeJson
    };
}

module.exports = {
    createJsonFileStore
};
