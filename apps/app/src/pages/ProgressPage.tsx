import { useEffect, useState } from 'react'
import { fetchExercisesByIds, fetchWorkoutLogs } from '@trainer/shared/data-api'
import { ExerciseProgress } from '@trainer/shared/charts'
import { ErrorMessage, PageHeader, Spinner, useAsync } from '@trainer/shared/ui'
import { useViewedClient } from '../viewed-client'

export function ProgressPage() {
  const { clientId } = useViewedClient()
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
      <PageHeader title="Progreso" />
      <ErrorMessage message={logs.error} />
      <ExerciseProgress logs={logs.data ?? []} exerciseNames={names} />
    </>
  )
}
