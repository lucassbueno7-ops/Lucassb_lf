-- Optional: seed common exercises for a trainer. Replace the email below.
insert into public.exercises (trainer_id, name, muscle_group)
select p.id, e.name, e.muscle_group
from public.profiles p
cross join (values
  ('Sentadilla', 'Piernas'),
  ('Peso muerto', 'Espalda'),
  ('Press de banca', 'Pecho'),
  ('Press militar', 'Hombros'),
  ('Dominadas', 'Espalda'),
  ('Remo con barra', 'Espalda'),
  ('Prensa 45', 'Piernas'),
  ('Curl de biceps', 'Brazos'),
  ('Extension de triceps', 'Brazos'),
  ('Plancha', 'Core')
) as e(name, muscle_group)
where p.id = (select id from auth.users where email = 'trainer@example.com');
