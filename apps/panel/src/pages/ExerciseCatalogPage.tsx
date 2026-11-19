import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Dumbbell, ImagePlus, ImageOff, Pencil, Plus, Save, Trash2, Video } from 'lucide-react'
import { exerciseOwnerId, trainerName, type Exercise } from '@trainer/shared/domain'
import { ExerciseImage } from '@trainer/shared/charts'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorMessage,
  PageHeader,
  Section,
  SelectField,
  Skeleton,
  TextField,
  cn,
  useAsync,
} from '@trainer/shared/ui'
import { useAuth, type Profile } from '@trainer/shared/auth'
import { ConfirmButton } from '../ConfirmButton'
import {
  createExercise,
  deleteExercise,
  listExercises,
  listTrainers,
  removeExerciseImage,
  updateExercise,
  uploadExerciseImage,
} from '../api'

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
    <Section title="Nuevo ejercicio">
      <form onSubmit={onSubmit} className="space-y-3">
        {isAdmin && (
          <SelectField label="Entrenador" value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
            <option value="">Elegir...</option>
            {trainers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name || 'Sin nombre'}
              </option>
            ))}
          </SelectField>
        )}
        <TextField label="Nombre" required value={name} onChange={(e) => setName(e.target.value)} />
        <TextField label="Grupo muscular" value={group} onChange={(e) => setGroup(e.target.value)} />
        <TextField label="Link de video (opcional)" type="url" value={video} onChange={(e) => setVideo(e.target.value)} />
        <TextField
          key={fileKey}
          label="Imagen (opcional)"
          type="file"
          accept="image/*"
          className="h-auto py-2"
          onChange={(e) => setImage(e.target.files?.[0] ?? null)}
        />
        <ErrorMessage message={error} />
        <Button type="submit" className="w-full" disabled={submitting}>
          <Plus aria-hidden />
          {submitting ? 'Guardando...' : 'Agregar ejercicio'}
        </Button>
      </form>
    </Section>
  )
}

/** Inline form to fix an exercise's name, muscle group or video link (image is managed on the card). */
function EditExerciseForm({ exercise, onSaved, onCancel }: { exercise: Exercise; onSaved: () => void; onCancel: () => void }) {
  const [name, setName] = useState(exercise.name)
  const [group, setGroup] = useState(exercise.muscle_group ?? '')
  const [video, setVideo] = useState(exercise.video_url ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await updateExercise(exercise.id, {
        name: name.trim(),
        muscle_group: group.trim() || null,
        video_url: video.trim() || null,
        image_url: exercise.image_url,
      })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el ejercicio.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3" aria-label={`Editar ${exercise.name}`}>
      <TextField label="Nombre" required value={name} onChange={(e) => setName(e.target.value)} />
      <TextField label="Grupo muscular" value={group} onChange={(e) => setGroup(e.target.value)} />
      <TextField label="Link de video (opcional)" type="url" value={video} onChange={(e) => setVideo(e.target.value)} />
      <ErrorMessage message={error} />
      <div className="flex gap-2">
        <Button type="button" variant="ghost" disabled={submitting} onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" disabled={submitting || !name.trim()}>
          <Save aria-hidden />
          {submitting ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  )
}

function ExerciseCard({
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
  const [editing, setEditing] = useState(false)

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
    <Card className="gap-3 px-4 py-4">
      <div className="flex items-start gap-3">
        {exercise.image_url ? (
          <ExerciseImage url={exercise.image_url} alt={exercise.name} className="size-16 shrink-0" />
        ) : (
          <div aria-hidden className="grid size-16 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
            <ImageOff className="size-6" />
          </div>
        )}
        {editing ? (
          <div className="min-w-0 flex-1">
            <EditExerciseForm
              exercise={exercise}
              onCancel={() => setEditing(false)}
              onSaved={() => {
                setEditing(false)
                onChanged()
              }}
            />
          </div>
        ) : (
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-semibold break-words">{exercise.name}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {exercise.muscle_group && <Badge variant="secondary">{exercise.muscle_group}</Badge>}
            {ownerLabel && <Badge variant="outline">{ownerLabel}</Badge>}
          </div>
          {exercise.video_url && (
            <a
              href={exercise.video_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-8 items-center gap-1 text-sm font-medium text-link hover:underline"
            >
              <Video aria-hidden className="size-4" />
              Ver video
            </a>
          )}
        </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {!editing && (
          <Button variant="ghost" disabled={busy} onClick={() => setEditing(true)}>
            <Pencil aria-hidden />
            Editar
          </Button>
        )}
        <label
          className={cn(
            'inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-semibold text-foreground hover:bg-accent has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50',
            busy && 'pointer-events-none opacity-50',
          )}
        >
          <ImagePlus aria-hidden className="size-4" />
          {exercise.image_url ? 'Cambiar imagen' : 'Subir imagen'}
          <input type="file" accept="image/*" className="sr-only" disabled={busy} onChange={(e) => void onReplace(e)} />
        </label>
        {exercise.image_url && (
          <Button variant="ghost" disabled={busy} onClick={() => void onRemoveImage()}>
            Quitar imagen
          </Button>
        )}
        <ConfirmButton
          variant="ghost"
          className="text-danger-foreground hover:text-danger-foreground"
          disabled={busy}
          title={`¿Eliminar "${exercise.name}"?`}
          description="Se elimina del catálogo. Si está en uso en una rutina o tiene registros, no se va a poder borrar."
          onConfirm={() => void onDelete()}
        >
          <Trash2 aria-hidden />
          Eliminar
        </ConfirmButton>
      </div>
    </Card>
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
      <PageHeader title="Ejercicios" subtitle={data ? `${data.length} en el catálogo` : undefined} />
      <div className="grid gap-5 lg:grid-cols-3 lg:items-start">
        <div className="min-w-0 space-y-3 lg:col-span-2">
          <ErrorMessage message={error ?? actionError} />
          {loading && (
            <div className="space-y-3" role="status" aria-label="Cargando ejercicios">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          )}
          {data?.length === 0 && (
            <EmptyState icon={<Dumbbell aria-hidden />} title="El catálogo está vacío" description="Agregá el primer ejercicio con el formulario." />
          )}
          <ul className="grid gap-3 xl:grid-cols-2">
            {data?.map((ex) => (
              <li key={ex.id} className="min-w-0">
                <ExerciseCard
                  exercise={ex}
                  ownerLabel={isAdmin ? trainerName(trainers.data ?? [], ex.trainer_id) : null}
                  onChanged={reload}
                  onError={setActionError}
                />
              </li>
            ))}
          </ul>
        </div>
        {profile && <NewExerciseForm viewer={profile} trainers={trainers.data ?? []} onCreated={reload} />}
      </div>
    </>
  )
}
