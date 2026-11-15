import { useState, type ChangeEvent, type FormEvent } from 'react'
import { exerciseOwnerId, trainerName, type Exercise } from '@trainer/shared/domain'
import { ExerciseImage } from '@trainer/shared/charts'
import { Button, Card, ErrorMessage, Input, Select, Spinner } from '@trainer/shared/ui'
import { useAsync } from '@trainer/shared/ui'
import { useAuth } from '@trainer/shared/auth'
import {
  createExercise,
  deleteExercise,
  listExercises,
  listTrainers,
  removeExerciseImage,
  updateExercise,
  uploadExerciseImage,
} from '../api'
import type { Profile } from '@trainer/shared/auth'

function NewExerciseForm({
  viewer,
  trainers,
  onCreated,
}: {
  viewer: Profile
  /** Selectable owners; only used (and shown) for admins. */
  trainers: Profile[]
  onCreated: () => void
}) {
  const isAdmin = viewer.role === 'admin'
  const [ownerId, setOwnerId] = useState('')
  const [name, setName] = useState('')
  const [group, setGroup] = useState('')
  const [video, setVideo] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [fileKey, setFileKey] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const trainerId = exerciseOwnerId(viewer, ownerId)
    if (!trainerId) return setError('Elegí el entrenador dueño del ejercicio.')
    setSubmitting(true)
    try {
      const image_url = image ? await uploadExerciseImage(trainerId, image) : null
      await createExercise(trainerId, {
        name: name.trim(),
        muscle_group: group.trim() || null,
        video_url: video.trim() || null,
        image_url,
      })
      setName('')
      setGroup('')
      setVideo('')
      setImage(null)
      setFileKey((k) => k + 1)
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el ejercicio.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card title="Nuevo ejercicio">
      <form onSubmit={onSubmit} className="space-y-3">
        {isAdmin && (
          <Select label="Entrenador" value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
            <option value="">Elegir...</option>
            {trainers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name || 'Sin nombre'}
              </option>
            ))}
          </Select>
        )}
        <Input label="Nombre" required value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Grupo muscular" value={group} onChange={(e) => setGroup(e.target.value)} />
        <Input label="Link de video (opcional)" type="url" value={video} onChange={(e) => setVideo(e.target.value)} />
        <Input
          key={fileKey}
          label="Imagen (opcional)"
          type="file"
          accept="image/*"
          className="py-2"
          onChange={(e) => setImage(e.target.files?.[0] ?? null)}
        />
        <ErrorMessage message={error} />
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Guardando...' : 'Agregar'}
        </Button>
      </form>
    </Card>
  )
}

function ExerciseRow({
  exercise,
  ownerLabel,
  onChanged,
  onError,
}: {
  exercise: Exercise
  ownerLabel: string | null
  onChanged: () => void
  onError: (message: string | null) => void
}) {
  const [busy, setBusy] = useState(false)

  const base = {
    name: exercise.name,
    muscle_group: exercise.muscle_group,
    video_url: exercise.video_url,
  }

  const onReplace = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    onError(null)
    setBusy(true)
    try {
      const url = await uploadExerciseImage(exercise.trainer_id, file)
      await updateExercise(exercise.id, { ...base, image_url: url })
      if (exercise.image_url) await removeExerciseImage(exercise.image_url).catch(() => undefined)
      onChanged()
    } catch (err) {
      onError(err instanceof Error ? err.message : 'No se pudo subir la imagen.')
    } finally {
      setBusy(false)
    }
  }

  const onRemoveImage = async () => {
    if (!exercise.image_url) return
    onError(null)
    setBusy(true)
    try {
      await updateExercise(exercise.id, { ...base, image_url: null })
      await removeExerciseImage(exercise.image_url).catch(() => undefined)
      onChanged()
    } catch (err) {
      onError(err instanceof Error ? err.message : 'No se pudo quitar la imagen.')
    } finally {
      setBusy(false)
    }
  }

  const onDelete = async () => {
    onError(null)
    setBusy(true)
    try {
      await deleteExercise(exercise.id)
      if (exercise.image_url) await removeExerciseImage(exercise.image_url).catch(() => undefined)
      onChanged()
    } catch {
      onError('No se puede eliminar: el ejercicio está en uso en una rutina o tiene registros.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="flex items-center justify-between gap-2 py-2">
      <div className="flex min-w-0 items-center gap-3">
        <ExerciseImage url={exercise.image_url} alt={exercise.name} className="h-14 w-14 shrink-0" />
        <div className="min-w-0">
          <p className="font-medium">{exercise.name}</p>
          <p className="text-xs text-slate-500">
            {exercise.muscle_group}
            {ownerLabel && ` - Entrenador: ${ownerLabel}`}
            {exercise.video_url && (
              <>
                {' - '}
                <a href={exercise.video_url} target="_blank" rel="noreferrer" className="text-teal-700 underline">
                  video
                </a>
              </>
            )}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap justify-end gap-1">
        <label
          className={`inline-flex min-h-11 cursor-pointer items-center rounded-lg px-3 text-sm font-medium text-teal-700 hover:bg-teal-50 ${busy ? 'pointer-events-none opacity-50' : ''}`}
        >
          {exercise.image_url ? 'Cambiar imagen' : 'Subir imagen'}
          <input type="file" accept="image/*" className="sr-only" disabled={busy} onChange={(e) => void onReplace(e)} />
        </label>
        {exercise.image_url && (
          <Button variant="ghost" disabled={busy} onClick={() => void onRemoveImage()}>
            Quitar imagen
          </Button>
        )}
        <Button variant="ghost" disabled={busy} onClick={() => void onDelete()}>
          Eliminar
        </Button>
      </div>
    </li>
  )
}

export function ExerciseCatalogPage() {
  const { profile } = useAuth()
  const viewerId = profile?.id ?? ''
  const isAdmin = profile?.role === 'admin'
  // Admins see every trainer's exercises; trainers only their own.
  const { data, loading, error, reload } = useAsync(() => listExercises(isAdmin ? null : viewerId), [viewerId, isAdmin])
  const trainers = useAsync(() => (isAdmin ? listTrainers() : Promise.resolve([])), [isAdmin])
  const [actionError, setActionError] = useState<string | null>(null)

  return (
    <>
      <Card title="Catálogo de ejercicios">
        {loading && <Spinner />}
        <ErrorMessage message={error ?? actionError} />
        {data?.length === 0 && <p className="text-sm text-slate-500">El catálogo está vacío.</p>}
        <ul className="divide-y divide-slate-100">
          {data?.map((ex) => (
            <ExerciseRow
              key={ex.id}
              exercise={ex}
              ownerLabel={isAdmin ? trainerName(trainers.data ?? [], ex.trainer_id) : null}
              onChanged={reload}
              onError={setActionError}
            />
          ))}
        </ul>
      </Card>
      {profile && <NewExerciseForm viewer={profile} trainers={trainers.data ?? []} onCreated={reload} />}
    </>
  )
}
