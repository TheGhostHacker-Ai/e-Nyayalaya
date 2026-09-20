-- 1. Create Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL,
    department TEXT
);

-- 2. Create Cases Table
CREATE TABLE cases (
    id SERIAL PRIMARY KEY,
    case_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Documents Table
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_hash TEXT NOT NULL,
    metadata JSONB,
    uploaded_by INTEGER REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Audit Logs Table (Mock Ledger)
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    previous_hash TEXT NOT NULL,
    new_hash TEXT NOT NULL
);

-- Insert a default mock user for testing
INSERT INTO users (username, role, department) VALUES ('officer_1', 'Investigator', 'NCRB');
