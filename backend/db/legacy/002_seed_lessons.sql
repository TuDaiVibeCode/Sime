insert into lesson_tracks (id, name, summary, sort_order) values
  ('foundations', 'Foundations', 'The base every voice needs.', 10),
  ('technique', 'Technique', 'Build power and flexibility.', 20),
  ('performance', 'Performance', 'Turn technique into music.', 30)
on conflict (id) do update set
  name = excluded.name,
  summary = excluded.summary,
  sort_order = excluded.sort_order;

insert into lessons (id, track_id, title, duration_min, sort_order) values
  ('breath-support', 'foundations', 'Breath support and control', 8, 10),
  ('posture', 'foundations', 'Posture and alignment', 6, 20),
  ('pitch-matching', 'foundations', 'Pitch matching and ear training', 10, 30),
  ('resonance-basics', 'foundations', 'Resonance basics', 9, 40),
  ('mixed-voice', 'technique', 'Mixed voice and bridging registers', 12, 10),
  ('belting', 'technique', 'Belting without strain', 11, 20),
  ('vibrato', 'technique', 'Vibrato control', 9, 30),
  ('agility', 'technique', 'Agility and runs', 10, 40),
  ('phrasing', 'performance', 'Phrasing and dynamics', 10, 10),
  ('stage-presence', 'performance', 'Stage presence and nerves', 8, 20),
  ('mic-technique', 'performance', 'Microphone technique', 7, 30),
  ('interpretation', 'performance', 'Song interpretation', 12, 40)
on conflict (id) do update set
  track_id = excluded.track_id,
  title = excluded.title,
  duration_min = excluded.duration_min,
  sort_order = excluded.sort_order;
