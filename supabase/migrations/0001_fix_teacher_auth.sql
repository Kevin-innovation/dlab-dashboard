-- Fix teacher authentication policy to use email-based lookup
-- Drop the existing policy
DROP POLICY IF EXISTS "Teachers can view their own data" ON teachers;

-- Create new policy that allows teachers to view their data by email
CREATE POLICY "Teachers can view their own data"
    ON teachers FOR SELECT
    USING (auth.jwt() ->> 'email' = email);

-- Update other policies that depend on teacher ID comparison
DROP POLICY IF EXISTS "Teachers can view all students" ON students;
CREATE POLICY "Teachers can view all students"
    ON students FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM teachers
        WHERE auth.jwt() ->> 'email' = teachers.email
    ));

-- Allow full CRUD operations for teachers on students
DROP POLICY IF EXISTS "Teachers can insert students" ON students;
CREATE POLICY "Teachers can insert students"
    ON students FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM teachers
        WHERE auth.jwt() ->> 'email' = teachers.email
    ));

DROP POLICY IF EXISTS "Teachers can update students" ON students;
CREATE POLICY "Teachers can update students"
    ON students FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM teachers
        WHERE auth.jwt() ->> 'email' = teachers.email
    ));

DROP POLICY IF EXISTS "Teachers can delete students" ON students;
CREATE POLICY "Teachers can delete students"
    ON students FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM teachers
        WHERE auth.jwt() ->> 'email' = teachers.email
    ));

-- Similar policies for other tables
DROP POLICY IF EXISTS "Teachers can manage classes" ON classes;
CREATE POLICY "Teachers can manage classes"
    ON classes FOR ALL
    USING (EXISTS (
        SELECT 1 FROM teachers
        WHERE auth.jwt() ->> 'email' = teachers.email
    ));

DROP POLICY IF EXISTS "Teachers can manage schedules" ON schedules;
CREATE POLICY "Teachers can manage schedules"
    ON schedules FOR ALL
    USING (EXISTS (
        SELECT 1 FROM teachers
        WHERE auth.jwt() ->> 'email' = teachers.email
    ));

DROP POLICY IF EXISTS "Teachers can manage student_classes" ON student_classes;
CREATE POLICY "Teachers can manage student_classes"
    ON student_classes FOR ALL
    USING (EXISTS (
        SELECT 1 FROM teachers
        WHERE auth.jwt() ->> 'email' = teachers.email
    ));

-- payments table doesn't exist yet, skip this policy

DROP POLICY IF EXISTS "Teachers can manage attendance" ON attendance;
CREATE POLICY "Teachers can manage attendance"
    ON attendance FOR ALL
    USING (EXISTS (
        SELECT 1 FROM teachers
        WHERE auth.jwt() ->> 'email' = teachers.email
    ));

DROP POLICY IF EXISTS "Teachers can manage statistics" ON statistics;
CREATE POLICY "Teachers can manage statistics"
    ON statistics FOR ALL
    USING (EXISTS (
        SELECT 1 FROM teachers
        WHERE auth.jwt() ->> 'email' = teachers.email
    ));