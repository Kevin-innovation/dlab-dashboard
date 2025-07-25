-- 최종 스키마 정리 및 최적화
-- 이 파일은 모든 이전 마이그레이션이 적용된 후 실행

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_students_teacher_id ON students(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_schedules_teacher_id ON schedules(teacher_id);
CREATE INDEX IF NOT EXISTS idx_schedules_class_id ON schedules(class_id);
CREATE INDEX IF NOT EXISTS idx_student_classes_student_id ON student_classes(student_id);
CREATE INDEX IF NOT EXISTS idx_student_classes_class_id ON student_classes(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_schedule_id ON attendance(schedule_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);

-- 데이터 정합성 검증
DO $$
DECLARE
    orphaned_students INTEGER;
    orphaned_classes INTEGER;
    orphaned_schedules INTEGER;
BEGIN
    -- 고아 레코드 확인
    SELECT COUNT(*) INTO orphaned_students 
    FROM students s 
    LEFT JOIN teachers t ON s.teacher_id = t.id 
    WHERE s.teacher_id IS NOT NULL AND t.id IS NULL;
    
    SELECT COUNT(*) INTO orphaned_classes 
    FROM classes c 
    LEFT JOIN teachers t ON c.teacher_id = t.id 
    WHERE c.teacher_id IS NOT NULL AND t.id IS NULL;
    
    SELECT COUNT(*) INTO orphaned_schedules 
    FROM schedules s 
    LEFT JOIN teachers t ON s.teacher_id = t.id 
    WHERE s.teacher_id IS NOT NULL AND t.id IS NULL;
    
    -- 고아 레코드가 있으면 경고
    IF orphaned_students > 0 THEN
        RAISE WARNING '경고: teacher_id가 유효하지 않은 학생 레코드 %개 발견', orphaned_students;
    END IF;
    
    IF orphaned_classes > 0 THEN
        RAISE WARNING '경고: teacher_id가 유효하지 않은 수업 레코드 %개 발견', orphaned_classes;
    END IF;
    
    IF orphaned_schedules > 0 THEN
        RAISE WARNING '경고: teacher_id가 유효하지 않은 스케줄 레코드 %개 발견', orphaned_schedules;
    END IF;
    
    RAISE NOTICE '스키마 정리 완료. 인덱스 생성됨.';
END $$;

-- 최종 테이블 구조 확인용 뷰 생성 (개발용)
CREATE OR REPLACE VIEW schema_summary AS
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('teachers', 'students', 'classes', 'schedules', 'student_classes', 'attendance', 'feedback', 'statistics')
ORDER BY table_name, ordinal_position;