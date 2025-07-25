# 마이그레이션 재구성 계획

## 현재 문제점
1. **중복된 마이그레이션 파일들**: 0002 버전이 3개 존재
2. **스키마 불일치**: parent_contact vs parent_name/parent_phone
3. **데이터 타입 충돌**: classes.duration이 INTERVAL vs TEXT
4. **외래키 누락**: teacher_id 컬럼들

## 삭제할 파일들
- [x] `0001_fix_teacher_auth.sql` - 중복/불필요한 정책 변경
- [x] `0002_fix_signup_permissions.sql` - 구 버전
- [x] `0002_fix_signup_permissions_v2.sql` - 구 버전

## 유지할 파일들
- [x] `0000_initial_schema.sql` - 기본 테이블 구조
- [x] `0002_fix_signup_permissions_v3.sql` - 최신 권한 정책
- [x] `0003_fix_current_schema.sql` - 현재 코드와 DB 동기화

## 새로 생성할 파일
- [ ] `0004_clean_final_schema.sql` - 최종 정리 및 인덱스

## 최종 스키마 구조
### Teachers 테이블
- id (UUID, PK)
- email (TEXT, UNIQUE)
- name (TEXT)
- created_at, updated_at

### Students 테이블  
- id (UUID, PK)
- name (TEXT)
- parent_name (TEXT) ← parent_contact에서 변경
- parent_phone (TEXT) ← 새로 추가
- grade (TEXT)
- notes (TEXT)
- teacher_id (UUID, FK) ← 추가
- created_at, updated_at

### Classes 테이블
- id (UUID, PK)
- name (TEXT)
- type ('1:1' | 'group')
- subject (TEXT)
- duration (TEXT) ← INTERVAL에서 변경
- teacher_id (UUID, FK) ← 추가
- created_at, updated_at

## 실행 순서
1. 불필요한 마이그레이션 파일 삭제
2. 0004_clean_final_schema.sql 생성
3. 실제 Supabase에 적용 시 순서대로 실행