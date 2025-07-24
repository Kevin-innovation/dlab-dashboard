-- Fix signup permissions for teachers table
-- Allow anyone to insert into teachers table during signup (but only with valid auth user)

-- First, add missing teacher_id column to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE;

-- Add missing teacher_id column to classes table if not exists
ALTER TABLE classes ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE;

-- Allow authenticated users to insert their own teacher record
DROP POLICY IF EXISTS "Allow teacher signup" ON teachers;
CREATE POLICY "Allow teacher signup"
    ON teachers FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Update the teachers policy to allow users to read their own data by ID as well
DROP POLICY IF EXISTS "Teachers can view their own data" ON teachers;
CREATE POLICY "Teachers can view their own data"
    ON teachers FOR SELECT
    USING (auth.uid() = id OR auth.jwt() ->> 'email' = email);

-- Allow teachers to update their own records
DROP POLICY IF EXISTS "Teachers can update their own data" ON teachers;
CREATE POLICY "Teachers can update their own data"
    ON teachers FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Update student policies to work with both ID and email-based auth
DROP POLICY IF EXISTS "Teachers can view all students" ON students;
CREATE POLICY "Teachers can view all students"
    ON students FOR SELECT
    USING (
        teacher_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM teachers
            WHERE auth.jwt() ->> 'email' = teachers.email
        )
    );

DROP POLICY IF EXISTS "Teachers can insert students" ON students;
CREATE POLICY "Teachers can insert students"
    ON students FOR INSERT
    WITH CHECK (
        teacher_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM teachers
            WHERE auth.jwt() ->> 'email' = teachers.email
        )
    );

DROP POLICY IF EXISTS "Teachers can update students" ON students;
CREATE POLICY "Teachers can update students"
    ON students FOR UPDATE
    USING (
        teacher_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM teachers
            WHERE auth.jwt() ->> 'email' = teachers.email
        )
    );

DROP POLICY IF EXISTS "Teachers can delete students" ON students;
CREATE POLICY "Teachers can delete students"
    ON students FOR DELETE
    USING (
        teacher_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM teachers
            WHERE auth.jwt() ->> 'email' = teachers.email
        )
    );

-- Update classes policies
DROP POLICY IF EXISTS "Teachers can manage classes" ON classes;
CREATE POLICY "Teachers can manage classes"
    ON classes FOR ALL
    USING (
        teacher_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM teachers
            WHERE auth.jwt() ->> 'email' = teachers.email
        )
    );

-- Update schedules policies
DROP POLICY IF EXISTS "Teachers can manage schedules" ON schedules;
CREATE POLICY "Teachers can manage schedules"
    ON schedules FOR ALL
    USING (
        teacher_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM teachers
            WHERE auth.jwt() ->> 'email' = teachers.email
        )
    );

-- Update student_classes policies
DROP POLICY IF EXISTS "Teachers can manage student_classes" ON student_classes;
CREATE POLICY "Teachers can manage student_classes"
    ON student_classes FOR ALL
    USING (EXISTS (
        SELECT 1 FROM students 
        WHERE students.id = student_classes.student_id 
        AND (
            students.teacher_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM teachers
                WHERE auth.jwt() ->> 'email' = teachers.email
            )
        )
    ));

-- Update attendance policies
DROP POLICY IF EXISTS "Teachers can manage attendance" ON attendance;
CREATE POLICY "Teachers can manage attendance"
    ON attendance FOR ALL
    USING (EXISTS (
        SELECT 1 FROM schedules 
        WHERE schedules.id = attendance.schedule_id 
        AND (
            schedules.teacher_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM teachers
                WHERE auth.jwt() ->> 'email' = teachers.email
            )
        )
    ));

-- Update statistics policies  
DROP POLICY IF EXISTS "Teachers can manage statistics" ON statistics;
CREATE POLICY "Teachers can manage statistics"
    ON statistics FOR ALL
    USING (EXISTS (
        SELECT 1 FROM teachers
        WHERE auth.jwt() ->> 'email' = teachers.email
    ));