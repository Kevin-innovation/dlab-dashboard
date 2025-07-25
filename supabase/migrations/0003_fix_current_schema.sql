-- 현재 코드에 맞게 데이터베이스 스키마 수정
-- 깃 풀 후 코드와 DB 동기화를 위한 마이그레이션

-- students 테이블에 현재 코드에서 사용하는 컬럼들 추가
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_name TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_phone TEXT;

-- parent_contact 컬럼의 데이터를 parent_phone으로 복사 (데이터가 있다면)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'students' AND column_name = 'parent_contact') THEN
        UPDATE students 
        SET parent_phone = parent_contact 
        WHERE parent_phone IS NULL AND parent_contact IS NOT NULL;
        
        UPDATE students 
        SET parent_name = SPLIT_PART(parent_contact, ' ', 1) 
        WHERE parent_name IS NULL AND parent_contact IS NOT NULL;
    END IF;
END $$;

-- classes 테이블의 duration을 INTERVAL에서 TEXT로 변경 (코드에서 TEXT 사용)
ALTER TABLE classes ALTER COLUMN duration TYPE TEXT USING duration::TEXT;

-- 현재 코드에서 사용하지 않는 컬럼 제거 (선택사항 - 주석 해제하여 사용)
-- ALTER TABLE students DROP COLUMN IF EXISTS parent_contact;

-- 데이터 정합성 확인을 위한 제약 조건 추가
ALTER TABLE students ALTER COLUMN parent_name SET NOT NULL;
ALTER TABLE students ALTER COLUMN parent_phone SET NOT NULL;