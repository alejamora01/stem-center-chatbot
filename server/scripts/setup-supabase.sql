-- STEM Center Chatbot - Supabase Schema Setup
-- Run this in your Supabase SQL Editor

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- DOCUMENT EMBEDDINGS TABLE (for RAG)
-- ============================================
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    embedding vector(768),  -- nomic-embed-text dimension
    metadata JSONB DEFAULT '{}',
    source_file VARCHAR(500),
    source_type VARCHAR(50),  -- 'pdf', 'markdown', 'txt'
    chunk_index INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for vector similarity search
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
ON document_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Index for source file queries
CREATE INDEX IF NOT EXISTS document_chunks_source_idx
ON document_chunks (source_file);

-- ============================================
-- TUTOR DATA TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tutors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    subjects TEXT[] NOT NULL,
    bio TEXT,
    location VARCHAR(255) DEFAULT 'STEM Center',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TUTOR SCHEDULE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tutor_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    -- 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(255),
    is_recurring BOOLEAN DEFAULT true,
    effective_from DATE,
    effective_until DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Indexes for schedule queries
CREATE INDEX IF NOT EXISTS tutor_schedules_day_idx
ON tutor_schedules (day_of_week, start_time);

CREATE INDEX IF NOT EXISTS tutor_schedules_tutor_idx
ON tutor_schedules (tutor_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to search similar documents using vector similarity
CREATE OR REPLACE FUNCTION search_documents(
    query_embedding vector(768),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    metadata JSONB,
    source_file VARCHAR,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id,
        dc.content,
        dc.metadata,
        dc.source_file,
        1 - (dc.embedding <=> query_embedding) AS similarity
    FROM document_chunks dc
    WHERE dc.embedding IS NOT NULL
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Function to get tutor availability for a specific date
CREATE OR REPLACE FUNCTION get_tutor_availability(query_date DATE)
RETURNS TABLE (
    tutor_id UUID,
    tutor_name VARCHAR,
    subjects TEXT[],
    start_time TIME,
    end_time TIME,
    location VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
    query_day_of_week INTEGER;
BEGIN
    query_day_of_week := EXTRACT(DOW FROM query_date);

    RETURN QUERY
    SELECT
        t.id AS tutor_id,
        t.name AS tutor_name,
        t.subjects,
        ts.start_time,
        ts.end_time,
        COALESCE(ts.location, t.location) AS location
    FROM tutors t
    JOIN tutor_schedules ts ON t.id = ts.tutor_id
    WHERE t.is_active = true
    AND ts.day_of_week = query_day_of_week
    AND (ts.effective_from IS NULL OR ts.effective_from <= query_date)
    AND (ts.effective_until IS NULL OR ts.effective_until >= query_date)
    ORDER BY ts.start_time, t.name;
END;
$$;

-- Function to search tutors by subject
CREATE OR REPLACE FUNCTION search_tutors_by_subject(search_subject TEXT)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    subjects TEXT[],
    bio TEXT,
    location VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.name,
        t.subjects,
        t.bio,
        t.location
    FROM tutors t
    WHERE t.is_active = true
    AND EXISTS (
        SELECT 1 FROM unnest(t.subjects) AS s
        WHERE LOWER(s) LIKE '%' || LOWER(search_subject) || '%'
    )
    ORDER BY t.name;
END;
$$;

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert sample tutors
INSERT INTO tutors (name, email, subjects, bio, location) VALUES
    ('Alex Johnson', 'alex.johnson@gannon.edu', ARRAY['Calculus', 'Linear Algebra', 'Differential Equations'], 'Math major with 3 years tutoring experience', 'STEM Center Room 101'),
    ('Maria Garcia', 'maria.garcia@gannon.edu', ARRAY['Physics', 'Mechanics', 'Thermodynamics'], 'Physics PhD student specializing in mechanics', 'STEM Center Room 102'),
    ('James Chen', 'james.chen@gannon.edu', ARRAY['Chemistry', 'Organic Chemistry', 'Biochemistry'], 'Pre-med student with chemistry focus', 'STEM Center Room 103'),
    ('Sarah Williams', 'sarah.williams@gannon.edu', ARRAY['Programming', 'Python', 'Java', 'Data Structures'], 'Computer Science senior', 'STEM Center Computer Lab'),
    ('Michael Brown', 'michael.brown@gannon.edu', ARRAY['Statistics', 'Probability', 'R Programming'], 'Statistics graduate student', 'STEM Center Room 101')
ON CONFLICT DO NOTHING;

-- Insert sample schedules (Monday = 1, Tuesday = 2, etc.)
INSERT INTO tutor_schedules (tutor_id, day_of_week, start_time, end_time, location)
SELECT t.id, 1, '10:00', '12:00', NULL FROM tutors t WHERE t.name = 'Alex Johnson'
UNION ALL
SELECT t.id, 1, '14:00', '16:00', NULL FROM tutors t WHERE t.name = 'Alex Johnson'
UNION ALL
SELECT t.id, 2, '09:00', '11:00', NULL FROM tutors t WHERE t.name = 'Maria Garcia'
UNION ALL
SELECT t.id, 3, '13:00', '15:00', NULL FROM tutors t WHERE t.name = 'Maria Garcia'
UNION ALL
SELECT t.id, 2, '10:00', '12:00', NULL FROM tutors t WHERE t.name = 'James Chen'
UNION ALL
SELECT t.id, 4, '14:00', '17:00', NULL FROM tutors t WHERE t.name = 'James Chen'
UNION ALL
SELECT t.id, 1, '15:00', '18:00', 'Computer Lab' FROM tutors t WHERE t.name = 'Sarah Williams'
UNION ALL
SELECT t.id, 3, '15:00', '18:00', 'Computer Lab' FROM tutors t WHERE t.name = 'Sarah Williams'
UNION ALL
SELECT t.id, 5, '10:00', '12:00', 'Computer Lab' FROM tutors t WHERE t.name = 'Sarah Williams'
UNION ALL
SELECT t.id, 2, '11:00', '13:00', NULL FROM tutors t WHERE t.name = 'Michael Brown'
UNION ALL
SELECT t.id, 4, '11:00', '13:00', NULL FROM tutors t WHERE t.name = 'Michael Brown'
ON CONFLICT DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (Optional)
-- ============================================

-- Enable RLS
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_schedules ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access on document_chunks"
ON document_chunks FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access on tutors"
ON tutors FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access on tutor_schedules"
ON tutor_schedules FOR ALL
USING (true)
WITH CHECK (true);
