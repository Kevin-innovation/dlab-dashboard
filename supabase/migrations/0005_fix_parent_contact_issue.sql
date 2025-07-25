-- parent_contact 컬럼 이슈 해결
-- 기존 parent_contact 컬럼의 NOT NULL 제약조건 제거 또는 컬럼 삭제

-- 방법 1: parent_contact 컬럼을 NULL 허용으로 변경
ALTER TABLE students ALTER COLUMN parent_contact DROP NOT NULL;

-- 방법 2: parent_contact 컬럼 완전 제거 (선택사항)
-- ALTER TABLE students DROP COLUMN IF EXISTS parent_contact;

-- parent_name과 parent_phone이 NULL이어도 parent_contact가 있다면 데이터 복사
UPDATE students 
SET parent_name = COALESCE(parent_name, SPLIT_PART(parent_contact, ' ', 1))
WHERE parent_name IS NULL AND parent_contact IS NOT NULL;

UPDATE students 
SET parent_phone = COALESCE(parent_phone, parent_contact)
WHERE parent_phone IS NULL AND parent_contact IS NOT NULL;

-- 새로운 컬럼들에 대한 NOT NULL 제약조건 추가 (필요시)
-- ALTER TABLE students ALTER COLUMN parent_name SET NOT NULL;
-- ALTER TABLE students ALTER COLUMN parent_phone SET NOT NULL;