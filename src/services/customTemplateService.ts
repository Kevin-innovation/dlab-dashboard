import { supabase } from '../lib/supabase'
import { CustomTemplate } from '../types/feedback'

export class CustomTemplateService {
  /**
   * 선생님의 커스텀 템플릿 목록 조회
   */
  static async getTemplates(teacherId: string): Promise<CustomTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('custom_templates')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching custom templates:', error)
      throw error
    }
  }

  /**
   * 커스텀 템플릿 저장
   */
  static async saveTemplate(
    teacherId: string,
    name: string,
    content: string
  ): Promise<CustomTemplate> {
    try {
      const { data, error } = await supabase
        .from('custom_templates')
        .insert([
          {
            teacher_id: teacherId,
            name: name.trim(),
            content: content.trim(),
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error saving custom template:', error)
      throw error
    }
  }

  /**
   * 커스텀 템플릿 업데이트
   */
  static async updateTemplate(
    templateId: string,
    name: string,
    content: string
  ): Promise<CustomTemplate> {
    try {
      const { data, error } = await supabase
        .from('custom_templates')
        .update({
          name: name.trim(),
          content: content.trim(),
        })
        .eq('id', templateId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating custom template:', error)
      throw error
    }
  }

  /**
   * 커스텀 템플릿 삭제
   */
  static async deleteTemplate(templateId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('custom_templates')
        .delete()
        .eq('id', templateId)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting custom template:', error)
      throw error
    }
  }

  /**
   * 템플릿 이름 중복 확인
   */
  static async checkNameExists(teacherId: string, name: string, excludeId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('custom_templates')
        .select('id')
        .eq('teacher_id', teacherId)
        .eq('name', name.trim())

      if (excludeId) {
        query = query.neq('id', excludeId)
      }

      const { data, error } = await query

      if (error) throw error
      return (data || []).length > 0
    } catch (error) {
      console.error('Error checking template name:', error)
      return false
    }
  }
}