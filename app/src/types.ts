export type QuestionType = 'true-false' | 'multiple-choice'

export interface Question {
  id: string
  exam: string
  section: string
  topic: string
  prompt: string
  type: QuestionType
  options: string[]
  answer: string
  explanation: string
  description?: string
}
