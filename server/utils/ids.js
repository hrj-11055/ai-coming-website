/**
 * Keep legacy ID generation behavior unchanged.
 */
function generateId(type = 'daily') {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');

    const typeCode = type === 'weekly' ? 'W' : '';
    const sequence = Math.floor(Math.random() * 9999) + 1;
    const sequenceStr = sequence.toString().padStart(4, '0');

    return year + month + day + typeCode + sequenceStr;
}

module.exports = {
    generateId
};
