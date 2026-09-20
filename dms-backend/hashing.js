const crypto = require('crypto');
const fs = require('fs');

function hashFile(filePath) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);
        
        stream.on('error', err => reject(err));
        stream.on('data', chunk => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
    });
}

function hashData(dataString) {
    return crypto.createHash('sha256').update(dataString).digest('hex');
}

module.exports = {
    hashFile,
    hashData
};
