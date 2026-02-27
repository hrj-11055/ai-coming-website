function parseIntParam(value, { defaultValue, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER } = {}) {
    const parsed = Number.parseInt(value, 10);

    if (Number.isNaN(parsed)) {
        return defaultValue;
    }

    if (parsed < min) {
        return min;
    }

    if (parsed > max) {
        return max;
    }

    return parsed;
}

function parseOptionalPositiveInt(value, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
    if (value === undefined || value === null || value === '') {
        return null;
    }

    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) {
        return null;
    }

    if (parsed < min) {
        return min;
    }

    if (parsed > max) {
        return max;
    }

    return parsed;
}

function normalizeEnumParam(value, allowedValues, defaultValue) {
    if (typeof value !== 'string') {
        return defaultValue;
    }

    return allowedValues.includes(value) ? value : defaultValue;
}

module.exports = {
    parseIntParam,
    parseOptionalPositiveInt,
    normalizeEnumParam
};
