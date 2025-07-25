# 학생 출석 게이지 시스템 구현

## 📋 태스크 개요
학생 목록에 시각적 출석 게이지를 추가하여 각 학생의 출석 현황을 직관적으로 파악할 수 있는 시스템 구현

## 🎯 요구사항

### 1. UI/UX 요구사항
- **게이지 위치**: 학생 이름 아래 표시
- **게이지 너비**: 해당 테이블 셀 너비만큼 가득 채움
- **시각적 표현**: 진행률 바 형태로 출석 현황 표시
- **피드백 라인**: 피드백 시기 알림 라인 표시
  - 1개월(4주) 기준: 3주차에 피드백 라인
  - 3개월(11주) 기준: 10주차에 피드백 라인

### 2. 기능 요구사항
- **출석 버튼**: 게이지를 1주씩 증가
- **되돌리기 버튼**: 게이지를 1주씩 감소
- **초기화 버튼**: 게이지를 0으로 리셋
- **수업 일정 연동**: 수업 일정의 "출석 처리" 버튼과 연동

### 3. 데이터 요구사항
- **출석 주차 저장**: 각 학생별 현재 출석 주차
- **수업 기간 타입**: 1개월(4주) vs 3개월(11주)
- **실시간 업데이트**: 출석 처리 시 즉시 게이지 반영

## 🗄️ 데이터베이스 설계

### 새 테이블: student_attendance_progress
```sql
CREATE TABLE student_attendance_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  current_week INTEGER DEFAULT 0 NOT NULL,
  total_weeks INTEGER NOT NULL, -- 4 또는 11
  course_type VARCHAR(20) DEFAULT '1month' CHECK (course_type IN ('1month', '3month')),
  last_attendance_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(student_id) -- 학생당 하나의 진행상황만 허용
);

-- RLS 정책
ALTER TABLE student_attendance_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage their students attendance progress" 
ON student_attendance_progress
FOR ALL USING (auth.uid() = teacher_id);

-- 인덱스
CREATE INDEX idx_student_attendance_progress_student_id ON student_attendance_progress(student_id);
CREATE INDEX idx_student_attendance_progress_teacher_id ON student_attendance_progress(teacher_id);
```

### 기존 테이블 수정
```sql
-- students 테이블에 수업 기간 타입 추가 (옵션)
ALTER TABLE students ADD COLUMN IF NOT EXISTS course_type VARCHAR(20) DEFAULT '1month' 
CHECK (course_type IN ('1month', '3month'));
```

## 🛠️ 구현 계획

### Phase 1: 데이터베이스 및 서비스 레이어
- [ ] 1.1 마이그레이션 파일 생성
- [ ] 1.2 AttendanceProgressService 생성
- [ ] 1.3 타입 정의 추가 (types/attendance.ts)

### Phase 2: UI 컴포넌트 개발
- [ ] 2.1 AttendanceGauge 컴포넌트 생성
- [ ] 2.2 진행률 바 스타일링 (Tailwind CSS)
- [ ] 2.3 피드백 라인 표시 로직
- [ ] 2.4 출석/되돌리기/초기화 버튼 UI

### Phase 3: 학생 목록 통합
- [ ] 3.1 학생 목록 페이지에 게이지 컴포넌트 추가
- [ ] 3.2 학생별 출석 데이터 로딩
- [ ] 3.3 게이지 인터랙션 핸들러 구현

### Phase 4: 수업 일정 연동
- [ ] 4.1 수업 일정의 "출석 처리" 버튼 로직 수정
- [ ] 4.2 출석 처리 시 게이지 업데이트
- [ ] 4.3 실시간 데이터 동기화

### Phase 5: 테스트 및 최적화
- [ ] 5.1 각 기능별 테스트
- [ ] 5.2 성능 최적화 (데이터 캐싱)
- [ ] 5.3 에러 핸들링 개선
- [ ] 5.4 사용자 피드백 반영

## 🎨 UI 설계

### 게이지 컴포넌트 구조
```
┌─────────────────────────────────────┐
│ 학생 이름                            │
│ ████████████░░░░░░░░░░░░ 8/11주      │ ← 진행률 바
│          ↑피드백 라인 (10주차)        │
│ [출석] [되돌리기] [초기화]           │
└─────────────────────────────────────┘
```

### 색상 체계
- **진행 완료**: `bg-green-500` (초록색)
- **미완료**: `bg-gray-200` (회색)
- **피드백 라인**: `border-l-2 border-orange-400` (주황색 세로선)
- **위험 구간**: `bg-red-500` (빨간색, 기한 임박 시)

## 📊 상태 관리

### 컴포넌트 상태
```typescript
interface AttendanceGaugeProps {
  studentId: string
  currentWeek: number
  totalWeeks: number
  courseType: '1month' | '3month'
  onUpdate: (newWeek: number) => void
}

interface AttendanceProgressState {
  loading: boolean
  error: string | null
  attendanceData: Map<string, AttendanceProgress>
}
```

## 🔄 데이터 흐름

1. **초기 로딩**: 학생 목록 로드 시 각 학생의 출석 진행률 조회
2. **출석 처리**: 수업 일정에서 출석 처리 → 진행률 업데이트 → 게이지 리렌더링
3. **수동 조작**: 게이지의 버튼 클릭 → 데이터베이스 업데이트 → UI 반영
4. **실시간 동기화**: 다른 페이지에서의 변경사항도 실시간 반영

## ⚠️ 주의사항

### 데이터 일관성
- 출석 진행률과 실제 attendance 테이블 데이터 간의 일관성 유지
- 동시 업데이트 시 Race Condition 방지

### 성능 고려사항
- 대량의 학생 데이터 처리 시 페이지네이션 고려
- 게이지 렌더링 최적화 (React.memo 사용)

### 사용자 경험
- 로딩 상태 표시
- 에러 상황에 대한 적절한 피드백
- 접근성 (키보드 네비게이션, 스크린 리더 지원)

## 📝 완료 기준

- [ ] 모든 학생의 출석 게이지가 정상 표시됨
- [ ] 출석/되돌리기/초기화 버튼이 정상 동작함
- [ ] 수업 일정의 출석 처리와 연동됨
- [ ] 피드백 라인이 정확한 시점에 표시됨
- [ ] 데이터베이스 트랜잭션이 안전하게 처리됨
- [ ] TypeScript 컴파일 오류 없음
- [ ] 반응형 디자인 대응
- [ ] 프로덕션 배포 성공

## 🚀 예상 소요 시간
- **Phase 1-2**: 2-3시간 (백엔드 + 기본 UI)
- **Phase 3-4**: 2-3시간 (통합 + 연동)
- **Phase 5**: 1-2시간 (테스트 + 최적화)
- **총 예상 시간**: 5-8시간

---

💡 **참고**: 이 태스크는 사용자 경험을 크게 향상시킬 핵심 기능입니다. 시각적 피드백을 통해 선생님들이 각 학생의 출석 현황을 한눈에 파악할 수 있게 됩니다.