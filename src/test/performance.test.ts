import { describe, it, expect } from 'vitest'

describe('성능 테스트', () => {
  describe('유틸리티 함수 성능', () => {
    it('TuitionCalculator 대량 데이터 처리 성능', async () => {
      const { TuitionCalculator } = await import('../utils/tuitionCalculator')
      const { StudentWithClass } = await import('../types/student')

      // 1000명의 학생 데이터 생성
      const students: StudentWithClass[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `student-${i}`,
        name: `학생${i}`,
        parent_phone: '010-1234-5678',
        payment_day: 15,
        notes: '',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        student_classes: [
          {
            id: `class-${i}`,
            student_id: `student-${i}`,
            class_type: i % 2 === 0 ? '1:1' : 'group',
            class_duration: '1h',
            payment_type: 'monthly',
            payment_day: 15,
            robotics_option: i % 3 === 0,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
        ],
      }))

      const startTime = performance.now()
      const summary = TuitionCalculator.generatePaymentSummary(students)
      const endTime = performance.now()

      const processingTime = endTime - startTime

      expect(summary.totalStudents).toBe(1000)
      expect(processingTime).toBeLessThan(500) // 500ms 이내 처리
    })

    it('StatisticsCalculator 대량 데이터 처리 성능', async () => {
      const { StatisticsCalculator } = await import('../utils/statisticsCalculator')
      const { StudentWithClass } = await import('../types/student')

      // 5000명의 학생 데이터 생성
      const students: StudentWithClass[] = Array.from({ length: 5000 }, (_, i) => ({
        id: `student-${i}`,
        name: `학생${i}`,
        parent_phone: '010-1234-5678',
        payment_day: 15,
        notes: '',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        student_classes: [
          {
            id: `class-${i}`,
            student_id: `student-${i}`,
            class_type: i % 3 === 0 ? '1:1' : 'group',
            class_duration: ['1h', '1.5h', '2h'][i % 3] as any,
            payment_type: i % 4 === 0 ? 'quarterly' : 'monthly',
            payment_day: 15,
            robotics_option: i % 5 === 0,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
        ],
      }))

      const startTime = performance.now()
      const stats = StatisticsCalculator.calculateStudentCount(students)
      const endTime = performance.now()

      const processingTime = endTime - startTime

      expect(stats.actual_students).toBe(5000)
      expect(processingTime).toBeLessThan(1000) // 1초 이내 처리
    })

    it('주간 통계 계산 성능', async () => {
      const { StatisticsCalculator } = await import('../utils/statisticsCalculator')
      const { StudentWithClass } = await import('../types/student')

      const students: StudentWithClass[] = Array.from({ length: 2000 }, (_, i) => ({
        id: `student-${i}`,
        name: `학생${i}`,
        parent_phone: '010-1234-5678',
        payment_day: 15,
        notes: '',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        student_classes: [
          {
            id: `class-${i}`,
            student_id: `student-${i}`,
            class_type: i % 2 === 0 ? '1:1' : 'group',
            class_duration: '1h',
            payment_type: 'monthly',
            payment_day: 15,
            robotics_option: false,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
        ],
      }))

      const startTime = performance.now()
      const weeklyStats = StatisticsCalculator.calculateWeeklyStatistics(students)
      const monthlyStats = StatisticsCalculator.calculateMonthlyStatistics(students)
      const endTime = performance.now()

      const processingTime = endTime - startTime

      expect(weeklyStats.actual_students).toBe(2000)
      expect(monthlyStats.actual_students).toBe(2000)
      expect(processingTime).toBeLessThan(800) // 800ms 이내 처리
    })
  })

  describe('메모리 사용량 테스트', () => {
    it('대량 데이터 처리 시 메모리 누수 확인', async () => {
      const { StatisticsCalculator } = await import('../utils/statisticsCalculator')
      const { StudentWithClass } = await import('../types/student')

      const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0

      // 반복적으로 대량 데이터 처리
      for (let iteration = 0; iteration < 10; iteration++) {
        const students: StudentWithClass[] = Array.from({ length: 1000 }, (_, i) => ({
          id: `student-${iteration}-${i}`,
          name: `학생${i}`,
          parent_phone: '010-1234-5678',
          payment_day: 15,
          notes: '',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          student_classes: [
            {
              id: `class-${iteration}-${i}`,
              student_id: `student-${iteration}-${i}`,
              class_type: 'group',
              class_duration: '1h',
              payment_type: 'monthly',
              payment_day: 15,
              robotics_option: false,
              created_at: '2024-01-01',
              updated_at: '2024-01-01',
            },
          ],
        }))

        StatisticsCalculator.calculateStudentCount(students)
        StatisticsCalculator.generateChartData(students)
      }

      // 가비지 컬렉션 강제 실행 (브라우저 환경에서만 작동)
      if (global.gc) {
        global.gc()
      }

      const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0
      const memoryIncrease = finalMemory - initialMemory

      // 메모리 증가가 합리적인 범위 내에 있는지 확인 (10MB 이내)
      if (performance.memory) {
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
      }
    })
  })

  describe('동시성 테스트', () => {
    it('여러 계산이 동시에 실행될 때 성능', async () => {
      const { TuitionCalculator } = await import('../utils/tuitionCalculator')
      const { StatisticsCalculator } = await import('../utils/statisticsCalculator')
      const { StudentWithClass } = await import('../types/student')

      const students: StudentWithClass[] = Array.from({ length: 500 }, (_, i) => ({
        id: `student-${i}`,
        name: `학생${i}`,
        parent_phone: '010-1234-5678',
        payment_day: 15,
        notes: '',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        student_classes: [
          {
            id: `class-${i}`,
            student_id: `student-${i}`,
            class_type: 'group',
            class_duration: '1.5h',
            payment_type: 'monthly',
            payment_day: 15,
            robotics_option: true,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
        ],
      }))

      const startTime = performance.now()

      // 여러 계산을 동시에 실행
      const promises = await Promise.all([
        Promise.resolve(TuitionCalculator.generatePaymentSummary(students)),
        Promise.resolve(StatisticsCalculator.calculateStudentCount(students)),
        Promise.resolve(StatisticsCalculator.calculateWeeklyStatistics(students)),
        Promise.resolve(StatisticsCalculator.calculateMonthlyStatistics(students)),
        Promise.resolve(StatisticsCalculator.generateChartData(students)),
      ])

      const endTime = performance.now()
      const processingTime = endTime - startTime

      expect(promises).toHaveLength(5)
      expect(promises[0].totalStudents).toBe(500)
      expect(promises[1].actual_students).toBe(500)
      expect(processingTime).toBeLessThan(1500) // 1.5초 이내
    })
  })

  describe('알고리즘 복잡도 테스트', () => {
    it('데이터 크기에 따른 선형 성능 증가 확인', async () => {
      const { StatisticsCalculator } = await import('../utils/statisticsCalculator')
      const { StudentWithClass } = await import('../types/student')

      const createStudents = (count: number): StudentWithClass[] =>
        Array.from({ length: count }, (_, i) => ({
          id: `student-${i}`,
          name: `학생${i}`,
          parent_phone: '010-1234-5678',
          payment_day: 15,
          notes: '',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          student_classes: [
            {
              id: `class-${i}`,
              student_id: `student-${i}`,
              class_type: 'group',
              class_duration: '1h',
              payment_type: 'monthly',
              payment_day: 15,
              robotics_option: false,
              created_at: '2024-01-01',
              updated_at: '2024-01-01',
            },
          ],
        }))

      // 다양한 크기의 데이터셋으로 성능 측정
      const sizes = [100, 500, 1000, 2000]
      const times: number[] = []

      for (const size of sizes) {
        const students = createStudents(size)

        const startTime = performance.now()
        StatisticsCalculator.calculateStudentCount(students)
        const endTime = performance.now()

        times.push(endTime - startTime)
      }

      // 시간 복잡도가 선형에 가까운지 확인
      // 2배 크기일 때 시간이 3배를 넘지 않아야 함
      for (let i = 1; i < sizes.length; i++) {
        const sizeRatio = sizes[i] / sizes[i - 1]
        const timeRatio = times[i] / times[i - 1]

        expect(timeRatio).toBeLessThan(sizeRatio * 1.5) // 50% 여유
      }
    })
  })
})
