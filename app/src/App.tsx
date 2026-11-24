import { useMemo, useState } from 'react'
import { questions } from './questions'
import type { Question } from './types'

type Screen = 'setup' | 'quiz' | 'results'
type CategoryKind = 'section' | 'topic'

interface Attempt {
  question: Question
  options: string[]
  selected: string | null
  correct: boolean
}

function shuffle<T>(items: T[]) {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function App() {
  const [screen, setScreen] = useState<Screen>('setup')
  const [mode, setMode] = useState<'mixed' | 'category'>('mixed')
  const [categoryKind, setCategoryKind] = useState<CategoryKind>('section')
  const [category, setCategory] = useState('')
  const [mixedExam, setMixedExam] = useState('All exams')
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)

  const sections = useMemo(() => [...new Set(questions.map((q) => q.section))].sort(), [])
  const topics = useMemo(() => [...new Set(questions.map((q) => q.topic))].sort(), [])
  const exams = useMemo(() => ['All exams', ...[...new Set(questions.map((q) => q.exam))].sort()], [])

  const startQuiz = () => {
    let pool = [...questions]
    if (mode === 'mixed' && mixedExam !== 'All exams') {
      pool = pool.filter((q) => q.exam === mixedExam)
    } else if (mode === 'category') {
      const chosen = category || (categoryKind === 'section' ? sections[0] : topics[0])
      pool = pool.filter((q) => q[categoryKind] === chosen)
    }

    const picked = mode === 'category'
      ? shuffle(pool).slice(0, Math.min(10, pool.length))
      : pool.slice(0, Math.min(10, pool.length))
    setAttempts(picked.map((question) => ({
      question,
      options: shuffle(question.options),
      selected: null,
      correct: false,
    })))
    setIndex(0)
    setSelected(null)
    setScreen('quiz')
  }

  const confirmAnswer = () => {
    if (!selected) return
    setAttempts((current) => current.map((attempt, i) =>
      i === index
        ? {...attempt, selected, correct: selected === attempt.question.answer}
        : attempt,
    ))
  }

  const nextQuestion = () => {
    if (index >= attempts.length - 1) {
      setScreen('results')
    } else {
      setIndex((current) => current + 1)
      setSelected(null)
    }
  }

  const restart = () => {
    setScreen('setup')
    setAttempts([])
    setIndex(0)
    setSelected(null)
  }

  if (screen === 'quiz') {
    const attempt = attempts[index]
    const answered = attempt.selected !== null
    const progress = ((index + 1) / attempts.length) * 100

    return (
      <main className="min-h-screen bg-[#0b1020] text-slate-100">
        <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
          <button onClick={restart} className="text-sm font-bold text-slate-400 hover:text-white">← Exit quiz</button>
          <div className="rounded-full bg-[#171e33] px-3 py-1.5 text-xs font-bold text-cyan-300">
            {index + 1} / {attempts.length}
          </div>
        </header>
        <div className="h-1 bg-[#171e33]">
          <div className="h-full bg-cyan-400 transition-all" style={{ width: `${progress}%` }} />
        </div>

        <section className="mx-auto max-w-3xl px-5 py-10 md:py-16">
          <div className="mb-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs font-bold text-violet-300">{attempt.question.topic}</span>
            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300">{attempt.question.exam} exam · {attempt.question.section}</span>
          </div>
          <h1 className="mb-8 text-2xl font-black leading-tight text-white md:text-4xl">{attempt.question.prompt}</h1>

          <div className="grid gap-3">
            {attempt.options.map((option, optionIndex) => {
              const isSelected = selected === option
              let border = 'border-slate-700 bg-[#151b2d] hover:border-cyan-400'
              if (answered && option === attempt.question.answer) border = 'border-emerald-400 bg-emerald-400/10'
              if (answered && isSelected && !attempt.correct) border = 'border-rose-400 bg-rose-400/10'
              if (!answered && isSelected) border = 'border-cyan-400 bg-cyan-400/10'

              return (
                <button
                  key={option}
                  disabled={answered}
                  onClick={() => setSelected(option)}
                  className={`flex min-h-16 items-center gap-4 rounded-xl border-2 px-4 text-left transition ${border}`}
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-black ${isSelected ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                    {attempt.question.type === 'true-false' ? (optionIndex === 0 ? 'T' : 'F') : String.fromCharCode(65 + optionIndex)}
                  </span>
                  <span className="font-bold">{option}</span>
                </button>
              )
            })}
          </div>

          {answered && (
            <div className={`mt-6 rounded-xl border p-4 ${attempt.correct ? 'border-emerald-400/40 bg-emerald-400/10' : 'border-rose-400/40 bg-rose-400/10'}`}>
              <p className={`font-black ${attempt.correct ? 'text-emerald-300' : 'text-rose-300'}`}>
                {attempt.correct ? 'Correct' : `Answer: ${attempt.question.answer}`}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-300">{attempt.question.explanation}</p>
            </div>
          )}

          <div className="mt-8 flex justify-end">
            {!answered ? (
              <button
                disabled={!selected}
                onClick={confirmAnswer}
                className="rounded-xl bg-cyan-400 px-6 py-3 font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Check answer
              </button>
            ) : (
              <button onClick={nextQuestion} className="rounded-xl bg-violet-500 px-6 py-3 font-black text-white">
                {index === attempts.length - 1 ? 'See results' : 'Next question'} →
              </button>
            )}
          </div>
        </section>
      </main>
    )
  }

  if (screen === 'results') {
    const correct = attempts.filter((attempt) => attempt.correct).length
    const percentage = Math.round((correct / attempts.length) * 100)

    return (
      <main className="min-h-screen bg-[#0b1020] px-5 py-10 text-slate-100">
        <section className="mx-auto max-w-4xl">
          <button onClick={restart} className="mb-8 text-sm font-bold text-slate-400 hover:text-white">← Back to setup</button>
          <div className="rounded-2xl border border-slate-800 bg-[#13192a] p-6 md:p-8">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">Quiz complete</p>
            <div className="mt-3 flex items-end gap-3">
              <h1 className="text-6xl font-black text-white">{percentage}%</h1>
              <p className="mb-2 text-lg font-bold text-slate-400">{correct} of {attempts.length} correct</p>
            </div>
          </div>

          <h2 className="mb-4 mt-8 text-xl font-black">Review answers</h2>
          <div className="space-y-3">
            {attempts.map((attempt, i) => (
              <details key={attempt.question.id} className="rounded-xl border border-slate-800 bg-[#13192a] p-4">
                <summary className="cursor-pointer list-none">
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 h-3 w-3 shrink-0 rounded-full ${attempt.correct ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                    <span className="font-bold">{i + 1}. {attempt.question.prompt}</span>
                  </div>
                </summary>
                <div className="mt-4 border-t border-slate-800 pt-4 text-sm">
                  <p><span className="font-bold text-slate-400">Your answer:</span> {attempt.selected ?? 'No answer'}</p>
                  <p className="mt-1"><span className="font-bold text-emerald-300">Correct answer:</span> {attempt.question.answer}</p>
                  <p className="mt-3 leading-6 text-slate-300">{attempt.question.explanation}</p>
                </div>
              </details>
            ))}
          </div>
          <button onClick={startQuiz} className="mt-6 rounded-xl bg-violet-500 px-6 py-3 font-black text-white">Try another 10</button>
        </section>
      </main>
    )
  }

  const chosenCategory = category || (categoryKind === 'section' ? sections[0] : topics[0])

  return (
    <main className="min-h-screen bg-[#0b1020] text-slate-100">
      <div className="mx-auto max-w-6xl px-5 py-8 md:py-14">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">INF234</p>
            <h1 className="mt-1 text-2xl font-black text-white">Exam Quiz</h1>
          </div>
          <div className="rounded-full border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-300">
            {questions.length} questions
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-2">
          <button
            onClick={() => setMode('mixed')}
            className={`rounded-2xl border-2 p-6 text-left transition ${mode === 'mixed' ? 'border-cyan-400 bg-cyan-400/10' : 'border-slate-800 bg-[#13192a] hover:border-slate-600'}`}
          >
            <span className="text-3xl">⚡</span>
            <h2 className="mt-5 text-xl font-black">Mixed exam</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">A 10-question short exam mixing sections and topics in source exam order.</p>
          </button>
          <button
            onClick={() => setMode('category')}
            className={`rounded-2xl border-2 p-6 text-left transition ${mode === 'category' ? 'border-violet-400 bg-violet-400/10' : 'border-slate-800 bg-[#13192a] hover:border-slate-600'}`}
          >
            <span className="text-3xl">◫</span>
            <h2 className="mt-5 text-xl font-black">Practice by category</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">Focus on one official exam section or one algorithm topic.</p>
          </button>
        </section>

        {mode === 'mixed' && (
          <section className="mt-5 rounded-2xl border border-slate-800 bg-[#13192a] p-5">
            <label className="text-sm font-bold text-slate-300">
              Exam order
              <select
                value={mixedExam}
                onChange={(event) => setMixedExam(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-[#0b1020] px-4 py-3 text-white outline-none focus:border-cyan-400"
              >
                {exams.map((exam) => (
                  <option key={exam} value={exam}>{exam}</option>
                ))}
              </select>
            </label>
          </section>
        )}

        {mode === 'category' && (
          <section className="mt-5 rounded-2xl border border-slate-800 bg-[#13192a] p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-bold text-slate-300">
                Category type
                <select
                  value={categoryKind}
                  onChange={(event) => {
                    const kind = event.target.value as CategoryKind
                    setCategoryKind(kind)
                    setCategory(kind === 'section' ? sections[0] : topics[0])
                  }}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-[#0b1020] px-4 py-3 text-white outline-none focus:border-violet-400"
                >
                  <option value="section">Exam section</option>
                  <option value="topic">Topic</option>
                </select>
              </label>
              <label className="text-sm font-bold text-slate-300">
                Category
                <select
                  value={chosenCategory}
                  onChange={(event) => setCategory(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-[#0b1020] px-4 py-3 text-white outline-none focus:border-violet-400"
                >
                  {(categoryKind === 'section' ? sections : topics).map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>
        )}

        <button
          onClick={startQuiz}
          className="mt-5 w-full rounded-2xl bg-cyan-400 px-6 py-4 text-lg font-black text-slate-950 hover:bg-cyan-300"
        >
          Start 10-question quiz →
        </button>
      </div>
    </main>
  )
}

export default App
