-- Supabase Database Schema for Teacher System

-- Enable UUID extension (usually enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: profiles
-- Extending the default auth.users
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADVISER', 'SUBJECT_TEACHER', 'ADMIN')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table: school_years
CREATE TABLE school_years (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- e.g., '2025-2026'
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table: sections
CREATE TABLE sections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    grade_level TEXT NOT NULL, -- e.g., 'Grade 8'
    name TEXT NOT NULL, -- e.g., 'ARIES'
    adviser_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    school_year_id UUID REFERENCES school_years(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(name, school_year_id)
);

-- Table: subjects
CREATE TABLE subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL, -- e.g., 'Filipino', 'English'
    weight_ww NUMERIC NOT NULL DEFAULT 20.0, -- Written Works %
    weight_pt NUMERIC NOT NULL DEFAULT 60.0, -- Performance Tasks %
    weight_qa NUMERIC NOT NULL DEFAULT 20.0, -- Quarterly Assessment %
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table: section_subjects (Assigns Subject Teachers to Sections)
CREATE TABLE section_subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(section_id, subject_id)
);

-- Table: students (Masterlist derived from Form 138)
CREATE TABLE students (
    lrn TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    middle_name TEXT,
    sex TEXT NOT NULL CHECK (sex IN ('MALE', 'FEMALE')),
    birthdate DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table: enrollments
CREATE TABLE enrollments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_lrn TEXT REFERENCES students(lrn) ON DELETE CASCADE,
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'ENROLLED' CHECK (status IN ('ENROLLED', 'DROPPED', 'TRANSFERRED_OUT', 'PROMOTED', 'RETAINED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(student_lrn, section_id)
);

-- Table: attendance (SF2)
CREATE TABLE attendance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'LATE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(enrollment_id, date)
);

-- Table: grades (ECR / Subject Grades)
CREATE TABLE grades (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
    section_subject_id UUID REFERENCES section_subjects(id) ON DELETE CASCADE,
    quarter INTEGER NOT NULL CHECK (quarter IN (1, 2, 3, 4)),
    ww_hps NUMERIC DEFAULT 0, -- Highest Possible Score given the teacher's input
    ww_total NUMERIC DEFAULT 0, -- Student's total score
    pt_hps NUMERIC DEFAULT 0,
    pt_total NUMERIC DEFAULT 0,
    qa_hps NUMERIC DEFAULT 0,
    qa_total NUMERIC DEFAULT 0,
    initial_grade NUMERIC, -- Auto-computed before transmution
    quarterly_grade NUMERIC, -- Transmuted grade (DepEd scale)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(enrollment_id, section_subject_id, quarter)
);

-- RLS (Row Level Security) - Basic Setup Setup
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view data (Simplifying for v1 prototype)
CREATE POLICY "Enable read access for authenticated users" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON school_years FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON sections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON section_subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON enrollments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON grades FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert/update based on their role (simplified here)
CREATE POLICY "Enable ALL for authenticated users" ON profiles FOR ALL TO authenticated USING (auth.uid() = id);
CREATE POLICY "Enable ALL for authenticated users" ON students FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable ALL for authenticated users" ON enrollments FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable ALL for authenticated users" ON attendance FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable ALL for authenticated users" ON grades FOR ALL TO authenticated USING (true);
