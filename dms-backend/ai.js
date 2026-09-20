const { GoogleGenAI, Type, Schema } = require('@google/genai');
require('dotenv').config();

// Note: Ensure process.env.GEMINI_API_KEY is set
const ai = new GoogleGenAI({});

async function extractTextFromImage(base64Image, mimeType) {
    const prompt = `
You are a document digitization engine for a law-enforcement records system.
Extract ALL visible text from the provided document image exactly as written,
preserving line breaks and structure. Include handwritten text where legible,
marking uncertain words with [unclear: best-guess]. Do not summarize,
paraphrase, or omit any content. Output plain text only.

Extract the full text content of this document.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            {
                inlineData: {
                    data: base64Image,
                    mimeType: mimeType
                }
            },
            prompt
        ],
        config: {
            temperature: 0.1,
        }
    });

    return response.text;
}

async function classifyDocument(extractedText) {
    const prompt = `
You classify legal and law-enforcement documents for a case management system.
Given the extracted text of a document, classify it into exactly ONE of these
categories: FIR, Charge Sheet, Witness Statement, Forensic Report, Court Filing,
Evidence Record, Legal Notice, Judgment, Other.

Classify this document:
---
${extractedText}
---`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: 0.1,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    document_type: {
                        type: Type.STRING,
                        description: "one of the categories: FIR, Charge Sheet, Witness Statement, Forensic Report, Court Filing, Evidence Record, Legal Notice, Judgment, Other"
                    },
                    confidence: {
                        type: Type.NUMBER,
                        description: "number between 0 and 1"
                    },
                    reasoning: {
                        type: Type.STRING,
                        description: "one short sentence"
                    }
                },
                required: ["document_type", "confidence", "reasoning"]
            }
        }
    });

    return JSON.parse(response.text);
}

async function extractMetadata(extractedText) {
    const prompt = `
You extract structured metadata from Indian law-enforcement and legal documents.
Given the document text, extract the following fields if present. Use null for
any field not found — never guess or fabricate a value.

Extract metadata from this document:
---
${extractedText}
---`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: 0.1,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    case_number: { type: Type.STRING, nullable: true },
                    document_date: { type: Type.STRING, description: "YYYY-MM-DD", nullable: true },
                    filing_officer_or_authority: { type: Type.STRING, nullable: true },
                    involved_parties: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    },
                    sections_of_law_cited: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    },
                    police_station_or_court: { type: Type.STRING, nullable: true },
                    case_status_mentioned: { type: Type.STRING, nullable: true }
                }
            }
        }
    });

    return JSON.parse(response.text);
}

async function checkCompliance(documentType, extractedText) {
    const prompt = `
You are a compliance checker for legal document filing. Given a document's type
and its extracted text, determine whether all mandatory fields for that document
type are present. Mandatory fields by type:
- FIR: complainant name, date, police station, officer signature/ID, offense description
- Charge Sheet: case number, accused name(s), sections of law, investigating officer signature
- Witness Statement: witness name, date, signature/thumb impression, recording officer
- Forensic Report: examiner name/ID, lab reference number, date, findings summary
- Court Filing: case number, court name, filing date, advocate/prosecutor name

Document type: ${documentType}
Document text:
---
${extractedText}
---
Check compliance.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: 0.1,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    is_compliant: { type: Type.BOOLEAN },
                    missing_fields: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "array of missing mandatory field names, empty if none"
                    },
                    notes: { type: Type.STRING, description: "one short sentence explaining any issue found" }
                },
                required: ["is_compliant", "missing_fields", "notes"]
            }
        }
    });

    return JSON.parse(response.text);
}

async function parseSearchQuery(userQuery) {
    const prompt = `
You convert natural-language investigative search queries into structured search
parameters for a legal document database. Extract intent, entities, and filters.

Query: "${userQuery}"`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: 0.1,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    search_keywords: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    },
                    entity_names: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    },
                    document_type_filter: {
                        type: Type.STRING,
                        description: "FIR, Charge Sheet, Witness Statement, Forensic Report, Court Filing, Evidence Record, Legal Notice, Judgment",
                        nullable: true
                    },
                    date_range_hint: { type: Type.STRING, nullable: true }
                }
            }
        }
    });

    return JSON.parse(response.text);
}

module.exports = {
    extractTextFromImage,
    classifyDocument,
    extractMetadata,
    checkCompliance,
    parseSearchQuery
};
