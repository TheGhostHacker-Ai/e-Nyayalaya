const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const supabase = require('./supabaseClient');
const ai = require('./ai');
const { hashFile } = require('./hashing');
const ledger = require('./ledger');
const caseRecordPdfRouter = require('./routes/caseRecordPdf');
const app = express();
app.use(cors());
app.use(express.json());

// Set up multer for file handling (save to disk)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)) // Append extension
    }
});
const upload = multer({ storage: storage });

const PORT = process.env.PORT || 3000;

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Secure DMS API is running' });
});

// Get all cases
app.get('/api/cases', async (req, res) => {
    const { data, error } = await supabase
        .from('cases')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        return res.status(500).json({ error: error.message });
    }
    res.json({ data });
});

// Create a new case
app.post('/api/cases', async (req, res) => {
    const { case_number, title } = req.body;
    
    const { data, error } = await supabase
        .from('cases')
        .insert([{ case_number, title, status: 'OPEN' }])
        .select();

    if (error) {
        return res.status(400).json({ error: error.message });
    }
    res.status(201).json(data[0]);
});

// Get documents for a case
app.get('/api/cases/:caseId/documents', async (req, res) => {
    const caseId = req.params.caseId;
    
    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('case_id', caseId)
        .order('uploaded_at', { ascending: false });

    if (error) {
        return res.status(500).json({ error: error.message });
    }
    res.json({ data });
});

app.use(caseRecordPdfRouter);

// --- AI Endpoints ---

// 1. Process Document Upload (OCR, Classification, Metadata, Compliance, Store// --- AI Proxy Endpoint ---
app.post('/api/documents/process', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No document uploaded' });
        }

        const filePath = req.file.path;
        
        // Step 1: Document OCR & Extraction
        const extractedText = await ai.extractDocumentText(filePath);
        
        // Step 2: Auto-Classification
        const classification = await ai.classifyDocument(extractedText);
        
        // Step 3: Entity Extraction
        const metadata = await ai.extractEntities(extractedText, classification.document_type);
        
        // Step 4: Compliance Check
        const compliance = await ai.checkCompliance(classification.document_type, extractedText);

        res.json({
            message: "AI Processing complete",
            extractedText: extractedText,
            classification: classification,
            metadata: metadata,
            compliance: compliance
        });
    } catch (error) {
        console.error('AI Processing Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/search/parse', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) return res.status(400).json({ error: 'Missing query string' });
        
        const intent = await ai.parseSearchQuery(query);
        res.json(intent);
    } catch (error) {
        console.error('Search Parsing Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`AI Proxy Server is running on http://localhost:${PORT}`);
});
