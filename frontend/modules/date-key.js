const SHANGHAI_TIME_ZONE = 'Asia/Shanghai';

function getShanghaiDateKey(now = new Date()) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: SHANGHAI_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(now);
    const dateParts = Object.fromEntries(parts.map((part) => [part.type, part.value]));

    return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
}

export {
    getShanghaiDateKey
};
