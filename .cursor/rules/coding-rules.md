---
description: 코딩학원 학생 관리 시스템 개발을 위한 통합 가이드
globs: ["src/**/*"]
alwaysApply: true
---

# 바이브 코딩을 위한 Cursor Rules 가이드

## 1. 세심한 작업 지시 (Detailed Task Instructions)

### 기본 원칙
- **구체적인 파일 지정**: 어떤 파일을 수정할지 명확히 지시
- **메소드 명시**: 사용할 메소드나 함수를 구체적으로 제시
- **작업 방식 안내**: 어떤 방법으로 작업할지 단계별로 설명

### Cursor Rules 예시
```markdown
## Task Instructions
- Always specify the exact file path when requesting modifications
- Include the specific method or function to be used
- Provide step-by-step approach for complex tasks
- Avoid generic responses like "I don't know" - always provide a concrete plan
- When planning, break down tasks into executable steps before implementation
```

## 2. 효과적인 컨텍스트 제공 (Effective Context Provision)

### Rules 문서 관리
- **프로젝트 구조 문서화**: 디렉토리 구조와 각 파일의 역할 명시
- **코드 컨벤션 정의**: 일관된 코딩 스타일 유지
- **API 스키마 동기화**: 백엔드 API 변경사항 실시간 반영
- **DB 스키마 업데이트**: 데이터베이스 구조 변경시 즉시 동기화

### Cursor Rules 예시
```markdown
## Project Context
### Architecture
- Frontend: React + TypeScript + Tailwind CSS
- Backend: Node.js + Express (예정)
- Database: PostgreSQL (예정)

### File Structure
- /src/components: Reusable UI components
- /src/pages: Page-level components
- /src/services: API service functions
- /src/utils: Utility functions
- /src/types: TypeScript type definitions
- /src/hooks: Custom React hooks
- /src/contexts: React Context providers

### Code Conventions
- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Use meaningful variable and function names
- Write descriptive comments for complex logic
```

## 3. 버전별 호환성 관리

### Deprecated 메소드 방지
```markdown
## Framework-Specific Rules
### React/JavaScript
- Use functional components over class components
- Prefer hooks over lifecycle methods
- Use modern ES6+ syntax

### General
- Always check for deprecated methods before implementation
- Suggest modern alternatives when legacy code is detected
```

## 4. 주석 관리 중요성

### 주석 품질 유지
```markdown
## Comment Management
- Keep comments synchronized with code changes
- Remove outdated comments immediately
- Write descriptive comments for complex business logic
- Use JSDoc/DocString format for function documentation
- Update comments when refactoring code to maintain search quality
```

## 5. 프론트엔드 디자인 최적화

### ASCII 와이어프레이밍 활용
```markdown
## UI/UX Design Process
### ASCII Wireframing
When designing UI components, first create ASCII wireframe:

Example:
┌─────────────────────────┐
│  Header with Logo       │
├─────────────────────────┤
│  Navigation Menu        │
├─────────────────────────┤
│  Main Content Area      │
│  ┌─────┐ ┌─────┐       │
│  │Card1│ │Card2│       │
│  └─────┘ └─────┘       │
├─────────────────────────┤
│  Footer                 │
└─────────────────────────┘

- Start with ASCII wireframe before coding UI
- Confirm layout understanding before implementation
- Use wireframe as reference for responsive design
```

## 6. 학원 관리 시스템 특화 규칙

### 학생 관리 규칙
- 1:1 수업 = 2 카운트
- 그룹 수업 = 실제 학생 수 카운트
- 주간 통계는 일요일 기준
- 수업 시간 유연성: 1시간/1.5시간/2시간

### 수강료 관리 규칙
- 1:1 수업: 별도 요금
- 그룹 수업: 월별 요금
- 로보틱스 수업: 수/토 중 선택
- 로보틱스 미선택 시 10% 할인
- 결제 기간: 1개월/3개월(11주) 선택

### 출결 관리 규칙
- 결제일 기준 1개월 내 보강 완료 시 결석 취소
- 보강 수업은 기존 수업과 시간 중복 허용

### 피드백 시스템 규칙
- GPT API 연동
- 커스텀 포맷 입력 공간 제공
- 기존 포맷 템플릿 제공

### 상태 색상 시스템
```css
/* 수업 상태별 색상 */
.status-active    { color: #22c55e; }  /* 진행중 - 초록색 */
.status-planned   { color: #3b82f6; }  /* 예정 - 파란색 */
.status-completed { color: #6b7280; }  /* 완료 - 회색 */
.status-makeup    { color: #ef4444; }  /* 보강 - 빨간색 */
```

## 7. 코드 품질 관리

### 성능 최적화
- 컴포넌트 메모이제이션
- 불필요한 리렌더링 방지
- 이미지 최적화

### 접근성
- ARIA 레이블 사용
- 키보드 네비게이션 지원
- 충분한 색상 대비

### Error Handling
- Implement proper error boundaries
- Add meaningful error messages
- Include logging for debugging
- Handle edge cases explicitly

## 8. 개발 프로세스

### Code Review Process
- Always review AI-generated code before accepting
- Test functionality after each significant change
- Maintain code quality standards throughout development
- Don't blindly trust AI output - verify and understand

### Rules 업데이트 체크리스트
- [ ] API 스키마 변경 반영
- [ ] DB 스키마 업데이트
- [ ] 새로운 컨벤션 추가
- [ ] Deprecated 메소드 목록 업데이트
- [ ] 프로젝트 구조 변경사항 반영

## 11. Supabase 데이터베이스 관리

### 스키마 관리
```markdown
## Database Schema Management
- 모든 스키마 변경은 Supabase Migration으로 관리
- 각 테이블에 대한 타입 정의 자동 생성 (supabase-js)
- RLS(Row Level Security) 정책 필수 적용
- 외래 키 제약 조건 명시적 정의

### 테이블 구조
- teachers: 선생님 계정 정보
- students: 학생 정보
- classes: 수업 정보 (1:1, 그룹 구분)
- schedules: 수업 일정
- attendance: 출결 관리
- payments: 수강료 관리
- feedback: 수업 피드백
- statistics: 통계 데이터

### 백업 및 동기화
- 개발/스테이징/프로덕션 환경 분리
- 스키마 변경 시 즉시 마이그레이션 적용
- 타입 동기화 자동화 설정
```

## 12. Vercel 배포 관리

### 배포 환경 설정
```markdown
## Deployment Configuration
- 환경 변수 관리 (.env.local, Vercel 환경변수)
- 브랜치별 배포 환경 구성 (main → production, develop → staging)
- 빌드 캐시 최적화
- Edge Functions 활용 (필요한 경우)

### 성능 모니터링
- Vercel Analytics 설정
- Web Vitals 모니터링
- API 응답 시간 추적
- 에러 로깅 설정

### CI/CD 파이프라인
- PR 시 자동 미리보기 배포
- 테스트 자동화
- 린트 검사 자동화
- 타입 체크 자동화
```

## 13. 작업 동기화 및 문서화 규칙

### 작업 전 체크리스트
```markdown
## Pre-Task Checklist
1. rules 파일 최신 상태 확인
2. tasks 진행 상황 확인
3. 관련 이전 작업 완료 여부 검토
4. 필요한 의존성 패키지 확인
```

### 작업 중 체크리스트
```markdown
## During-Task Checklist
1. 코딩 컨벤션 준수 여부 확인
2. 타입 정의 완성도 체크
3. 커밋 메시지 규칙 준수
4. 테스트 코드 작성 여부
```

### 작업 후 체크리스트
```markdown
## Post-Task Checklist
1. tasks.md 진행 상황 업데이트
2. 관련 rules 변경사항 반영
3. 테스트 통과 여부 확인
4. 코드 품질 검사 완료
5. DB 스키마 변경사항 동기화
6. 문서 업데이트 필요성 검토
```

### 문서화 규칙
```markdown
## Documentation Rules
1. 모든 컴포넌트에 JSDoc 주석 작성
2. 복잡한 로직에 인라인 주석 추가
3. README.md 변경사항 반영
4. API 문서 최신화
5. 환경 설정 변경사항 기록
```

### 동기화 자동화 도구
```markdown
## Synchronization Tools
- Git hooks를 통한 자동 검사
- PR 템플릿 활용
- CI/CD 파이프라인 연동
- 자동화된 문서 생성
```

---

## 결론

바이브 코딩의 성공은 단순히 "해줘"라고 요청하는 것이 아니라, **체계적인 작업 지시**와 **효과적인 컨텍스트 관리**에 달려있습니다. 위의 가이드를 바탕으로 프로젝트에 맞는 Cursor Rules를 작성하고 지속적으로 업데이트하여 AI와 함께하는 개발 생산성을 극대화하세요. 