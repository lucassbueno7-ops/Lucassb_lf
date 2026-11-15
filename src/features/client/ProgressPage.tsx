import { useEffect, useState } from 'react'
import { fetchExercisesByIds, fetchWorkoutLogs } from '../../shared/data-api'
import { ExerciseProgress } from '../../shared/ExerciseProgress'
import { ErrorMessage, Spinner } from '../../shared/ui'
import { useAsync } from '../../shared/useAsync'
import { useAuth } from '../auth/auth-context'

export function ProgressPage() {
  const { profile } = useAuth()
  const clientId = profile?.id ?? ''
  const logs = useAsync(() => fetchWorkoutLogs(clientId), [clientId])
  const [names, setNames] = useState<Record<string, string>>({})

  const idsKey = logs.data ? [...new Set(logs.data.map((l) => l.exercise_id))].join(',') : ''
  useEffect(() => {
    if (!idsKey) return
    let cancelled = false
    fetchExercisesByIds(idsKey.split(',')).then((list) => {
      if (!cancelled) setNames(Object.fromEntries(list.map((x) => [x.id, x.name])))
    })
    return () => {
      cancelled = true
    }
  }, [idsKey])

  if (logs.loading) return <Spinner />
  return (
    <>
      <ErrorMessage message={logs.error} />
      <ExerciseProgress logs={logs.data ?? []} exerciseNames={names} />
    </>
  )
}
