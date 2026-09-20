const supabase = require('./supabaseClient');
const { hashData } = require('./hashing');

async function getLatestHash() {
    const { data, error } = await supabase
        .from('audit_logs')
        .select('new_hash')
        .order('id', { ascending: false })
        .limit(1);

    if (error) {
        console.error("Error fetching latest hash from ledger:", error);
        throw error;
    }

    return (data && data.length > 0) ? data[0].new_hash : 'GENESIS_HASH';
}

async function appendToLedger(documentId, action, userId, details = {}) {
    const previousHash = await getLatestHash();
    const timestamp = new Date().toISOString();
    
    // The data payload representing this transaction
    const transactionData = JSON.stringify({
        documentId, action, userId, timestamp, details, previousHash
    });
    
    // Hash the current transaction (forming the chain)
    const newHash = hashData(transactionData);

    const { data, error } = await supabase
        .from('audit_logs')
        .insert([{
            document_id: documentId,
            action: action,
            user_id: userId,
            timestamp: timestamp,
            previous_hash: previousHash,
            new_hash: newHash
        }])
        .select();

    if (error) {
        console.error("Error appending to ledger:", error);
        throw error;
    }

    return { id: data[0].id, newHash, previousHash };
}

module.exports = {
    appendToLedger
};
