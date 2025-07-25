-- Add student attendance progress tracking table
CREATE TABLE student_attendance_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  current_week INTEGER DEFAULT 0 NOT NULL CHECK (current_week >= 0),
  total_weeks INTEGER NOT NULL CHECK (total_weeks > 0),
  course_type VARCHAR(20) DEFAULT '1month' CHECK (course_type IN ('1month', '3month')),
  last_attendance_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(student_id) -- 학생당 하나의 진행상황만 허용
);

-- Add course_type to students table for easier management
ALTER TABLE students ADD COLUMN IF NOT EXISTS course_type VARCHAR(20) DEFAULT '1month' 
CHECK (course_type IN ('1month', '3month'));

-- RLS 정책
ALTER TABLE student_attendance_progress ENABLE ROW LEVEL SECURITY;

-- Policy: Teachers can only access their own students' attendance progress
CREATE POLICY "Teachers can manage their students attendance progress" 
ON student_attendance_progress
FOR ALL USING (auth.uid() = teacher_id);

-- 인덱스 추가
CREATE INDEX idx_student_attendance_progress_student_id ON student_attendance_progress(student_id);
CREATE INDEX idx_student_attendance_progress_teacher_id ON student_attendance_progress(teacher_id);
CREATE INDEX idx_student_attendance_progress_course_type ON student_attendance_progress(course_type);

-- 업데이트 트리거 추가
CREATE TRIGGER update_student_attendance_progress_updated_at 
  BEFORE UPDATE ON student_attendance_progress 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 초기 데이터: 기존 학생들을 위한 출석 진행률 생성
INSERT INTO student_attendance_progress (student_id, teacher_id, current_week, total_weeks, course_type)
SELECT 
  s.id as student_id,
  s.teacher_id,
  0 as current_week,
  CASE 
    WHEN s.course_type = '3month' THEN 11
    ELSE 4
  END as total_weeks,
  COALESCE(s.course_type, '1month') as course_type
FROM students s
WHERE NOT EXISTS (
  SELECT 1 FROM student_attendance_progress sap 
  WHERE sap.student_id = s.id
);

-- 새 학생 추가 시 자동으로 출석 진행률 생성하는 함수
CREATE OR REPLACE FUNCTION create_attendance_progress_for_new_student()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO student_attendance_progress (
    student_id, 
    teacher_id, 
    current_week, 
    total_weeks, 
    course_type
  ) VALUES (
    NEW.id,
    NEW.teacher_id,
    0,
    CASE 
      WHEN NEW.course_type = '3month' THEN 11
      ELSE 4
    END,
    COALESCE(NEW.course_type, '1month')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 학생 생성 시 자동으로 출석 진행률 생성하는 트리거
CREATE TRIGGER trigger_create_attendance_progress_for_new_student
  AFTER INSERT ON students
  FOR EACH ROW
  EXECUTE FUNCTION create_attendance_progress_for_new_student();

-- 학생의 course_type 변경 시 출석 진행률 업데이트하는 함수
CREATE OR REPLACE FUNCTION update_attendance_progress_on_course_type_change()
RETURNS TRIGGER AS $$
BEGIN
  -- course_type이 변경된 경우에만 실행
  IF OLD.course_type IS DISTINCT FROM NEW.course_type THEN
    UPDATE student_attendance_progress 
    SET 
      total_weeks = CASE 
        WHEN NEW.course_type = '3month' THEN 11
        ELSE 4
      END,
      course_type = COALESCE(NEW.course_type, '1month'),
      current_week = LEAST(current_week, CASE 
        WHEN NEW.course_type = '3month' THEN 11
        ELSE 4
      END), -- 현재 주차가 새로운 총 주차를 초과하지 않도록 조정
      updated_at = timezone('utc'::text, now())
    WHERE student_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 학생 course_type 변경 시 출석 진행률 업데이트하는 트리거
CREATE TRIGGER trigger_update_attendance_progress_on_course_type_change
  AFTER UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_attendance_progress_on_course_type_change();