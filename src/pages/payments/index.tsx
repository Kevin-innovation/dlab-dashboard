import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { StudentWithClass } from '../../types/student'
import {
  TuitionCalculation,
  PaymentStatus,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
} from '../../types/payment'
import { TuitionCalculator } from '../../utils/tuitionCalculator'
import { StudentService } from '../../services/studentService'
import {
  CurrencyDollarIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'

interface PaymentSummaryCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  color: 'blue' | 'green' | 'yellow' | 'red'
}

function PaymentSummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: PaymentSummaryCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    red: 'bg-red-50 text-red-600 border-red-200',
  }

  return (
    <div className={`p-6 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <Icon className="h-8 w-8" />
      </div>
    </div>
  )
}

interface PaymentRowProps {
  student: StudentWithClass
  calculation: TuitionCalculation
  nextPaymentDate: string
  paymentStatus: { status: 'upcoming' | 'due' | 'overdue'; daysUntilDue: number }
  onDelete: (studentId: string) => void
}

function PaymentRow({ student, calculation, nextPaymentDate, paymentStatus, onDelete }: PaymentRowProps) {
  const statusColorClass =
    paymentStatus.status === 'overdue'
      ? 'text-red-600'
      : paymentStatus.status === 'due'
        ? 'text-yellow-600'
        : 'text-green-600'

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="font-medium text-gray-900">{student.name}</div>
        <div className="text-sm text-gray-500">{student.grade}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm">
          <div className="font-medium">{calculation.class_type}</div>
          <div className="text-gray-500">{calculation.duration}시간</div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm">
          <div className="font-medium">₩{calculation.net_amount.toLocaleString()}</div>
          <div className="text-gray-500">
            {calculation.payment_type === 'monthly' ? '월납' : '분기납'}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {calculation.robotics_included ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            포함 (₩{calculation.robotics_amount.toLocaleString()})
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            미포함 (-{calculation.discount_rate}%)
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className={`text-sm font-medium ${statusColorClass}`}>{nextPaymentDate}</div>
        <div className="text-xs text-gray-500">
          {paymentStatus.status === 'overdue'
            ? `${Math.abs(paymentStatus.daysUntilDue)}일 연체`
            : paymentStatus.status === 'due'
              ? `${paymentStatus.daysUntilDue}일 남음`
              : `${paymentStatus.daysUntilDue}일 남음`}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            paymentStatus.status === 'overdue'
              ? 'bg-red-100 text-red-800'
              : paymentStatus.status === 'due'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-green-100 text-green-800'
          }`}
        >
          {paymentStatus.status === 'overdue'
            ? '연체'
            : paymentStatus.status === 'due'
              ? '납부예정'
              : '정상'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button className="text-blue-600 hover:text-blue-900 mr-3">결제 처리</button>
        <button className="text-green-600 hover:text-green-900 mr-3">내역 보기</button>
        <button 
          className="text-red-600 hover:text-red-900 p-1"
          onClick={() => onDelete(student.id)}
          title="학생 삭제"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </td>
    </tr>
  )
}

export default function PaymentsPage() {
  const [students, setStudents] = useState<StudentWithClass[]>([])
  const [calculations, setCalculations] = useState<Record<string, TuitionCalculation>>({})
  const [paymentStatuses, setPaymentStatuses] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'due' | 'overdue'>('all')

  useEffect(() => {
    fetchStudentsAndCalculatePayments()
  }, [])

  async function fetchStudentsAndCalculatePayments() {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('students')
        .select(
          `
          *,
          student_classes (
            *,
            classes (
              name,
              type,
              duration
            )
          )
        `
        )
        .order('name')

      if (error) throw error

      setStudents(data || [])

      // 각 학생별 수강료 계산
      const calculationsMap: Record<string, TuitionCalculation> = {}
      const statusesMap: Record<string, any> = {}

      data?.forEach((student) => {
        const studentClass = student.student_classes?.[0]
        if (studentClass) {
          try {
            const calculation = TuitionCalculator.calculate(student, studentClass.payment_type)
            calculationsMap[student.id] = calculation

            const nextPaymentDate = TuitionCalculator.calculateNextPaymentDate(
              studentClass.payment_day
            )
            const paymentStatus = TuitionCalculator.getPaymentStatus(nextPaymentDate)

            statusesMap[student.id] = {
              nextPaymentDate,
              paymentStatus,
            }
          } catch (err) {
            console.error(`Error calculating payment for student ${student.id}:`, err)
          }
        }
      })

      setCalculations(calculationsMap)
      setPaymentStatuses(statusesMap)
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteStudent = async (studentId: string) => {
    if (!window.confirm('정말 이 학생을 삭제하시겠습니까? 모든 관련 데이터가 삭제됩니다.')) {
      return
    }

    try {
      await StudentService.deleteStudent(studentId)
      // 목록에서 제거
      setStudents(prev => prev.filter(s => s.id !== studentId))
      // 계산 데이터에서 제거
      setCalculations(prev => {
        const newCalc = { ...prev }
        delete newCalc[studentId]
        return newCalc
      })
      setPaymentStatuses(prev => {
        const newStatus = { ...prev }
        delete newStatus[studentId]
        return newStatus
      })
    } catch (error) {
      console.error('학생 삭제 오류:', error)
      alert('학생 삭제에 실패했습니다.')
    }
  }

  const summary = students.length > 0 ? TuitionCalculator.generatePaymentSummary(students) : null

  const filteredStudents = students.filter((student) => {
    if (filterStatus === 'all') return true
    const status = paymentStatuses[student.id]?.paymentStatus?.status
    return status === filterStatus
  })

  if (loading) return <div className="text-center py-8">로딩 중...</div>
  if (error)
    return (
      <div className="text-red-500 p-4 rounded-md bg-red-50 mb-4">
        <p className="font-bold">오류 발생</p>
        <p>{error}</p>
      </div>
    )

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">수강료 관리</h1>
        <div className="flex items-center space-x-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="input-field"
          >
            <option value="all">전체</option>
            <option value="upcoming">정상</option>
            <option value="due">납부예정</option>
            <option value="overdue">연체</option>
          </select>
          <button className="btn-primary">수강료 설정</button>
        </div>
      </div>

      {/* 요약 카드 */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <PaymentSummaryCard
            title="월 예상 수입"
            value={`₩${summary.totalMonthlyRevenue.toLocaleString()}`}
            subtitle={`총 ${summary.totalStudents}명`}
            icon={CurrencyDollarIcon}
            color="blue"
          />
          <PaymentSummaryCard
            title="이번 주 납부예정"
            value={summary.paymentsDueThisWeek}
            subtitle="7일 이내 납부"
            icon={CalendarIcon}
            color="green"
          />
          <PaymentSummaryCard
            title="납부 예정"
            value={summary.upcomingPayments}
            subtitle="정상 상태"
            icon={ClockIcon}
            color="yellow"
          />
          <PaymentSummaryCard
            title="연체"
            value={summary.overduePayments}
            subtitle="즉시 처리 필요"
            icon={ExclamationTriangleIcon}
            color="red"
          />
        </div>
      )}

      {/* 학생별 수강료 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">학생별 수강료 현황</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  학생
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  수업 정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  수강료
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  로보틱스
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  다음 납부일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => {
                const calculation = calculations[student.id]
                const status = paymentStatuses[student.id]

                if (!calculation || !status) return null

                return (
                  <PaymentRow
                    key={student.id}
                    student={student}
                    calculation={calculation}
                    nextPaymentDate={status.nextPaymentDate}
                    paymentStatus={status.paymentStatus}
                    onDelete={handleDeleteStudent}
                  />
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
