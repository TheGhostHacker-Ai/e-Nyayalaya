-- 1. Add email column to users table (if it doesn't exist)
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- 2. Create OTPs table for Python Auth Service
CREATE TABLE IF NOT EXISTS otps (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    otp TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Pre-populate some roles for testing
INSERT INTO users (username, email, role, department) 
VALUES 
('judge_smith', 'judge@court.gov', 'Court / Judge', 'High Court'),
('officer_dave', 'dave@police.gov', 'Police Officer', 'Precinct 9')
ON CONFLICT (username) DO NOTHING;
