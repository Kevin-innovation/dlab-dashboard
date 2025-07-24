import { useState } from 'react'
import { StudentList } from '../../components/students/StudentList'
import { StudentForm } from '../../components/students/StudentForm'
import { Student } from '../../types/student'

export function StudentsPage() {
  const [showForm, setShowForm] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | undefined>()
  const [refreshKey, setRefreshKey] = useState(0)

  const handleAdd = () => {
    setSelectedStudent(undefined)
    setShowForm(true)
  }

  const handleEdit = (student: Student) => {
    setSelectedStudent(student)
    setShowForm(true)
  }

  const handleFormSubmit = () => {
    setShowForm(false)
    setSelectedStudent(undefined)
    setRefreshKey(prev => prev + 1) // 목록 새로고침 트리거
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setSelectedStudent(undefined)
  }

  return (
    <div className="p-6">
      {showForm ? (
        <div className="card">
          <h2 className="text-2xl font-bold mb-6">
            {selectedStudent ? '학생 정보 수정' : '새 학생 추가'}
          </h2>
          <StudentForm
            student={selectedStudent}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        </div>
      ) : (
        <StudentList key={refreshKey} onAdd={handleAdd} onEdit={handleEdit} />
      )}
    </div>
  )
} 