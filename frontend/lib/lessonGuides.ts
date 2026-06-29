import { eduxLessonGuides } from './eduxLessonGuides';
/**
 * Per-lesson how-to content: a full, coach-style course that takes a normal
 * beginner toward professional, diva or divo level singing.
 *
 * Sime's live analysis only measures pitch (which note you sing and how many
 * cents sharp or flat you are). It does not watch you on camera and cannot judge
 * tone, strain, breath, or expression. So every lesson teaches the technique in
 * words, gives drills you can repeat, and is explicit about what Sime checks for
 * you versus what you have to judge yourself. Keep that split honest when editing.
 *
 * This is presentation content and lives in the frontend on purpose: the backend
 * lesson record (id, title, duration, track) stays the source of truth for the
 * curriculum, and guides are keyed to it by lesson id.
 */

/** A repeatable practice drill with its dosage. */
export interface LessonDrill {
  name: string;
  how: string;
  /** How much and how often: sets, reps, seconds, or frequency. */
  reps: string;
}

export interface LessonQuiz {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface NoteReadingTarget {
  note: string;
  label: string;
  hint: string;
}

export interface NoteReadingExercise {
  title: string;
  instructions: string;
  clef: 'treble' | 'bass';
  passScore: number;
  toleranceCents: number;
  holdMs: number;
  targets: NoteReadingTarget[];
}

export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Professional';

/** One rung on the path from first attempt to stage ready. */
export interface ProgressionStep {
  level: SkillLevel;
  /** What mastery looks like at this level. */
  marker: string;
}

export interface LessonGuide {
  /** One sentence on what the skill is. */
  objective: string;
  /** The principle: why this skill matters and how it works. */
  why: string;
  /** Ordered "how to do it" steps. */
  steps: string[];
  /** Repeatable drills with dosage, the daily workout for this skill. */
  drills: LessonDrill[];
  /** What to listen and feel for while practising. */
  feelFor: string[];
  /** Common mistakes to avoid. */
  mistakes: string[];
  /** What Sime's pitch tool actually verifies for this lesson. */
  simeChecks: string[];
  /** What you have to judge yourself, because no AI is watching. */
  selfCheck: string[];
  /** The ladder from Beginner to Professional for this skill. */
  progression: ProgressionStep[];
  /** Coach-level cues, pro self-monitoring habits, and the next-level variation. */
  proTips: string[];
  /** Optional knowledge check questions for flipped classroom implementation. */
  quiz?: LessonQuiz[];
  /** Optional structured pitch-verified practice for reading written notes. */
  noteReadingExercises?: NoteReadingExercise[];
}

export const lessonGuides: Record<string, LessonGuide> = {
  'breath-support': {
    objective:
      'Power your tone from steady airflow instead of throat tension, so notes stay even from start to finish.',
    why:
      'Every other skill rides on the breath. Steady airflow gives the vocal folds a stable cushion to vibrate over, and that is what keeps pitch and tone even rather than shaky. Master this first and everything else gets easier.',
    steps: [
      'Stand tall and breathe in low, letting your belly and lower ribs expand rather than your shoulders.',
      'Hiss out on a steady "sss" for as long as you can, keeping the volume dead even the whole time.',
      'Repeat, this time releasing the air more slowly so the hiss lasts longer without turning breathy.',
      'Now sing one comfortable note on "ah", supporting it with that same slow, even release of air.',
    ],
    drills: [
      {
        name: 'The long hiss',
        how: 'Breathe in low, then hiss on "sss" at one steady volume until you run out of air.',
        reps: '3 rounds. Time it and add a little each week, up to 25 to 30 seconds.',
      },
      {
        name: 'Straw phonation',
        how: 'Hum a comfortable note through a thin straw, or a lip "brrr", feeling steady back-pressure.',
        reps: '5 minutes, gliding gently up and down your range.',
      },
      {
        name: 'The four-count restart',
        how: 'On one breath, restart the same note cleanly every four counts, keeping the volume identical each time.',
        reps: '8 restarts per breath, 4 breaths.',
      },
    ],
    feelFor: [
      'Your lower ribs staying expanded as you sing, not collapsing right away.',
      'A steady, unwavering tone with no bumps in volume.',
    ],
    mistakes: [
      'Lifting the shoulders or chest to breathe in.',
      'Pushing a lot of air at the start, then running out before the note ends.',
    ],
    simeChecks: [
      'Whether the note holds a steady pitch while you sustain it.',
      'If the note stays in tune from the first moment to the last.',
    ],
    selfCheck: [
      'Where you feel the breath move (low, not up in the chest).',
      'That your throat stays relaxed and open, with no tightening.',
    ],
    progression: [
      { level: 'Beginner', marker: 'You can hiss for 10 seconds at an even volume without your chest collapsing.' },
      { level: 'Intermediate', marker: 'You hold a 15 second sung note with steady pitch and no wobble in volume.' },
      { level: 'Advanced', marker: 'You can swell one note from soft to loud to soft on a single breath, in tune.' },
      { level: 'Professional', marker: 'Support is automatic. You phrase long lines live without thinking about breath, and it never fails under nerves.' },
    ],
    proTips: [
      'Think in air pressure, not air volume: keep a constant, gentle compression rather than dumping breath at the start.',
      'Record yourself and find where the tone thins out, that is the exact moment your support dropped.',
      'Next level: sing a messa di voce, swelling one note from soft to loud and back on a single breath while it stays in tune.',
    ],
  },

  posture: {
    objective:
      'Set up a tall, balanced stance so your breath and tone have a clear path with nothing in the way.',
    why:
      'Alignment opens an unobstructed path for breath and sound. A slumped or braced body leaks air and adds tension that a listener hears as strain, so good posture is free tone quality.',
    steps: [
      'Place your feet about shoulder-width apart with your weight balanced over the middle of each foot.',
      'Stack your ribs over your hips, lengthen the spine, and let your shoulders settle back and down.',
      'Float your head level, chin neither tucked nor lifted, as if a string gently pulls the crown of your head up.',
      'Sing a few easy notes and notice whether anything tightens as you do.',
    ],
    drills: [
      {
        name: 'Wall stack',
        how: 'Stand with heels, hips, upper back, and head lightly touching a wall, step away keeping that shape, then sing.',
        reps: '4 notes, reset against the wall between each.',
      },
      {
        name: 'Rag doll roll-up',
        how: 'Hang loose bent at the waist, then roll up one vertebra at a time to standing and sing right away.',
        reps: '3 roll-ups, sing a phrase at the top of each.',
      },
      {
        name: 'Book balance',
        how: 'Balance a light book on your head and sing a scale without letting it drop.',
        reps: '2 minutes.',
      },
    ],
    feelFor: [
      'A tall, open feeling through the chest and neck.',
      'A loose jaw and loose shoulders while you sing.',
    ],
    mistakes: [
      'Locking the knees, which cuts off your support.',
      'Jutting the chin forward to reach higher notes.',
    ],
    simeChecks: [
      'That your sung notes stay in tune once you are set up.',
      'Steady pitch on held notes, a sign nothing is straining.',
    ],
    selfCheck: [
      'Your alignment in a mirror: ears over shoulders over hips.',
      'Whether any spot feels tense or braced.',
    ],
    progression: [
      { level: 'Beginner', marker: 'You can find a tall, balanced stance and notice when you are slumping.' },
      { level: 'Intermediate', marker: 'Your posture holds steady through a whole song, knees soft and chin level.' },
      { level: 'Advanced', marker: 'You keep alignment while moving and gesturing, not only standing still.' },
      { level: 'Professional', marker: 'Stage-ready posture is second nature, projecting confidence even while choreographed or seated.' },
    ],
    proTips: [
      'Set the body once, then forget it; re-checking posture mid-phrase only invents new tension.',
      'Film yourself from the side and confirm ears, shoulders, and hips stack in one line.',
      'Next level: sing while walking slowly to prove your support does not depend on standing rigid.',
    ],
  },

  'pitch-matching': {
    objective:
      'Train your ear and voice together so you land exactly on a target pitch and hold it there.',
    why:
      'Singing in tune is a feedback loop between your ear and your voice. Training both at once turns guessing into landing the note on purpose, which is the foundation every audience hears first.',
    steps: [
      'Play or clearly imagine a reference note in a comfortable part of your range.',
      'Hum it back gently, then open the hum into "ah" on the same pitch.',
      'Watch the readout and nudge your voice until it reads in tune, within a few cents of the target.',
      'Hold that note steady, then try matching notes a step above and a step below it.',
    ],
    drills: [
      {
        name: 'Call and echo',
        how: 'Play a note, sing it back on "ah", and adjust until the meter reads inside 5 cents.',
        reps: '15 random notes across your comfortable range.',
      },
      {
        name: 'Blind match',
        how: 'Cover the screen, match the note by ear, then reveal the reading to score yourself.',
        reps: '10 notes. Log how many land in tune and chase the number up.',
      },
      {
        name: 'Interval climb',
        how: 'From one reference note, sing up a 2nd, 3rd, 4th, then 5th, checking each against the meter.',
        reps: '2 passes up and down.',
      },
    ],
    feelFor: [
      'The moment the pitch locks in and suddenly feels effortless.',
      'Small adjustments to find the note rather than big swoops.',
    ],
    mistakes: [
      'Scooping up to the note from below instead of landing right on it.',
      'Going sharp because you are pushing too hard.',
    ],
    simeChecks: [
      'The exact note you are singing.',
      'How many cents sharp or flat you are.',
      'Whether you reach the in-tune zone and hold it steady.',
    ],
    selfCheck: [
      'Whether you can hear the match before you see it confirmed.',
      'That your tone stays relaxed while matching, with no strain.',
    ],
    progression: [
      { level: 'Beginner', marker: 'You can match single notes in your comfortable range to within 5 cents.' },
      { level: 'Intermediate', marker: 'You match notes across your full range and hear when you are sharp or flat before checking.' },
      { level: 'Advanced', marker: 'You sing intervals and simple melodies in tune without a reference drone.' },
      { level: 'Professional', marker: 'You stay locked in tune a cappella, in harmony, and against a band, correcting instantly.' },
    ],
    proTips: [
      'Pre-hear the note: audiate the pitch silently first, then sing, and the cents reading should already be close.',
      'Cover the screen, match by ear, then reveal the reading to test your ear against the meter.',
      'Next level: match intervals, not just unisons, singing a 3rd, 5th, and octave above the reference and checking each.',
    ],
  },

  'resonance-basics': {
    objective:
      'Find the spaces where your voice rings freely so your tone carries without extra effort.',
    why:
      'Resonance is free volume. By shaping the spaces above the vocal folds you amplify the sound with almost no extra effort, which is how trained singers fill a room without ever shouting.',
    steps: [
      'Hum gently and feel for a buzz around your lips, nose, and cheeks.',
      'Keep that buzz, then open slowly into "mah", trying to carry the ring with you.',
      'Sing a comfortable note on different vowels (ee, eh, ah, oh, oo) and notice which ones ring most.',
      'Shape your mouth and soft palate to keep the brightest, easiest ring across every vowel.',
    ],
    drills: [
      {
        name: 'Buzz to vowel',
        how: 'Hum until your face buzzes, then open to "mah" keeping that buzz alive in the tone.',
        reps: '5 notes through your low to mid range.',
      },
      {
        name: 'Bright "nay"',
        how: 'Sing a bright, forward "nay-nay-nay" up a 5-note scale to find front resonance, then soften without losing the ring.',
        reps: '4 scales.',
      },
      {
        name: 'Vowel morph',
        how: 'Hold one pitch and slowly morph ee-eh-ah-oh-oo without losing the ring or the pitch.',
        reps: '3 held notes.',
      },
    ],
    feelFor: [
      'A buzzing, ringing sensation in the front of your face.',
      'The tone getting louder without you pushing any harder.',
    ],
    mistakes: [
      'Pushing from the throat to get more volume.',
      'Letting the sound fall back and turn muffled.',
    ],
    simeChecks: [
      'That your pitch stays steady and in tune as you change vowels.',
      'The note you are holding throughout the exercise.',
    ],
    selfCheck: [
      'Where you feel the buzz in your face.',
      'Which vowels ring easiest for you, since Sime does not grade tone quality.',
    ],
    progression: [
      { level: 'Beginner', marker: 'You can feel and find the buzz in the front of your face.' },
      { level: 'Intermediate', marker: 'You keep the ring across all five vowels on one pitch.' },
      { level: 'Advanced', marker: 'You shift between bright and warm tone colours at will while staying in tune.' },
      { level: 'Professional', marker: 'You shape resonance to cut through a band or float a ballad, the same way in any room.' },
    ],
    proTips: [
      'Aim the sound at a single point in the room; resonance is about focus, not force.',
      'Hum then sing the same note and feel the buzz stay put; if it falls back, you lost the placement.',
      'Next level: hold one pitch and morph ee-eh-ah-oh-oo, keeping the ring and the in-tune reading steady.',
    ],
  },

  'mixed-voice': {
    objective:
      'Blend chest and head voice so you can move through your break without a flip or a crack.',
    why:
      'The break between chest and head voice is where most singers crack. A blended middle, called mixed voice, is the single biggest unlock for range and for high notes that sound powerful instead of strained.',
    steps: [
      'Pick a slide (a siren) on "ng" or "wee" from a low note up through your break and back down.',
      'Keep the volume moderate and even; do not get louder as you climb.',
      'As you near the break, think "lighter and taller" instead of "push harder".',
      'Repeat across small ranges, smoothing the transition until the flip disappears.',
    ],
    drills: [
      {
        name: 'Sirens',
        how: 'Slide on "ng" or "wee" from low to high and back through your break, light and even, no volume spikes.',
        reps: '6 slides.',
      },
      {
        name: 'Octave "gee"',
        how: 'Sing "gee" jumping up an octave through the break, keeping the top note light, then move up by half steps.',
        reps: '5 jumps.',
      },
      {
        name: 'Lip-trill scales',
        how: 'Lip-trill a one and a half octave scale through the break to keep the larynx relaxed.',
        reps: '4 scales up and down.',
      },
    ],
    feelFor: [
      'An even tone through the break with no sudden jump in volume.',
      'The note tilting lighter as you ascend, not heavier.',
    ],
    mistakes: [
      'Yelling or dragging chest voice up too high.',
      'Cracking because you cut your support right at the break.',
    ],
    simeChecks: [
      'Whether each note through the slide stays in tune.',
      'The notes you pass through and exactly where the pitch wobbles.',
    ],
    selfCheck: [
      'The smoothness of your tone across the break, with no audible flip.',
      'Your strain level; the throat should stay free the whole way.',
    ],
    progression: [
      { level: 'Beginner', marker: 'You can siren through your break without a hard flip or crack.' },
      { level: 'Intermediate', marker: 'You sustain notes on both sides of the break with even volume.' },
      { level: 'Advanced', marker: 'You sing songs across the break with no audible gear change.' },
      { level: 'Professional', marker: 'Your mix is seamless and powerful; high notes sound effortless and reliable every night.' },
    ],
    proTips: [
      'Coaches cue "same weight both sides of the break"; the note must not get heavier up or lighter down.',
      'Slow the siren to a crawl through the break; any flip or volume bump you hear marks the spot to drill.',
      'Next level: sing a song phrase that crosses your break and keep the pitch line clean all the way through.',
    ],
  },

  belting: {
    objective:
      'Produce a strong, bright high sound using breath support and resonance, never throat force.',
    why:
      'A belt is a high, resonant, supported sound, not a loud yell. Done right it is thrilling and safe; done wrong it strains and can injure the voice, so technique here is not optional.',
    steps: [
      'Warm up your mixed voice first so the bridge into the high range is already smooth.',
      'On a bright vowel like "eh" or "ah", call out a mid-high note as if calling a friend across a street.',
      'Keep low, firm breath support and let resonance carry the sound, not a squeezed throat.',
      'Add notes one step at a time, only while it stays comfortable, and stop the moment it strains.',
    ],
    drills: [
      {
        name: 'Calling "hey"',
        how: 'Call out "hey!" up to a mid-high note like hailing a friend across a street, bright and supported.',
        reps: '8 calls, only as high as stays easy.',
      },
      {
        name: 'Sustained belt holds',
        how: 'Belt one note and hold it in tune for a steady count, then release cleanly.',
        reps: '5 holds of 4 counts. Stop at once if it strains.',
      },
      {
        name: 'Step-up belts',
        how: 'Belt a note, then the next half step up, climbing only while it stays comfortable.',
        reps: '1 climb, retreat at the first sign of strain.',
      },
    ],
    feelFor: [
      'Power coming from your breath and the ring of the tone, not a tight throat.',
      'An open, tall feeling even on the loud high notes.',
    ],
    mistakes: [
      'Squeezing the throat to get volume.',
      'Pushing past strain instead of backing off.',
    ],
    simeChecks: [
      'That the belted note is in tune, since belting often drifts sharp.',
      'Pitch stability while you hold the loud note.',
    ],
    selfCheck: [
      'Your throat comfort; never push through any pain.',
      'Whether your support stays low and steady under the note.',
    ],
    progression: [
      { level: 'Beginner', marker: 'You can make a bright, supported "call" sound without pushing from the throat.' },
      { level: 'Intermediate', marker: 'You belt comfortably in a small high range and stop before any strain.' },
      { level: 'Advanced', marker: 'You belt full phrases in tune with stamina across several lines.' },
      { level: 'Professional', marker: 'You hit money notes show after show, in tune, with no strain or vocal fatigue.' },
    ],
    proTips: [
      'A belt is a high, supported call, not a loud chest note; if it feels like yelling, back off.',
      'Belting drifts sharp under adrenaline, so watch the cents and pull back to centre rather than pushing higher.',
      'Next level: build stamina by holding the belt note in tune for full steady counts before adding notes above it.',
    ],
  },

  vibrato: {
    objective:
      'Develop a free, even vibrato, and learn to switch it on or hold a straight tone at will.',
    why:
      'A free vibrato is the signature of a relaxed, well-supported voice. Being able to switch it on or off is a large part of what makes a tone sound professional rather than amateur.',
    steps: [
      'Sing a sustained, comfortable note with full and relaxed support.',
      'Allow the pitch to gently oscillate; do not force a wobble, just let it appear as the throat frees up.',
      'Practise a dead-straight tone, then ease into vibrato on that same note.',
      'Aim for an even, steady rate rather than a fast tremble or a slow wobble.',
    ],
    drills: [
      {
        name: 'Let it bloom',
        how: 'Sustain a supported note and simply allow vibrato to appear, without forcing any shake.',
        reps: '6 notes. Allow, do not push.',
      },
      {
        name: 'Pulse control',
        how: 'Sing deliberate pitch pulses slowly, then speed them up toward an even 5 to 7 per second.',
        reps: '4 notes, slow to fast.',
      },
      {
        name: 'Straight to vibrato',
        how: 'Hold 2 beats of straight tone, then 2 beats of vibrato, on one pitch, with the centre not drifting.',
        reps: '5 notes.',
      },
    ],
    feelFor: [
      'A relaxed, even pulse rather than a forced shake.',
      'Vibrato that only starts after a steady, supported tone is going.',
    ],
    mistakes: [
      'Manufacturing a wobble with the jaw or throat.',
      'An uneven or too-fast rate that comes from tension.',
    ],
    simeChecks: [
      'The centre pitch of the note, since good vibrato sits around the true pitch.',
      'Whether the note stays centred and in tune overall.',
    ],
    selfCheck: [
      'The evenness and speed of the vibrato, which Sime does not grade.',
      'That it grows from a free, supported tone rather than from tension.',
    ],
    progression: [
      { level: 'Beginner', marker: 'A natural vibrato appears when you fully relax a supported note.' },
      { level: 'Intermediate', marker: 'You can start a note straight and ease into vibrato on purpose.' },
      { level: 'Advanced', marker: 'You control vibrato rate and width while keeping the centre pitch in tune.' },
      { level: 'Professional', marker: 'You use straight tone and vibrato as deliberate stylistic choices, on demand.' },
    ],
    proTips: [
      'Vibrato is a release, not an action: set a free, supported tone and let it bloom rather than "doing" it.',
      'Count the pulses per second; a natural rate is roughly 5 to 7, and faster usually means tension.',
      'Next level: alternate two beats straight, two beats vibrato on one pitch, without the centre note drifting.',
    ],
  },

  agility: {
    objective:
      'Move quickly and cleanly between notes so scales and runs stay crisp and in tune.',
    why:
      'Agility is coordination at speed. Clean runs and riffs come from light, breath-driven articulation, and they are a big part of what separates a stylish singer from a stiff one.',
    steps: [
      'Start a five-note scale slowly on "ah", one clear note per beat.',
      'Keep each note distinct; do not slide or smear from one into the next.',
      'Speed up gradually, but only while every note still lands clean and in tune.',
      'Try short runs and arpeggios, dropping back to slow practice the moment notes blur.',
    ],
    drills: [
      {
        name: 'Slow scale ladder',
        how: 'Sing a 5-note scale on "ah", one clean note per beat, then speed up one notch only when it is perfect.',
        reps: '5 tempos. Drop back a notch if notes blur.',
      },
      {
        name: 'Three-note turns',
        how: 'Sing quick 3-note turns (do-re-do, re-mi-re) cleanly, then chain them into a longer line.',
        reps: '8 turns, then one connected run.',
      },
      {
        name: 'Arpeggio pops',
        how: 'Sing a light staccato arpeggio (1-3-5-8) using small "h" impulses from the breath, larynx still.',
        reps: '4 up and down.',
      },
    ],
    feelFor: [
      'Each pitch landing cleanly with a light, even tone.',
      'Steady support staying underneath the fast notes.',
    ],
    mistakes: [
      'Smearing notes together instead of articulating each one.',
      'Tensing up and rushing as the tempo climbs.',
    ],
    simeChecks: [
      'Whether individual sustained notes in the pattern land in tune.',
      'The note you are on when you hold one to check it.',
    ],
    selfCheck: [
      'The cleanness and separation of fast notes, since Sime reads one steady pitch at a time, not rapid runs.',
      'The evenness of your rhythm.',
    ],
    progression: [
      { level: 'Beginner', marker: 'You can sing a slow 5-note scale cleanly and in tune.' },
      { level: 'Intermediate', marker: 'You sing faster scales and simple turns without smearing the notes.' },
      { level: 'Advanced', marker: 'You execute runs and arpeggios at tempo, light and accurate.' },
      { level: 'Professional', marker: 'You improvise riffs and runs in tune and in time as a personal stylistic signature.' },
    ],
    proTips: [
      'Articulate runs from the breath with light "h" impulses, keeping the larynx still rather than chopping with the throat.',
      'Slow a run to half speed and confirm each note hits its pitch; speed only hides errors.',
      'Next level: take a run up and back down in one breath, staying light and in tune, then add a note to the pattern.',
    ],
  },

  phrasing: {
    objective:
      'Shape lines with breath, volume, and timing so your singing sounds musical instead of flat.',
    why:
      'Phrasing is how raw notes become music. Where you breathe, where you swell, and how you bend time are what make a line feel alive instead of robotic.',
    steps: [
      'Pick a short phrase from a song you know well.',
      'Plan where you will breathe so you never run out of air mid-line.',
      'Decide which words to grow louder or softer on, and where to ease the timing.',
      'Sing it through, exaggerating the dynamics, then dial them back to taste.',
    ],
    drills: [
      {
        name: 'Breath map',
        how: 'Mark every breath in a verse on the lyric sheet, then sing it breathing only at those marks.',
        reps: '2 verses.',
      },
      {
        name: 'Dynamic arc',
        how: 'Choose the peak word of a phrase, build a crescendo up to it, then release after it.',
        reps: '4 phrases.',
      },
      {
        name: 'Speak then sing',
        how: 'Speak the lyric with full expression, then sing it copying that exact shape.',
        reps: '3 phrases.',
      },
    ],
    feelFor: [
      'A natural rise and fall, like speaking with real feeling.',
      'Breaths planned at the ends of phrases, not in the middle of a word.',
    ],
    mistakes: [
      'Singing every word at the exact same volume.',
      'Breathing in awkward spots that break up the line.',
    ],
    simeChecks: [
      'That the notes within the phrase stay in tune as you add dynamics.',
      'Pitch on the sustained words.',
    ],
    selfCheck: [
      'The musical shape, your breath placement, and your timing, none of which Sime grades.',
      'Whether the line actually feels expressive.',
    ],
    progression: [
      { level: 'Beginner', marker: 'You breathe at sensible spots and do not run out of air mid-line.' },
      { level: 'Intermediate', marker: 'You add basic dynamics, louder and softer, on purpose.' },
      { level: 'Advanced', marker: 'You shape arcs and bend timing while keeping pitch and pulse honest.' },
      { level: 'Professional', marker: 'Your phrasing is a signature that makes a familiar song sound new.' },
    ],
    proTips: [
      'Map the phrase before singing: mark the peak word, the breath, and the release, then sing the plan, not the notes.',
      'Speak the lyric with the dynamics first; if it sounds musical spoken, it will sing musically.',
      'Next level: borrow time on the important word, then resolve back so pitch and pulse stay honest.',
    ],
  },

  'stage-presence': {
    objective:
      'Manage nerves and connect with an audience so your voice comes through with confidence.',
    why:
      'An audience feels your state before they judge your notes. Managing nerves and connecting with people is what turns a good vocal take into a real performance.',
    steps: [
      'Before you sing, take a few slow, low breaths to settle your body.',
      'Stand grounded and tall, using the same posture you practised.',
      'Pick a focal point, or imagine one listener, and sing directly to them.',
      'Run the song start to finish without stopping, treating any slip as just part of the take.',
    ],
    drills: [
      {
        name: 'Box breathing',
        how: 'Before singing, breathe in for 4, hold for 4, out for 4, hold for 4 to calm the nervous system.',
        reps: '4 cycles.',
      },
      {
        name: 'One-take run',
        how: 'Perform a full song start to finish on camera without stopping for any mistakes.',
        reps: '1 take, then watch it back.',
      },
      {
        name: 'Eye targets',
        how: 'Sing to three fixed points (left, centre, right) as if each were a real person.',
        reps: '1 song, rotating targets per phrase.',
      },
    ],
    feelFor: [
      'Your breathing slowing and your shoulders loosening as the nerves settle.',
      'Your eyes up and out, not pointed down at your feet.',
    ],
    mistakes: [
      'Holding your breath when the nerves hit.',
      'Stopping and restarting at every tiny mistake.',
    ],
    simeChecks: [
      'That your pitch holds up while you perform, since nerves often push it sharp or flat.',
      'The steadiness of your sustained notes under pressure.',
    ],
    selfCheck: [
      'Your confidence, eye focus, and body language, because Sime cannot see you.',
      'Whether you pushed through the whole song without stopping.',
    ],
    progression: [
      { level: 'Beginner', marker: 'You can sing a full song for one listener without stopping.' },
      { level: 'Intermediate', marker: 'You manage nerves with breathing and keep your eye focus up and out.' },
      { level: 'Advanced', marker: 'You connect with a small audience and recover from slips invisibly.' },
      { level: 'Professional', marker: 'You command a room, absorb mistakes seamlessly, and perform consistently under pressure.' },
    ],
    proTips: [
      'Rehearse the performance, not just the song: entrances, eye lines, and how you recover from a mistake.',
      'Record a full run in one take and watch it back, since you are auditing presence, which Sime cannot see.',
      'Next level: practise mistake recovery, intentionally flub a note, keep going in tune, and never signal the error.',
    ],
  },

  'mic-technique': {
    objective:
      'Use a microphone so your tone stays even and clear across both soft and loud singing.',
    why:
      'On stage and in the studio the microphone is part of your instrument. Good mic control keeps your tone even and lets you shape dynamics the audience actually hears.',
    steps: [
      'Hold the mic a few inches from your mouth, aimed straight at your lips.',
      'On loud or high notes, pull it slightly back to avoid distortion.',
      'On soft passages, bring it a little closer to keep your presence.',
      'Practise moving it smoothly so the volume a listener hears stays even.',
    ],
    drills: [
      {
        name: 'Distance dynamics',
        how: 'Sing soft with the mic close and loud with it pulled back, keeping the heard volume even.',
        reps: '4 phrases, exaggerate the moves first.',
      },
      {
        name: 'Plosive control',
        how: 'Sing words full of "p" and "b" with the mic angled slightly off to one side to stop pops.',
        reps: '2 minutes, then listen back.',
      },
      {
        name: 'Playback check',
        how: 'Record into the mic, then judge tone and pops on the actual playback system, not at your mouth.',
        reps: '1 recording per session.',
      },
    ],
    feelFor: [
      'A consistent loudness to a listener even as you sing louder or softer.',
      'No popping on your "p" and "b" sounds.',
    ],
    mistakes: [
      'Keeping the mic at one fixed distance through big changes in volume.',
      'Singing across the top of the mic so it loses presence.',
    ],
    simeChecks: [
      'That your sung pitch is still detected clearly, since a well-placed mic gives a cleaner reading.',
      'The note you are holding.',
    ],
    selfCheck: [
      'The evenness of your loudness and the absence of pops, which recording yourself reveals.',
      'Your mic distance as the dynamics change.',
    ],
    progression: [
      { level: 'Beginner', marker: 'You hold the mic at a steady distance and aim it at your mouth.' },
      { level: 'Intermediate', marker: 'You move the mic to even out soft and loud singing.' },
      { level: 'Advanced', marker: 'You control plosives and use distance for dynamics smoothly.' },
      { level: 'Professional', marker: 'Mic technique is invisible and instinctive, in any venue or studio, every time.' },
    ],
    proTips: [
      'Treat the mic as part of the instrument: distance is your volume knob, so sing the dynamics with your arm.',
      'Judge mic technique on the actual playback system, at the speaker, not at your mouth.',
      'Next level: angle slightly off-axis on plosives so "p" and "b" stop popping while presence stays full.',
    ],
  },

  interpretation: {
    objective:
      'Make a song your own by choosing what each line means and how you want to deliver it.',
    why:
      'Interpretation is artistry, and it is the final step to diva or divo level. Two singers can hit the same notes; the one with clear intention and personal choices is the one an audience remembers.',
    steps: [
      'Read the lyrics out loud and decide what the song is about for you.',
      'Mark which words carry the most meaning in each line.',
      'Choose tone and dynamics that fit that meaning: soft and close, or open and full.',
      'Sing it through committing fully to those choices, then refine whatever does not feel honest.',
    ],
    drills: [
      {
        name: 'Lyric meaning pass',
        how: 'Read the lyric aloud, then write one sentence on what the song means to you.',
        reps: '1 per song you are learning.',
      },
      {
        name: 'Keyword colours',
        how: 'Underline the key word in each line and assign it a tone: soft, fierce, aching, joyful.',
        reps: '1 verse and 1 chorus.',
      },
      {
        name: 'Three deliveries',
        how: 'Sing one line three different emotional ways, then keep the most honest version.',
        reps: '3 lines.',
      },
    ],
    feelFor: [
      'A clear intention sitting behind each phrase.',
      'A delivery that shifts with the meaning rather than staying one flat mood.',
    ],
    mistakes: [
      'Singing the notes correctly but with no intention behind them.',
      'Copying another singer instead of making your own choice.',
    ],
    simeChecks: [
      'That the melody stays in tune while you focus on the expression.',
      'Pitch on the held notes.',
    ],
    selfCheck: [
      'Your emotional delivery and storytelling, which Sime does not judge.',
      'Whether the interpretation feels true to you.',
    ],
    progression: [
      { level: 'Beginner', marker: 'You can say what a song is about and sing it with basic intention.' },
      { level: 'Intermediate', marker: 'You make deliberate tone and dynamic choices that fit the meaning.' },
      { level: 'Advanced', marker: 'You tell a story across a whole song with a consistent point of view.' },
      { level: 'Professional', marker: 'You make any song unmistakably yours and move an audience, the true mark of a diva or divo.' },
    ],
    proTips: [
      'Make a specific choice per line: who are you singing to, and why now? Vague intention reads as flat.',
      'Try three deliveries of the same line and keep the most honest one, not the most impressive one.',
      'Next level: once the story is set, protect the pitch, because emotion is never an excuse to go flat.',
    ],
  },

  'onset-control': {
    objective:
      'Start every note cleanly, with the vocal folds closing at the same moment the air arrives, so there is no scoop, no breathy leak, and no hard click.',
    why:
      'How a note begins sets its whole quality. A balanced onset (the folds meeting airflow evenly) is the efficient middle ground between a breathy onset, where air escapes before the folds close, and a hard glottal onset, where the folds slam shut and you hear a click. That balance, sometimes called flow phonation, turns the most breath into tone with the least effort.',
    steps: [
      'Sigh gently on "ah" to feel an airy, breathy start where air leads the tone.',
      'Now say a light "uh-oh", noticing the small catch as the folds close: that is a firm onset.',
      'Aim between the two: think the vowel and let breath and tone begin together, no air-first, no click.',
      'Sing short, separated "ah" notes on one comfortable pitch, each starting clean and on the centre of the note.',
    ],
    drills: [
      {
        name: 'Staccato "ah"',
        how: 'Sing five short, detached "ah" notes on one pitch, each with a clean, balanced onset and a clear stop.',
        reps: '5 notes per breath, 4 breaths, low to mid range.',
      },
      {
        name: 'Onset compare',
        how: 'Sing the same note three ways: breathy start, hard start, then balanced. Keep only the balanced one.',
        reps: '3 cycles, twice a day.',
      },
      {
        name: 'Staccato to legato',
        how: 'Sing three staccato notes, then hold the fourth, keeping the same clean onset on the held note.',
        reps: '4 sets across a comfortable five-note range.',
      },
    ],
    feelFor: [
      'Tone and breath beginning at the same instant, with no puff of air first.',
      'No click or pinch in the throat at the start of the note.',
    ],
    mistakes: [
      'Scooping up from under the note instead of starting on its centre.',
      'Pushing hard for a "strong" start, which presses the folds and tires the voice.',
    ],
    simeChecks: [
      'Whether the note lands on its true pitch immediately, rather than scooping up to it.',
      'If the pitch holds steady right from the first moment of the note.',
    ],
    selfCheck: [
      'Whether the start feels airy, clicky, or clean: only you can hear the breath.',
      'That your throat stays relaxed with no squeeze at the onset.',
    ],
    progression: [
      { level: 'Beginner', marker: 'You can tell a breathy start from a hard one and produce each on purpose.' },
      { level: 'Intermediate', marker: 'You start most notes cleanly on pitch, with no scoop, at a comfortable volume.' },
      { level: 'Advanced', marker: 'You keep a balanced onset across your range and at soft and loud volumes.' },
      { level: 'Professional', marker: 'Clean onsets are automatic in any style, from a whispered intro to a full belt, with no clicks or air.' },
    ],
    proTips: [
      'Think "flow, not force": the goal is the most tone for the least air and effort, not a louder attack.',
      'A tiny, silent "h" thought before the vowel cures a clicky onset without making it breathy.',
      'Next level: start a note dead quiet with a clean onset, then swell it, the hardest onset control there is.',
    ],
  },

  'vowels-formants': {
    objective:
      'Shape consistent, resonant vowels so every vowel rings on the same focused tone, and learn to modify them slightly as you climb so high notes stay free.',
    why:
      'The vocal folds make the pitch; the throat and mouth shape it into a vowel by tuning resonances called formants. If each vowel uses a wildly different shape, your tone jumps around and high notes get stuck. Tuning vowels toward a common, forward resonance, and narrowing them slightly up high (vowel modification), is how pros keep an even, ringing sound across the range.',
    steps: [
      'Sing the five Italian vowels "ee, eh, ah, oh, oo" on one comfortable note, keeping the tone equally bright on each.',
      'Start from "ee", which finds forward resonance easily, and carry that ring into the other vowels.',
      'Sing a five-note pattern (1-2-3-4-5-4-3-2-1) on "ah", listening for one consistent tone.',
      'As you go higher, let the vowel round slightly toward its neighbour ("ah" toward "uh"/"oh") so the throat stays open.',
    ],
    drills: [
      {
        name: 'Vowel ladder',
        how: 'On one note, cycle "ee-eh-ah-oh-oo" keeping volume and ring identical on every vowel.',
        reps: '2 times per note, on 4 pitches across your comfortable range.',
      },
      {
        name: 'Five-note vowel scale',
        how: 'Sing 1-2-3-4-5-4-3-2-1 on a single vowel, moving up by a semitone each time.',
        reps: '5 keys up, then back down. Use the practice tool to keep each note in tune.',
      },
      {
        name: 'Modify on the climb',
        how: 'Sing an "ah" scale into your upper range, gradually rounding "ah" toward "uh" as it rises.',
        reps: '3 ascents, stopping below any strain.',
      },
    ],
    feelFor: [
      'A buzzy, forward ring (in the mask of the face) that stays on every vowel.',
      'The throat staying open and steady as vowels change.',
    ],
    mistakes: [
      'Spreading "ee" and "ah" wide and bright on high notes, which jams the top.',
      'Letting the tone go dull and swallowed on "oh" and "oo".',
    ],
    simeChecks: [
      'Whether the pitch stays steady and centred as you change vowels on one note.',
      'If each note of the vowel scale lands in tune.',
    ],
    selfCheck: [
      'The resonance and ring of each vowel, which Sime cannot hear.',
      'Whether the vowel is modifying smoothly up high or collapsing.',
    ],
    progression: [
      { level: 'Beginner', marker: 'You can sing all five vowels on one pitch without the tone lurching around.' },
      { level: 'Intermediate', marker: 'Your vowels share a consistent ring through the middle of your range.' },
      { level: 'Advanced', marker: 'You modify vowels through the upper range so high notes stay open and free.' },
      { level: 'Professional', marker: 'Vowel tuning is automatic and invisible: the word stays clear while the tone stays ideal on every pitch.' },
    ],
    proTips: [
      'Record one note on all five vowels and match their brightness; the odd one out shows your weak shape.',
      'High and loud wants a slightly taller, rounder vowel; forcing the spoken shape up there is what cracks it.',
      'Next level: keep lyrics intelligible while modifying, so listeners hear the word but you sing the ideal vowel.',
    ],
  },

  'passaggio-bridging': {
    objective:
      'Move through the passaggio (the bridge between chest and head) without a crack or a sudden jump in weight, so your range feels like one connected instrument.',
    why:
      'Around the passaggio, the work hands off between two muscle systems: the TA muscle that thickens the folds for chest, and the CT muscle that stretches them for head. If you carry full chest weight too high, the voice cracks or flips. Bridging means gradually lightening and letting the stretch take over, so the change is smooth instead of a gear-grinding break.',
    steps: [
      'Find your break: glide slowly up an "ee" until the voice wants to flip. That zone is your passaggio.',
      'Slide gently through that zone on a light "ng" or "gee", letting the tone thin rather than louder.',
      'Use a semi-occluded sound (lip trill or straw) to glide across the bridge with steady back-pressure.',
      'Sing a slow five-note pattern that sits right across the bridge, keeping the volume even the whole way.',
    ],
    drills: [
      {
        name: 'Lip-trill sirens',
        how: 'On a lip trill or straw, slide smoothly from below the bridge to above it and back, no break.',
        reps: '5 slides, twice a day.',
      },
      {
        name: '"Gee" or "nay" through the bridge',
        how: 'Sing a 1-3-5-3-1 pattern on "gee" or "nay" centred on your break, lightening as you rise.',
        reps: '5 keys climbing by semitone, staying connected.',
      },
      {
        name: 'Octave-and-a-half slide',
        how: 'Glide a slow "oo" through the whole bridge on one breath, aiming for zero gear-change.',
        reps: '4 slides, soft to medium.',
      },
    ],
    feelFor: [
      'A gradual lightening through the bridge, not a sudden drop or jump in effort.',
      'The tone staying connected, with no breathy gap where chest used to be.',
    ],
    mistakes: [
      'Pushing more volume into the bridge to "power through", which guarantees a crack.',
      'Flipping straight into disconnected falsetto instead of a gradual blend.',
    ],
    simeChecks: [
      'Whether your pitch glides smoothly through the bridge with no sudden octave jump (a sign of a break).',
      'If you can hold a steady pitch on notes right in your passaggio.',
    ],
    selfCheck: [
      'Whether the weight is lightening gradually, which is a feel only you have.',
      'That the tone stays connected and does not turn breathy across the bridge.',
    ],
    progression: [
      { level: 'Beginner', marker: 'You can find where your voice breaks and slide through it on a lip trill.' },
      { level: 'Intermediate', marker: 'You sing across the bridge on "gee" or "nay" without an obvious crack.' },
      { level: 'Advanced', marker: 'You move through the passaggio on open vowels at a musical volume, connected throughout.' },
      { level: 'Professional', marker: 'The bridge is seamless in any song: listeners never hear where chest becomes head.' },
    ],
    proTips: [
      'Think "less is more" exactly at the break: take weight off rather than adding push.',
      'A slightly rounder vowel through the bridge buys you a free passage; the spoken-shape vowel is what snags.',
      'Next level: belt up to the bridge then bloom into a connected mix above it, the hallmark of a pro top voice.',
    ],
  },

  'runs-riffs': {
    objective:
      'Sing fast melodic runs and riffs (melisma) with each note clearly in tune and evenly timed, instead of a vague slide between pitches.',
    why:
      'A run is just a scale sung fast, and the ear still wants to hear every individual note land. The skill is agility: light, precise fold action that articulates each pitch, plus rhythmic evenness so the run sits in the groove. Slow, deliberate practice wires the accuracy; speed comes after the notes are clean.',
    steps: [
      'Pick a short scale fragment (five notes) and sing it slowly on "ah", landing each note dead in tune.',
      'Add a light bounce so each note is distinct, not smeared into the next.',
      'Speed it up one notch at a time, only as fast as you can keep every note clean.',
      'Take a riff from a song you love, slow it to half speed, learn the exact notes, then bring it up to tempo.',
    ],
    drills: [
      {
        name: 'Slow-to-fast scale',
        how: 'Sing a five-note run on "ah", repeating it faster each pass while keeping every note in tune.',
        reps: '4 speeds, low to mid range.',
      },
      {
        name: 'Riff transcription',
        how: 'Loop a favourite riff at half speed, match it note for note, then rebuild it to full tempo.',
        reps: '1 riff per session, 10 minutes.',
      },
      {
        name: 'Metronome ladder',
        how: 'Run a short lick on the beat at a slow tempo, raising the tempo only when it is clean.',
        reps: '5 tempo steps, stop where it smears.',
      },
    ],
    feelFor: [
      'Each note of the run sounding as a separate pitch, not a slide.',
      'A relaxed throat and light delivery, with the agility coming from ease, not force.',
    ],
    mistakes: [
      'Smearing through the run so the middle notes blur together.',
      'Tensing the throat to go faster, which makes runs sloppy and tiring.',
    ],
    simeChecks: [
      'Whether the notes you hold in a slowed-down run are actually in tune.',
      'If start and end pitches of a run land where you intend.',
    ],
    selfCheck: [
      'Whether every note of a fast run is articulated, which needs your own ear at speed.',
      'The rhythmic evenness and groove of the riff.',
    ],
    progression: [
      { level: 'Beginner', marker: 'You can sing a slow five-note run with each note in tune.' },
      { level: 'Intermediate', marker: 'You sing simple riffs at a moderate tempo with clear, separated notes.' },
      { level: 'Advanced', marker: 'You execute fast runs cleanly and place them in time with the groove.' },
      { level: 'Professional', marker: 'You improvise accurate, tasteful runs live, fast and clean, as expression rather than decoration.' },
    ],
    proTips: [
      'Practise runs slow and exact; speed is a by-product of accuracy, never a substitute for it.',
      'Articulate lightly from the breath, not by pulsing the throat, to keep fast runs free.',
      'Next level: taste over flash. Place a short, perfect riff where it serves the song, not everywhere you can.',
    ],
  },

  'vocal-health': {
    objective:
      'Keep your voice healthy for the long run with hydration, rest, sensible dosing, and a proper warm-down, so you can sing for life and not just today.',
    why:
      'The vocal folds are delicate tissue that vibrate hundreds of times a second. They work best hydrated, rested, and warmed down after hard use. Pushing a tired or dry voice is how strain and injury start. Treating your voice like an athlete treats their body, warm up, train, cool down, recover, is what keeps it free and lasting.',
    steps: [
      'Hydrate steadily through the day; the folds need water hours ahead, not just before you sing.',
      'Warm up before hard singing and never start cold (see the warm-up routine).',
      'After heavy singing, warm down: gentle descending hums and lip trills to release the folds.',
      'Respect rest: if your voice is tired, hoarse, or sore, back off and let it recover rather than pushing.',
    ],
    drills: [
      {
        name: 'Descending warm-down',
        how: 'Hum or lip-trill gently from a comfortable note down to your low range, light and easy.',
        reps: '3 minutes after any demanding session.',
      },
      {
        name: 'Straw cool-down',
        how: 'Phonate softly through a straw on slow descending slides to release fold pressure.',
        reps: '2 minutes, very gentle.',
      },
      {
        name: 'Hydration habit',
        how: 'Keep water nearby and sip throughout practice; aim for pale, not dark, urine as your gauge.',
        reps: 'All day, every singing day.',
      },
    ],
    feelFor: [
      'A voice that feels released and easy after the warm-down, not tight or raspy.',
      'No soreness, scratchiness, or tiredness lingering the next morning.',
    ],
    mistakes: [
      'Singing hard with no warm-up or warm-down.',
      'Powering through hoarseness or pain instead of resting (pain is a stop sign, not a challenge).',
      'Relying on throat sprays or clearing instead of hydration and rest.',
    ],
    simeChecks: [
      'During the warm-down, whether your descending pitch stays steady and controlled.',
      'Sime measures pitch only; it cannot assess vocal health, so the rest is yours to monitor.',
    ],
    selfCheck: [
      'How your voice and throat feel during and after singing, and the next day.',
      'Your hydration, sleep, and whether you are dosing hard singing sensibly.',
    ],
    progression: [
      { level: 'Beginner', marker: 'You warm up before and warm down after singing, and you hydrate on singing days.' },
      { level: 'Intermediate', marker: 'You notice early signs of fatigue and adjust instead of pushing through.' },
      { level: 'Advanced', marker: 'You manage your vocal load across a busy week and recover deliberately.' },
      { level: 'Professional', marker: 'Healthy habits are automatic; you sustain demanding schedules without losing the voice.' },
    ],
    proTips: [
      'This is general guidance, not medical advice. Persistent hoarseness beyond two weeks deserves a laryngologist.',
      'Steam and water hydrate the folds better than anything you gargle; systemic hydration is king.',
      'Next level: keep a simple voice diary (sleep, load, how you sounded) to learn your own limits and patterns.',
    ],
  },

  'avoid-strain': {
    objective:
      'Produce a strong, full sound through efficient fold closure and balanced air pressure, so power comes from coordination, not from squeezing the throat.',
    why:
      'Strain (pressed phonation) happens when the folds press together harder than the airflow needs, or when too much air pressure builds under tight folds. The efficient alternative is balanced: just enough closure to meet the air, so energy becomes tone instead of throat tension. That is why a free, well-supported voice can sound huge while feeling easy, and a strained one feels hard yet sounds choked.',
    steps: [
      'Sing a comfortable note and notice any squeeze in the throat or jaw; loosen the jaw and let it go.',
      'Drop your volume by half and find the easiest version of the note, with breath flowing freely.',
      'Rebuild power by adding support from the body (steady air) rather than tightening the throat.',
      'If a note ever stings or feels forced, stop: that is the line you do not cross.',
    ],
    drills: [
      {
        name: 'Straw de-press',
        how: 'Sing a phrase through a straw, then sing it open on a vowel, keeping that same easy feeling.',
        reps: '3 phrases, twice a day.',
      },
      {
        name: 'Half-volume rebuild',
        how: 'Sing a hard phrase at half volume and full ease, then add support, not throat, to grow it.',
        reps: '4 phrases from songs that usually feel tight.',
      },
      {
        name: 'Yawn-sigh release',
        how: 'Sigh from high to low on a relaxed, slightly yawny "ah" to reset an open, low-effort throat.',
        reps: '5 sighs whenever tension creeps in.',
      },
    ],
    feelFor: [
      'A throat that stays open and loose even as the sound gets fuller.',
      'Power that feels like steady airflow from the body, not effort in the neck.',
    ],
    mistakes: [
      'Equating loud with hard: pushing more pressure into squeezed folds.',
      'Raising the larynx and tightening the jaw and tongue to reach for notes.',
      'Ignoring pain or a raw feeling, which is never part of healthy singing.',
    ],
    simeChecks: [
      'Whether you can hit the target pitch at a lower, easier volume (a way to test for free production).',
      'Sime hears pitch, not effort, so it cannot detect strain directly; you must feel for it.',
    ],
    selfCheck: [
      'Tension in the throat, jaw, neck, and tongue, which only you can sense.',
      'Any pain, rawness, or hoarseness, which means stop now.',
    ],
    progression: [
      { level: 'Beginner', marker: 'You can feel the difference between a squeezed note and an easy one.' },
      { level: 'Intermediate', marker: 'You sing your usual songs with noticeably less throat tension.' },
      { level: 'Advanced', marker: 'You produce a powerful sound that still feels free across most of your range.' },
      { level: 'Professional', marker: 'Big, intense singing stays efficient and safe night after night, with no strain or recovery cost.' },
    ],
    proTips: [
      'Loud should feel like more air and support, never more grip. If it grips, back off and rebuild.',
      'A high larynx and tight jaw are the usual culprits; release them and most strain vanishes.',
      'Next level: learn safe vocal effects (grit, distortion) as deliberate sounds layered over a free tone, never as actual strain.',
    ],
  },

  'reading-notes': {
    objective: 'Đọc hiểu ngôn ngữ âm nhạc quốc tế (Khuông nhạc, Khóa nhạc, Nốt nhạc) để tự học bài hát và làm việc với ban nhạc.',
    why: 'Bản nhạc (Sheet music) là cách nhạc sĩ ghi lại chính xác giai điệu. Nắm được hệ thống C-D-E-F-G-A-B và vị trí nốt trên khuông nhạc, bạn sẽ không còn phụ thuộc vào việc phải nghe người khác hát mẫu mới hát theo được.',
    steps: [
      'Học thuộc 7 ký hiệu chữ cái: C (Đô), D (Rê), E (Mi), F (Fa), G (Sol), A (La), B (Si).',
      'Làm quen với Khuông nhạc (Staff) gồm 5 dòng kẻ và 4 khe. Nốt nằm càng cao trên khuông thì âm thanh càng cao.',
      'Hiểu Khóa Sol (Treble Clef): Dành cho nốt trung và cao (Giọng nữ, nam cao). Vòng xoắn của khóa Sol ôm lấy dòng kẻ số 2, đó chính là nốt G (Sol).',
      'Hiểu Khóa Fa (Bass Clef): Dành cho nốt trầm (Giọng nam trầm). Hai dấu chấm của khóa Fa kẹp giữa dòng kẻ số 4, đó là nốt F (Fa).',
    ],
    drills: [
      {
        name: 'Flashcard Nốt nhạc',
        how: 'Sử dụng các ứng dụng đọc nốt (như Tenuto hoặc MusicTutors), nhìn nốt trên khuông và đọc tên chữ cái thật nhanh.',
        reps: '5 phút mỗi ngày cho đến khi phản xạ tức thì.',
      },
      {
        name: 'Đọc nốt kết hợp đàn',
        how: 'Mở ứng dụng piano ảo, vừa đọc tên nốt (C, D, E...) vừa bấm đúng phím đó trên đàn.',
        reps: 'Thực hành với các nốt trong 1 quãng tám giữa (C4 đến C5).',
      },
    ],
    feelFor: [
      'Sự tự tin khi nhìn vào bản nhạc và biết chính xác giai điệu đang đi lên hay đi xuống.',
      'Sự kết nối giữa mắt nhìn, não đọc tên nốt và miệng phát âm.',
    ],
    mistakes: [
      'Ghi tên nốt (Đô, Rê, Mi) bằng chữ xuống dưới bản nhạc (làm vậy bạn sẽ không bao giờ nhìn khuông nhạc nữa).',
      'Chỉ học Khóa Sol mà bỏ qua Khóa Fa (nếu bạn là giọng nam).',
    ],
    simeChecks: [
      'Sime kiểm tra cao độ thực tế của bạn có khớp với nốt nhạc bạn đang cố gắng hát hay không.',
      'Hiển thị chính xác ký hiệu khoa học của nốt (VD: C4, Eb4) để bạn đối chiếu.',
    ],
    selfCheck: [
      'Tốc độ phản xạ: Khi nhìn thấy nốt, bạn có cần đếm từ dòng kẻ dưới cùng lên không?',
      'Khả năng đối chiếu: Bạn có biết nốt C4 trên bản nhạc nằm ở đâu trong giọng hát của mình chưa?',
    ],
    progression: [
      { level: 'Beginner', marker: 'Bạn biết 7 chữ cái và cách đếm dòng/khe để tìm nốt.' },
      { level: 'Intermediate', marker: 'Bạn đọc tên nốt trên Khóa Sol ngay lập tức mà không cần đếm.' },
      { level: 'Advanced', marker: 'Bạn có thể xướng âm (Sing-reading) giai điệu cơ bản khi vừa nhìn thấy bản nhạc.' },
      { level: 'Professional', marker: 'Bạn giao tiếp bằng ngôn ngữ âm nhạc với ban nhạc trôi chảy như tiếng mẹ đẻ.' },
    ],
    proTips: [
      'Ghi nhớ các câu thần chú: Khóa Sol dòng kẻ (E-G-B-D-F) "Every Good Boy Deserves Fudge". Khe (F-A-C-E) "FACE".',
      'Khi làm việc với nhạc sĩ nước ngoài, họ dùng C-D-E thay vì Đô-Rê-Mi. Hãy tập thói quen dùng chữ cái.',
      'Next level: Đọc nốt vượt ra ngoài khuông nhạc (các dòng kẻ phụ - Ledger lines).',
    ],
    quiz: [
      {
        question: 'Nốt nằm trên dòng kẻ thứ 2 từ dưới đếm lên của Khóa Sol là nốt gì?',
        options: ['Nốt E (Mi)', 'Nốt G (Sol)', 'Nốt B (Si)', 'Nốt C (Đô)'],
        correctIndex: 1,
        explanation: 'Khóa Sol ôm lấy dòng kẻ thứ 2, nên nốt nằm trên dòng kẻ đó luôn luôn là nốt G (Sol).'
      },
      {
        question: 'Ca sĩ nên dùng hệ thống gọi tên nốt nào để làm việc chuẩn quốc tế?',
        options: ['Đô Rê Mi Fa Sol La Si', 'C D E F G A B', 'Do Re Mi', '1 2 3 4 5 6 7'],
        correctIndex: 1,
        explanation: 'Hệ thống chữ cái C D E F G A B là ngôn ngữ tiêu chuẩn quốc tế giúp bạn làm việc dễ dàng với các nhạc sĩ và ban nhạc ở bất kỳ đâu.'
      },
      {
        question: 'Nếu nốt trên khuông nằm cao hơn nốt trước đó, cao độ khi hát thường phải như thế nào?',
        options: ['Thấp xuống', 'Giữ nguyên tuyệt đối', 'Cao lên', 'Luôn hát nhỏ hơn'],
        correctIndex: 2,
        explanation: 'Vị trí nốt càng cao trên khuông nhạc thì cao độ âm thanh càng cao.'
      },
      {
        question: 'Trong bài thực hành đọc nốt, điều gì được Sime dùng để xác nhận bạn đã đọc đúng?',
        options: ['Chỉ cần bấm nút tiếp tục', 'Tên nốt và cao độ thực tế khớp với nốt trên sheet', 'Âm lượng thật lớn', 'Hát nhanh hơn metronome'],
        correctIndex: 1,
        explanation: 'Bài thực hành yêu cầu bạn hát đúng nốt đang hiển thị và giữ cao độ đủ ổn định trong ngưỡng cho phép.'
      }
    ],
    noteReadingExercises: [
      {
        title: 'Đọc nốt Khóa Sol: C4 đến G4',
        instructions:
          'Nhìn nốt trên khuông, đọc tên chữ cái, rồi hát đúng cao độ. Mỗi nốt phải được giữ ổn định trước khi chuyển sang nốt kế tiếp.',
        clef: 'treble',
        passScore: 100,
        toleranceCents: 35,
        holdMs: 700,
        targets: [
          { note: 'C4', label: 'C4 - Đô trung', hint: 'Dòng kẻ phụ ngay dưới khuông khóa Sol.' },
          { note: 'D4', label: 'D4 - Rê', hint: 'Khe ngay dưới dòng kẻ thấp nhất.' },
          { note: 'E4', label: 'E4 - Mi', hint: 'Dòng kẻ thấp nhất của khuông.' },
          { note: 'F4', label: 'F4 - Fa', hint: 'Khe thứ nhất từ dưới lên.' },
          { note: 'G4', label: 'G4 - Sol', hint: 'Dòng kẻ thứ hai từ dưới lên.' },
        ],
      },
    ]
  },

  'rhythm-tempo': {
    objective: 'Làm chủ Nhịp điệu (Rhythm), Trường độ (Note values) và Tốc độ (Tempo) để hát đúng lúc, chuẩn nhịp.',
    why: 'Bạn có thể hát đúng cao độ, nhưng nếu hát sai nhịp (trễ nhịp, vào sớm), toàn bộ màn trình diễn sẽ sụp đổ. Nhịp điệu là xương sống của âm nhạc, giữ cho mọi nhạc cụ và giọng hát gắn kết với nhau.',
    steps: [
      'Hiểu Trường độ: Nốt tròn (4 phách), Trắng (2 phách), Đen (1 phách), Móc đơn (1/2 phách).',
      'Hiểu Số chỉ nhịp (Time Signature): Ví dụ 4/4 nghĩa là có 4 phách trong một ô nhịp, mỗi phách bằng 1 nốt đen. 3/4 là nhịp Valse (Bùm chát chát).',
      'Cảm nhận Tempo: Tốc độ của bài hát, tính bằng BPM (Nhịp mỗi phút). Ví dụ 60 BPM là bằng nhịp kim giây đồng hồ.',
      'Thực hành vỗ tay theo phách (Pulse) trong khi nghe bài hát yêu thích.',
    ],
    drills: [
      {
        name: 'Đọc nhịp với Metronome',
        how: 'Bật máy đánh nhịp (Metronome) ở 70 BPM. Đọc "Ta" tương ứng với các nốt đen (1 tiếng/phách), rồi nốt trắng (kéo dài 2 phách).',
        reps: '2 phút, chú ý không chạy nhanh hơn máy đánh nhịp.',
      },
      {
        name: 'Phân tích nhịp bài hát',
        how: 'Mở bài hát bất kỳ, nhịp chân theo tiếng trống Bass/Snare và đếm to 1-2-3-4.',
        reps: 'Thực hành với 3 bài hát ở các thể loại khác nhau.',
      },
    ],
    feelFor: [
      'Cảm giác "Groove" - cơ thể bạn nhún nhảy tự nhiên theo đúng chu kỳ của bài hát.',
      'Sự thư giãn khi bạn tin tưởng vào nhịp, không cần phải vội vã chạy theo nhạc.',
    ],
    mistakes: [
      'Chỉ hát theo thói quen mà không đếm nhịp ở những đoạn nhạc cụ dạo (Intro/Interlude), dẫn đến vào sai chỗ.',
      'Hát nhanh hơn nhịp đập (Rushing) khi lên nốt cao do căng thẳng.',
    ],
    simeChecks: [
      'Sime hiện tại tập trung vào Cao độ (Pitch). Nhịp điệu là thứ bạn phải tự cảm nhận và rèn luyện bằng tai.',
    ],
    selfCheck: [
      'Bạn có vào bài đúng lúc sau đoạn nhạc dạo không?',
      'Khi hát với Metronome, giọng bạn có rơi đúng vào tiếng "Tick" không?',
    ],
    progression: [
      { level: 'Beginner', marker: 'Bạn phân biệt được nốt đen, nốt trắng và vỗ tay đúng nhịp 4/4.' },
      { level: 'Intermediate', marker: 'Bạn hát đúng nhịp các bài hát phức tạp, đếm đúng số phách nghỉ.' },
      { level: 'Advanced', marker: 'Bạn làm chủ Syncopation (Đảo phách) và hát các bài R&B, Jazz có nhịp điệu khó.' },
      { level: 'Professional', marker: 'Nhịp điệu nằm trong máu. Bạn có thể hát "trễ nhịp một chút" (Lay back) để tạo phong cách mà không hề rớt nhịp.' },
    ],
    proTips: [
      'Luôn chia nhỏ nhịp: Trong đầu đếm 1-và-2-và-3-và-4-và để giữ nhịp độ ổn định, không bị cuốn nhanh.',
      'Khi tập hát, đừng chỉ nghe giai điệu. Hãy tập trung nghe tiếng Trống Kick và Snare.',
      'Next level: Tập hát đảo phách (Syncopation), nhấn vào các phách yếu để bài hát có "Bounce".',
    ],
    quiz: [
      {
        question: 'Trong nhịp 4/4, một nốt trắng kéo dài bằng bao nhiêu nốt đen?',
        options: ['1 nốt đen', '2 nốt đen', '3 nốt đen', '4 nốt đen'],
        correctIndex: 1,
        explanation: 'Nốt trắng có giá trị bằng 2 phách, nốt đen bằng 1 phách. Do đó một nốt trắng kéo dài bằng 2 nốt đen cộng lại.'
      },
      {
        question: 'Lỗi thường gặp nhất khi ca sĩ hát lên nốt cao là gì?',
        options: ['Hát quá chậm (Dragging)', 'Hát nhanh hơn nhịp đập (Rushing)', 'Hát sai lời', 'Quên bật micro'],
        correctIndex: 1,
        explanation: 'Do tâm lý căng thẳng khi lên cao, cơ thể thường có xu hướng vội vã muốn "giải quyết" nốt đó cho nhanh, dẫn đến lỗi Rushing (hát nhanh hơn nhịp).'
      }
    ]
  },

  'scales-keys': {
    objective: 'Hiểu luật chơi của Âm giai (Scales) và Hóa biểu (Key Signatures) để kiểm soát màu sắc âm nhạc và không bao giờ hát phô.',
    why: 'Âm giai là một nhóm các nốt nhạc được chọn lọc để tạo thành "quốc gia" của bài hát đó. Nắm được Âm giai, bạn sẽ biết nốt nào được phép hát, nốt nào sẽ nghe cực kỳ "phô" (lạc tông) nếu hát vào.',
    steps: [
      'Hiểu Âm giai Trưởng (Major Scale): Nghe vui tươi, hùng tráng. Công thức khoảng cách nốt: 1 - 1 - 0.5 - 1 - 1 - 1 - 0.5 cung.',
      'Hiểu Âm giai Thứ (Minor Scale): Nghe buồn bã, sâu lắng. Công thức khác biệt ở nốt bậc 3, 6, 7 bị giáng xuống.',
      'Làm quen Dấu Thăng (# - tăng nửa cung) và Dấu Giáng (b - giảm nửa cung).',
      'Nhìn vào đầu bản nhạc (sau khóa nhạc) để xem Hóa biểu: Có bao nhiêu dấu # hay b, từ đó xác định Tone bài hát.',
    ],
    drills: [
      {
        name: 'Hát Âm giai Trưởng',
        how: 'Hát Do-Re-Mi-Fa-Sol-La-Si-Do cùng với đàn piano. Đảm bảo cảm nhận được khoảng cách nửa cung giữa Mi-Fa và Si-Do.',
        reps: '4 lượt lên và xuống.',
      },
      {
        name: 'Tìm Hóa biểu',
        how: 'Nhìn vào bản nhạc bất kỳ, đếm số lượng dấu thăng/giáng ở đầu dòng.',
        reps: 'Đọc 5 bản nhạc khác nhau.',
      },
    ],
    feelFor: [
      'Màu sắc cảm xúc khác biệt rõ rệt khi chuyển từ Âm giai Trưởng (Vui) sang Thứ (Buồn).',
      'Cảm giác nốt về đích (Nốt chủ / Tonic) luôn mang lại sự giải quyết, thỏa mãn ở cuối bài hát.',
    ],
    mistakes: [
      'Hát sai nốt bậc 3 của âm giai, biến bài hát từ Trưởng thành Thứ một cách vô ý.',
      'Bỏ qua hóa biểu (quên hát các nốt thăng/giáng theo quy định của tone bài).',
    ],
    simeChecks: [
      'Sime theo dõi độ chính xác từng bán cung (semitone) để xem bạn có vô tình trượt ra khỏi thang âm không.',
      'Chức năng Smart Transpose của Sime dựa vào việc tính toán Âm giai để dời bài hát lên/xuống.',
    ],
    selfCheck: [
      'Bạn có cảm nhận được sự kết thúc trọn vẹn khi hát về nốt chủ (Tonic) không?',
      'Khi hát chay không nhạc, bạn có giữ vững được màu sắc Trưởng/Thứ không?',
    ],
    progression: [
      { level: 'Beginner', marker: 'Bạn hiểu sự khác nhau giữa Trưởng và Thứ, hát được thang âm C Major (Đô Trưởng).' },
      { level: 'Intermediate', marker: 'Bạn áp dụng đúng các nốt thăng/giáng khi đổi sang hát ở Tone khác.' },
      { level: 'Advanced', marker: 'Bạn làm chủ Pentatonic (Ngũ cung) và Blues Scale để luyến láy (Run/Riff).' },
      { level: 'Professional', marker: 'Bạn có thể chuyển Tone trực tiếp (Modulation) trên sân khấu một cách hoàn hảo.' },
    ],
    proTips: [
      'Để luyến láy R&B mượt mà, hãy luyện tập kỹ Thang âm Ngũ cung (Pentatonic) thay vì Thang âm đủ 7 nốt.',
      'Nếu bạn hay hát phô, có thể bạn chưa thiết lập nốt Chủ (Tonic) vững chắc trong não trước khi cất giọng.',
      'Next level: Luyện hát Thang âm Thứ hòa thanh (Harmonic Minor) với bậc 7 thăng để có âm hưởng Trung Đông.',
    ],
    quiz: [
      {
        question: 'Sự khác biệt rõ ràng nhất về cảm xúc giữa Âm giai Trưởng và Âm giai Thứ là gì?',
        options: ['Trưởng nghe buồn, Thứ nghe vui', 'Trưởng nghe vui tươi/hùng tráng, Thứ nghe buồn bã/sâu lắng', 'Trưởng hát to hơn, Thứ hát nhỏ hơn', 'Không có sự khác biệt'],
        correctIndex: 1,
        explanation: 'Đúng vậy! Âm giai Trưởng mang lại cảm giác sáng sủa, vui vẻ, trong khi Âm giai Thứ tạo ra màu sắc u tối, buồn bã hoặc huyền bí.'
      },
      {
        question: 'Chuyện gì sẽ xảy ra nếu bạn không chú ý đến Hóa biểu (Key Signature) ở đầu bản nhạc?',
        options: ['Nhịp độ bài hát sẽ bị sai', 'Bạn sẽ hát phô vì bỏ quên các nốt thăng (#) hoặc giáng (b) của bài', 'Giọng bạn sẽ bị khàn', 'Bài hát sẽ tự động kết thúc sớm'],
        correctIndex: 1,
        explanation: 'Hóa biểu quy định "luật chơi" của bài hát (những nốt nào phải thăng, nốt nào phải giáng). Nếu bỏ qua nó, bạn sẽ hát sai thang âm và bị phô.'
      }
    ]
  },

  'intervals-chords': {
    objective: 'Cảm nhận Khoảng cách giữa các nốt (Quãng) và sự kết hợp của chúng (Hợp âm) để có thể tự hát bè (Harmony).',
    why: 'Quãng là viên gạch xây dựng giai điệu, giúp bạn xướng âm chuẩn. Hợp âm là khung xương của bài. Hiểu cách các nốt xếp chồng lên nhau giúp bạn sáng tạo bè điêu luyện thay vì chỉ hát giai điệu chính.',
    steps: [
      'Hiểu Quãng (Interval): Là khoảng cách về độ cao giữa 2 nốt. Ví dụ C lên G là Quãng 5 (Đô-Rê-Mi-Fa-Sol = 1-2-3-4-5).',
      'Học Quãng 3 (Third): Khoảng cách tạo nên màu sắc Trưởng/Thứ. C lên E là Quãng 3 trưởng.',
      'Hiểu Hợp âm 3 (Triad): 3 nốt phát ra cùng lúc. Gồm nốt Gốc (Root), Bậc 3, và Bậc 5 (Ví dụ: C-E-G).',
      'Khi có người hát nốt Gốc (giai điệu), bạn hát Bậc 3 hoặc Bậc 5 cùng lúc, đó chính là Hát bè (Harmonizing).',
    ],
    drills: [
      {
        name: 'Hát rải hợp âm (Arpeggio)',
        how: 'Bấm 1 hợp âm trên đàn, sau đó hát lần lượt 3 nốt của nó từ dưới lên trên và ngược lại (1-3-5-3-1).',
        reps: 'Thực hành với các hợp âm Trưởng và Thứ.',
      },
      {
        name: 'Bè Quãng 3',
        how: 'Mở một giai điệu đơn giản (như Happy Birthday). Cố gắng hát cao hơn giai điệu chính một Quãng 3 trong suốt bài.',
        reps: '1 bài hát mỗi ngày.',
      },
    ],
    feelFor: [
      'Cảm giác "khớp" và vang dội (Cộng hưởng âm học) khi giọng bạn và nhạc cụ/người khác hòa vào nhau thành một hợp âm hoàn hảo.',
      'Khoảng cách âm thanh trong não trước khi phát âm.',
    ],
    mistakes: [
      'Bị cuốn theo giai điệu chính: Khi hát bè, bạn dễ bị phân tâm và hát lại giai điệu của người kia.',
      'Hát bè bằng quãng song song nhưng không chú ý vào dấu hóa của bài hát, dẫn đến bè phô.',
    ],
    simeChecks: [
      'Khi bạn luyện hát rải hợp âm, Sime xác nhận từng nốt bạn hát có đúng vị trí của Bậc 3 và Bậc 5 không.',
      'Độ lệch cents càng thấp, hợp âm tạo ra giữa bạn và nhạc càng "bắt tai" (chống chói).',
    ],
    selfCheck: [
      'Khi ai đó đàn 1 hợp âm, bạn có bóc tách được nốt cao nhất và nốt thấp nhất bằng tai không?',
      'Bạn có thể giữ vững bè của mình khi người khác hát giai điệu chính ngay bên tai không?',
    ],
    progression: [
      { level: 'Beginner', marker: 'Bạn hiểu thế nào là Quãng và biết cấu tạo Hợp âm gồm 3 nốt.' },
      { level: 'Intermediate', marker: 'Bạn có thể hát rải hợp âm (Arpeggio) và tự tìm bè Quãng 3 cho bài hát đơn giản.' },
      { level: 'Advanced', marker: 'Bạn có thể bè đuổi, bè Quãng 5, Quãng 6 và không bị cuốn theo giọng chính.' },
      { level: 'Professional', marker: 'Khả năng hòa âm ngẫu hứng. Bạn tự động nghe và xếp bè 3-4 người không cần bản nhạc.' },
    ],
    proTips: [
      'Muốn tập hát bè? Hãy bịt một bên tai lại khi hát, bạn sẽ nghe rõ giọng mình hơn trong khi tai kia nghe giai điệu chính.',
      'Hợp âm có Quãng 3 thứ nghe buồn, Quãng 3 trưởng nghe vui. Cảm nhận màu sắc thay vì tính toán toán học.',
      'Next level: Luyện nghe và hát Hợp âm 7 (Thêm nốt bậc 7) để hát nhạc Jazz/R&B.',
    ],
  },

  'pitch-types': {
    objective: 'Hiểu rõ khả năng Cảm âm Tuyệt đối (Perfect Pitch) và rèn luyện Cảm âm Tương đối (Relative Pitch).',
    why: 'Nhiều người nghĩ hát hay là phải có Perfect Pitch, nhưng sự thật là 99% ca sĩ xuất sắc dùng Relative Pitch. Hiểu cơ chế này giúp bạn ngừng tự ti và biết cách luyện tập đôi tai đúng phương pháp.',
    steps: [
      'Perfect Pitch (Tuyệt đối): Khả năng thiên bẩm nghe 1 âm thanh (tiếng còi xe, tiếng rơi đồ) và biết ngay đó là nốt gì (như nốt A) mà không cần nốt chuẩn. Rất hiếm và không thực sự cần thiết.',
      'Relative Pitch (Tương đối): Khả năng nghe 1 nốt chuẩn (Ví dụ Đô), và từ đó suy ra các nốt khác dựa vào khoảng cách. Đây là kỹ năng CÓ THỂ LUYỆN TẬP.',
      'Lấy một nốt làm mỏ neo trong não (thường là A4 - 440Hz, hoặc C).',
      'Gắn các khoảng cách quãng với các bài hát quen thuộc. Ví dụ: Quãng 4 đúng nghe giống hai nốt đầu của bài hát đám cưới (Here Comes The Bride).',
    ],
    drills: [
      {
        name: 'Trắc nghiệm Quãng (Interval Recognition)',
        how: 'Sử dụng công cụ Ear Training trên Sime. Nhấn Play nghe 2 nốt, và đoán khoảng cách giữa chúng.',
        reps: '10 câu hỏi mỗi ngày. Tích lũy dần.',
      },
      {
        name: 'Tìm nốt mỏ neo',
        how: 'Sáng thức dậy, cố gắng tự hát nốt Đô (C) trước khi kiểm tra bằng đàn. Luyện não bộ ghi nhớ tần số của nốt đó.',
        reps: '1 lần mỗi ngày.',
      },
    ],
    feelFor: [
      'Sự liên kết trong não: Nghe một quãng và giai điệu quen thuộc ngay lập tức nảy số trong đầu.',
      'Sự chắc chắn khi cất giọng vào bài mà không sợ sai tone.',
    ],
    mistakes: [
      'Cho rằng mình "mù âm nhạc" (Tone-deaf) chỉ vì không có Perfect Pitch.',
      'Đoán nốt một cách ngẫu nhiên thay vì bám vào nốt gốc (Tonic).',
    ],
    simeChecks: [
      'Bài luyện Pitch Test trên Sime được thiết kế chính xác để phát triển Relative Pitch: Nghe một nốt và hát lại chuẩn xác.',
    ],
    selfCheck: [
      'Bạn có nhận ra bài hát quen thuộc bị chơi ở Tone khác so với bản gốc không?',
      'Bạn có hát lại được giai điệu vừa nghe mà không bị phô không?',
    ],
    progression: [
      { level: 'Beginner', marker: 'Bạn phân biệt được nốt nào cao hơn, nốt nào thấp hơn.' },
      { level: 'Intermediate', marker: 'Bạn có thể hát lại chính xác một giai điệu vừa nghe nhờ Relative Pitch.' },
      { level: 'Advanced', marker: 'Bạn nghe một đoạn nhạc cụ và có thể nhẩm ra tên nốt (solfege) của nó.' },
      { level: 'Professional', marker: 'Đôi tai nhạy bén giúp bạn xử lý mọi sự cố âm thanh trên sân khấu, tự điều chỉnh cao độ ngay trong 0.1 giây.' },
    ],
    proTips: [
      'Đừng cố luyện Perfect Pitch nếu bạn đã qua tuổi trưởng thành, hãy dồn toàn lực luyện Relative Pitch vì nó hữu dụng hơn nhiều trong việc chuyển tone bài hát.',
      'Tạo danh sách các bài hát "Móc khóa" (Reference songs) cho mỗi loại quãng (VD: Twinkle Twinkle = Quãng 5 đúng).',
      'Next level: Luyện nghe các hợp âm phức tạp và bóc tách từng nốt bên trong nó.',
    ],
  },

  'voice-types': {
    objective: 'Xác định loại giọng, cữ âm thoải mái nhất (Tessitura) và biết cách Dịch tông (Transpose) để bảo vệ thanh quản.',
    why: 'Cố gắng hát những bài hát được viết cho loại giọng khác là nguyên nhân số 1 gây hỏng giọng. Hiểu về loại giọng giúp bạn thiết kế bài hát theo cơ thể mình, thay vì ép cơ thể chạy theo bài hát.',
    steps: [
      'Tone (Key): Độ cao tổng thể của bài hát. Dịch tông (Transpose) là nâng hoặc hạ toàn bộ bài hát lên/xuống.',
      'Vocal Range (Quãng giọng): Từ nốt thấp nhất đến nốt cao nhất bạn có thể phát ra. Nhưng đó KHÔNG PHẢI là yếu tố quyết định loại giọng.',
      'Tessitura (Cữ âm): Khoảng nốt mà giọng bạn vang đẹp nhất, thoải mái nhất, ít tốn sức nhất. Đây mới là thứ quyết định bạn là Soprano hay Alto, Tenor hay Bass.',
      'Timber (Màu giọng): Độ dày, sáng, hay trầm ấm của chất giọng.',
    ],
    drills: [
      {
        name: 'Đo quãng giọng bằng Sime',
        how: 'Mở công cụ Đo quãng giọng (Range Test) trên Sime. Lướt từ nốt thấp nhất đến cao nhất một cách thoải mái, không gào thét.',
        reps: '1 lần để thiết lập Hồ sơ giọng hát.',
      },
      {
        name: 'Bài test Tessitura',
        how: 'Hát liên tục ở một vùng nốt (VD: G4 đến C5) trong 3 phút. Nếu cổ họng bắt đầu mỏi, vùng đó nằm ngoài Tessitura của bạn.',
        reps: 'Định kì kiểm tra khi chọn bài mới.',
      },
    ],
    feelFor: [
      'Sự dễ chịu, thoải mái khi hát ở đúng Tone: Giọng vang, không cần gân cổ, hơi thở lưu thông tự do.',
      'Màu giọng đẹp nhất được bộc lộ tự nhiên.',
    ],
    mistakes: [
      'Tự hào vì "rặn" được nốt cực cao, rồi tự nhận mình là Tenor/Soprano dù giọng vốn rất trầm và dày (Baritone/Alto).',
      'Cover bài hát của thần tượng ở nguyên Tone gốc (Original Key) mặc kệ sự khác biệt về loại giọng.',
    ],
    simeChecks: [
      'Công cụ Range Test của Sime đánh giá các nốt bạn duy trì ổn định (sustain) thay vì các nốt "hét" lên chớp nhoáng, để tính toán Range chuẩn.',
      'Smart Transpose của Sime tự động tính toán để kéo bài hát về đúng Tessitura của bạn.',
    ],
    selfCheck: [
      'Sau khi hát xong 1 bài, cổ họng bạn có hoàn toàn thư giãn không?',
      'Những nốt cao nhất trong bài, bạn hát bằng sự cộng hưởng hay bằng cách siết cổ?',
    ],
    progression: [
      { level: 'Beginner', marker: 'Bạn hoàn thành bài test và biết cơ bản quãng giọng thấp/cao nhất của mình.' },
      { level: 'Intermediate', marker: 'Bạn biết rõ Tessitura của mình và luôn chủ động Dịch tông (Transpose) beat nhạc trước khi hát.' },
      { level: 'Advanced', marker: 'Bạn sử dụng Mixed Voice để nới rộng Tessitura lên cao hơn một cách an toàn.' },
      { level: 'Professional', marker: 'Bạn hiểu thấu đáo bộ máy phát âm của mình, biết chính xác nốt nào sẽ dùng kỹ thuật gì, khoe trọn vẻ đẹp độc bản của màu giọng.' },
    ],
    proTips: [
      'Đừng so sánh nốt cao với ca sĩ khác. Đôi khi một giọng Baritone hát nốt G4 vang rền lại ấn tượng hơn một Tenor cố với lên C5 yếu ớt.',
      'Nhạc cụ có thể độ lại, còn thanh quản thì không. Hãy chọn bài hát phục vụ giọng hát của bạn, đừng làm ngược lại.',
      'Next level: Tìm hiểu về các phân loại nhỏ hơn (VD: Lyrical Soprano, Dramatic Tenor) khi bước vào hát Opera / Cổ điển.',
    ],
  },
};

export function getLessonGuide(id: string): LessonGuide | undefined {
  return lessonGuides[id] ?? eduxLessonGuides[id];
}



