/**
 * Canonical voice-type (Fach) reference, used to personalise the app to each
 * singer's voice. The data is grounded in standard vocal pedagogy (Richard
 * Miller, "The Structure of Singing" and "Solutions for Singers"; James
 * McKinney, "The Diagnosis and Correction of Vocal Faults"; NATS science-informed
 * pedagogy) and the project reference in vocal_docs.md. Ranges and passaggio
 * pitches are typical guides, not hard rules: real voices vary, and Sime keys a
 * singer's actual classification off their measured range (see backend
 * classifyVoice in services/vocalAnalysis.ts).
 *
 * Honesty: this is reference and guidance content. Sime measures pitch, not
 * timbre or technique, so nothing here claims Sime can verify a voice type by
 * ear beyond range. See sime-pitch-only-honesty.
 *
 * The `name`/`aka` fields are matched against the backend's voiceType strings:
 * 'Bass', 'Baritone', 'Tenor', 'Lyric Tenor', 'Contralto / Alto',
 * 'Mezzo-Soprano', 'Soprano', 'Coloratura Soprano', 'Mezzo-Soprano / Tenor'.
 */

export type SingerGroup = 'male' | 'female' | 'either';

export interface VoiceTypeProfile {
  /** Stable slug used in URLs and lookups. */
  key: string;
  /** Display name, aligned with the backend classifier where possible. */
  name: string;
  /** Alternate labels and backend variants this entry covers. */
  aka: string[];
  group: SingerGroup;
  /** One line shown in lists. */
  blurb: string;
  /** A plain but precise paragraph on the voice. */
  description: string;
  /** Typical full singable range (scientific pitch). */
  rangeLow: string;
  rangeHigh: string;
  midiLow: number;
  midiHigh: number;
  /** The comfortable sweet spot where this voice sounds best and tires least. */
  tessituraLow: string;
  tessituraHigh: string;
  /** First register transition (chest into middle). */
  primoPassaggio: string;
  /** Second transition (middle into head). */
  secondoPassaggio: string;
  /** How to negotiate the bridge for this voice. */
  passaggioNote: string;
  /** Character of the timbre. */
  timbre: string;
  /** What this voice should prioritise to develop well. */
  focus: string[];
  /** Traps this voice type falls into most. */
  pitfalls: string[];
  /** Lesson ids, in suggested priority order (filtered to those that exist). */
  recommendedLessons: string[];
  /** Real, well-known singers of this Fach (classical and contemporary). */
  exemplars: string[];
  /** Repertoire that flatters this voice. */
  repertoire: string;
  /** How Sime's Kim (bright) vs Tho (warm) colour reads within this Fach. */
  colorNote: string;
}

export const voiceTypes: VoiceTypeProfile[] = [
  {
    key: 'bass',
    name: 'Bass',
    aka: ['Bass'],
    group: 'male',
    blurb: 'The deepest male voice. Dark, weighty, and grounded.',
    description:
      'The bass is the lowest male voice, prized for depth, gravity, and a chest-rich low end. Basses develop more slowly than higher voices and should resist forcing brightness or height before the low and middle are solid and resonant.',
    rangeLow: 'E2',
    rangeHigh: 'E4',
    midiLow: 40,
    midiHigh: 64,
    tessituraLow: 'G2',
    tessituraHigh: 'D4',
    primoPassaggio: 'G3',
    secondoPassaggio: 'C4',
    passaggioNote:
      'Keep weight off the top. Begin tilting toward head resonance through the A3 to C4 zone so the upper-middle does not sound shouted.',
    timbre: 'Dark, broad, and resonant, with a strong fundamental and slow vibrato.',
    focus: [
      'Steady breath support to fill long, low phrases without going flat.',
      'Low-larynx resonance and open vowels for depth, not throat pressure.',
      'A smooth lift through G3 to C4 so the top stays connected.',
    ],
    pitfalls: [
      'Pushing chest weight upward and getting stuck or strained at the top.',
      'Going flat on sustained low notes when support sags.',
      'Darkening the tone artificially by depressing the tongue and larynx.',
    ],
    recommendedLessons: ['breath-support', 'resonance-basics', 'mixed-voice', 'vibrato', 'phrasing'],
    exemplars: ['Leonard Cohen', 'Johnny Cash', 'Barry White', 'Rene Pape', 'Kurt Moll'],
    repertoire: 'Slow ballads, gospel and blues low parts, and the foundational operatic bass roles.',
    colorNote:
      'Most basses read Tho (warm). A Kim (bright) reading usually means good forward resonance, not a lighter voice; keep the depth.',
  },
  {
    key: 'baritone',
    name: 'Baritone',
    aka: ['Baritone', 'Bass-Baritone'],
    group: 'male',
    blurb: 'The most common male voice. Warm, full, and versatile.',
    description:
      'The baritone sits between bass and tenor and is the most common male voice. It carries a warm, speech-like middle and a satisfying low end. The work of a baritone is a free, ringing top built on a relaxed bridge rather than added muscle.',
    rangeLow: 'A2',
    rangeHigh: 'A4',
    midiLow: 45,
    midiHigh: 69,
    tessituraLow: 'B2',
    tessituraHigh: 'F4',
    primoPassaggio: 'B3',
    secondoPassaggio: 'E4',
    passaggioNote:
      'The B3 to E4 bridge is where most baritones grip. Use light "ng" and "nay" slides to carry middle resonance up rather than dragging chest weight.',
    timbre: 'Warm and full in the middle, darker than a tenor, with a present low range.',
    focus: [
      'Releasing the B3 to E4 passaggio so the top rings without pushing.',
      'Mixed voice to extend a usable, musical top past the bridge.',
      'Even vowels so the warm middle does not spread or thin out high.',
    ],
    pitfalls: [
      'Muscling through the passaggio and cracking around E4 to F4.',
      'Singing everything in heavy chest because the low range is comfortable.',
      'Letting the tone spread wide and lose focus on higher notes.',
    ],
    recommendedLessons: ['breath-support', 'mixed-voice', 'resonance-basics', 'belting', 'agility'],
    exemplars: ['Frank Sinatra', 'Elvis Presley', 'John Legend', 'Hozier', 'Dmitri Hvorostovsky'],
    repertoire: 'Crooner standards, soul and pop ballads, musical theatre leads, and lyric baritone arias.',
    colorNote:
      'Baritones split fairly evenly. Tho (warm) leans classic crooner; Kim (bright) leans pop and theatre. Train both, lead with your natural one.',
  },
  {
    key: 'tenor',
    name: 'Tenor',
    aka: ['Tenor', 'Lyric Tenor'],
    group: 'male',
    blurb: 'The highest common male voice. Bright, ringing, and athletic.',
    description:
      'The tenor is the highest standard male voice, known for brilliance and a thrilling high range. Healthy tenor singing is about acoustic efficiency and a well-timed lift into head and mix, not brute force, so the famous high notes ring instead of strain.',
    rangeLow: 'C3',
    rangeHigh: 'C5',
    midiLow: 48,
    midiHigh: 72,
    tessituraLow: 'D3',
    tessituraHigh: 'A4',
    primoPassaggio: 'D4',
    secondoPassaggio: 'G4',
    passaggioNote:
      'Negotiate the D4 to G4 zona di passaggio with vowel modification (narrowing toward "uh"/"oo" as you climb) so the secondo passaggio at G4 turns over freely into the top.',
    timbre: 'Bright and ringing, with strong upper harmonics and carrying power.',
    focus: [
      'Vowel modification through D4 to G4 to keep the top open and free.',
      'A strong, connected mix so high notes are powerful, not shouted or falsetto.',
      'Agility and stamina for the busy upper tessitura tenors live in.',
    ],
    pitfalls: [
      'Pulling chest past G4 and either cracking or going sharp from squeezing.',
      'Flipping into weak, disconnected falsetto instead of a supported head mix.',
      'Spreading the vowel wide on top instead of narrowing it.',
    ],
    recommendedLessons: ['mixed-voice', 'belting', 'agility', 'breath-support', 'vibrato'],
    exemplars: ['Luciano Pavarotti', 'Stevie Wonder', 'Bruno Mars', 'Freddie Mercury', 'Placido Domingo'],
    repertoire: 'Pop and soul with a high hook, rock anthems, and the lyric tenor operatic canon.',
    colorNote:
      'Tenors usually read Kim (bright). A Tho (warm) reading can mean a richer lyric or spinto colour; protect the ring while you keep the warmth.',
  },
  {
    key: 'countertenor',
    name: 'Countertenor',
    aka: ['Countertenor'],
    group: 'male',
    blurb: 'A male voice singing in the alto or soprano range, mostly in head.',
    description:
      'The countertenor is a male voice that sings primarily in a developed head register, reaching the contralto or mezzo range. It is the rarest male classification and demands exceptional control of head voice and the lower bridge.',
    rangeLow: 'G3',
    rangeHigh: 'E5',
    midiLow: 55,
    midiHigh: 76,
    tessituraLow: 'A3',
    tessituraHigh: 'C5',
    primoPassaggio: 'G4',
    secondoPassaggio: 'C5',
    passaggioNote:
      'Build the head register first, then connect a clean lower bridge near G4 so the bottom does not drop into a disconnected chest voice.',
    timbre: 'Pure and flute-like up high, lighter than a female alto, with a distinctive ring.',
    focus: [
      'Head-voice strength and evenness across the whole working range.',
      'Connecting the lower bridge so low notes still carry.',
      'Agility, since much countertenor repertoire is florid Baroque writing.',
    ],
    pitfalls: [
      'A weak, breathy bottom that vanishes below the staff.',
      'Forcing volume in head voice instead of finding resonance.',
    ],
    recommendedLessons: ['mixed-voice', 'agility', 'breath-support', 'vibrato', 'resonance-basics'],
    exemplars: ['Andreas Scholl', 'Philippe Jaroussky', 'Iestyn Davies', 'Anthony Roth Costanzo'],
    repertoire: 'Baroque opera and oratorio (Handel, Vivaldi), early music, and modern works written for the voice.',
    colorNote:
      'Kim (bright) suits the clean Baroque sound; Tho (warm) gives a rounder, more contralto-like colour.',
  },
  {
    key: 'contralto',
    name: 'Contralto / Alto',
    aka: ['Contralto / Alto', 'Contralto', 'Alto'],
    group: 'female',
    blurb: 'The deepest female voice. Rich, dark, and powerful.',
    description:
      'The contralto, or alto in choral terms, is the lowest and rarest female voice. It carries a dark, chesty richness and a striking low range. Like the bass, it develops slowly and rewards patience with breath, resonance, and an unforced top.',
    rangeLow: 'F3',
    rangeHigh: 'F5',
    midiLow: 53,
    midiHigh: 77,
    tessituraLow: 'G3',
    tessituraHigh: 'D5',
    primoPassaggio: 'F4',
    secondoPassaggio: 'E5',
    passaggioNote:
      'Carry the warm low resonance through the first bridge near F4 without belting, and lighten toward the second bridge near E5 so the top does not lock.',
    timbre: 'Dark, full, and chesty, with a powerful low range many higher voices envy.',
    focus: [
      'Owning the low range with support instead of pressing for volume.',
      'A smooth first bridge near F4 so the middle does not break.',
      'Finding a free top so high notes are not avoided.',
    ],
    pitfalls: [
      'Belting the lower middle and getting stuck below the first bridge.',
      'A thin, underused top from never training above the staff.',
    ],
    recommendedLessons: ['breath-support', 'resonance-basics', 'mixed-voice', 'phrasing', 'vibrato'],
    exemplars: ['Tracy Chapman', 'Toni Braxton', 'Nina Simone', 'Marian Anderson', 'Ewa Podles'],
    repertoire: 'Soul and blues, smoky low ballads, and contralto operatic and oratorio roles.',
    colorNote:
      'Contraltos read Tho (warm) most often. A Kim (bright) reading is usually healthy forward focus; do not trade away the rich bottom for it.',
  },
  {
    key: 'mezzo',
    name: 'Mezzo-Soprano',
    aka: ['Mezzo-Soprano', 'Mezzo', 'Mezzo-Soprano / Tenor'],
    group: 'female',
    blurb: 'The middle female voice. Warm, strong, and flexible.',
    description:
      'The mezzo-soprano sits between contralto and soprano and is the most common female voice. It blends a warm, capable middle with a usable low end and a bright top, which makes it the workhorse of pop, soul, and musical theatre.',
    rangeLow: 'A3',
    rangeHigh: 'A5',
    midiLow: 57,
    midiHigh: 81,
    tessituraLow: 'B3',
    tessituraHigh: 'F5',
    primoPassaggio: 'F4',
    secondoPassaggio: 'F5',
    passaggioNote:
      'Smooth the first bridge near F4 to G4 with "nay"/"mum" slides, then keep the second bridge near F5 free so belts up there stay mixed, not screamed.',
    timbre: 'Warm and rounded in the middle, with power on top and a present low range.',
    focus: [
      'A connected belt and mix through the upper-middle and second bridge.',
      'Even vowels so the strong middle does not spread when it gets loud.',
      'Keeping the low range supported and audible.',
    ],
    pitfalls: [
      'Pushing chest belt past a safe limit and straining near F5.',
      'Assuming you are a soprano and chasing a tessitura that tires you.',
    ],
    recommendedLessons: ['mixed-voice', 'belting', 'breath-support', 'agility', 'phrasing'],
    exemplars: ['Adele', 'Amy Winehouse', 'Lady Gaga', 'Cecilia Bartoli', 'Joyce DiDonato'],
    repertoire: 'Pop and soul belters, musical theatre leads, jazz standards, and mezzo opera roles.',
    colorNote:
      'Mezzos run the full spread. Kim (bright) leans pop belt; Tho (warm) leans soul and jazz. Develop both registers of colour.',
  },
  {
    key: 'soprano',
    name: 'Soprano',
    aka: ['Soprano'],
    group: 'female',
    blurb: 'The highest common female voice. Bright, clear, and soaring.',
    description:
      'The soprano is the highest standard female voice, defined by clarity, brilliance, and an effortless-sounding top. Healthy soprano singing keeps the larynx free and the vowels tuned, so the high range floats instead of being pushed.',
    rangeLow: 'C4',
    rangeHigh: 'C6',
    midiLow: 60,
    midiHigh: 84,
    tessituraLow: 'D4',
    tessituraHigh: 'A5',
    primoPassaggio: 'E4',
    secondoPassaggio: 'F5',
    passaggioNote:
      'Do not over-weight the low and first bridge near E4. Tune vowels through the second bridge near F5 so the top stays free and ringing.',
    timbre: 'Bright, clear, and floating up high, lighter through the middle than a mezzo.',
    focus: [
      'Head voice and a free, tuned top rather than a pushed one.',
      'Breath flow for long, soaring lines.',
      'Not over-darkening or weighting the lower middle.',
    ],
    pitfalls: [
      'Carrying too much chest weight up and choking the top.',
      'Breathy, unsupported high notes from too little airflow.',
    ],
    recommendedLessons: ['breath-support', 'mixed-voice', 'agility', 'vibrato', 'phrasing'],
    exemplars: ['Whitney Houston', 'Mariah Carey', 'Ariana Grande', 'Renee Fleming', 'Maria Callas'],
    repertoire: 'Pop with a soaring chorus, ballads with a big top, and the lyric soprano canon.',
    colorNote:
      'Sopranos usually read Kim (bright). A Tho (warm) reading suggests a fuller lyric colour; keep the clarity on top while you enjoy the warmth.',
  },
  {
    key: 'coloratura',
    name: 'Coloratura Soprano',
    aka: ['Coloratura Soprano', 'Coloratura'],
    group: 'female',
    blurb: 'The highest, most agile soprano. Light, brilliant, and acrobatic.',
    description:
      'The coloratura soprano is the highest and most agile voice, able to sing rapid runs, trills, and notes above the staff with ease. It is a light, brilliant instrument whose training centres on agility, precision, and a free, unforced extreme top.',
    rangeLow: 'C4',
    rangeHigh: 'F6',
    midiLow: 60,
    midiHigh: 89,
    tessituraLow: 'G4',
    tessituraHigh: 'C6',
    primoPassaggio: 'F4',
    secondoPassaggio: 'F5',
    passaggioNote:
      'Stay light through the bridges. Speed and precision come from minimal weight and exact vowel tuning, not power.',
    timbre: 'Light, silvery, and brilliant, with an extreme top and dazzling flexibility.',
    focus: [
      'Agility: clean, even runs and trills at speed.',
      'Pitch precision on rapid, high passages.',
      'Keeping the extreme top free and never pushed.',
    ],
    pitfalls: [
      'Adding weight to feel powerful and losing the agility that defines the voice.',
      'Smearing fast runs instead of articulating each note.',
    ],
    recommendedLessons: ['agility', 'pitch-matching', 'mixed-voice', 'breath-support', 'vibrato'],
    exemplars: ['Mariah Carey', 'Ariana Grande', 'Joan Sutherland', 'Natalie Dessay', 'Diana Damrau'],
    repertoire: 'Whistle-tone pop, florid arias, and the coloratura showpieces (Mozart, Donizetti, Delibes).',
    colorNote:
      'Almost always Kim (bright). Lean into the clarity and speed; warmth here is a seasoning, not the goal.',
  },
];

const byKey: Record<string, VoiceTypeProfile> = Object.fromEntries(
  voiceTypes.map((v) => [v.key, v])
);

export function getVoiceTypeByKey(key: string): VoiceTypeProfile | null {
  return byKey[key] ?? null;
}

/**
 * Resolve a backend voiceType string (or any label) to its canonical Fach.
 * Order matters: more specific labels are tested first so, for example,
 * 'Mezzo-Soprano' resolves to mezzo rather than soprano, and 'Coloratura
 * Soprano' to coloratura rather than soprano.
 */
export function fachForVoiceType(voiceType?: string | null): VoiceTypeProfile | null {
  if (!voiceType) return null;
  const v = voiceType.toLowerCase();
  if (v.includes('coloratura')) return byKey.coloratura;
  if (v.includes('mezzo')) return byKey.mezzo;
  if (v.includes('soprano')) return byKey.soprano;
  if (v.includes('contralto') || v.includes('alto')) return byKey.contralto;
  if (v.includes('countertenor')) return byKey.countertenor;
  if (v.includes('tenor')) return byKey.tenor;
  if (v.includes('baritone')) return byKey.baritone;
  if (v.includes('bass')) return byKey.bass;
  return null;
}

export interface VoicePersonalization {
  fach: VoiceTypeProfile;
  measuredLow: string;
  measuredHigh: string;
  measuredSemitones: number;
  typicalSemitones: number;
  /** Measured range vs the typical span for this Fach. */
  rangeComparison: 'narrower' | 'typical' | 'wider';
  /** Best passaggio guidance: the measured hint if present, else the Fach note. */
  passaggioFocus: string;
  stageLabel: string;
}

/**
 * Tailor Fach guidance to a singer's measured voice profile. `profile` is the
 * shape returned by getLatestVoiceProfile (lowestNote, highestNote,
 * rangeSemitones, passaggioHint, roadmapStage, voiceType).
 */
export function personalizeForProfile(profile: {
  voiceType: string;
  lowestNote: string;
  highestNote: string;
  rangeSemitones: number;
  passaggioHint: string | null;
  roadmapStage: string;
}): VoicePersonalization | null {
  const fach = fachForVoiceType(profile.voiceType);
  if (!fach) return null;

  const typicalSemitones = fach.midiHigh - fach.midiLow;
  const delta = profile.rangeSemitones - typicalSemitones;
  const rangeComparison: VoicePersonalization['rangeComparison'] =
    delta <= -4 ? 'narrower' : delta >= 4 ? 'wider' : 'typical';

  const stageLabel = profile.roadmapStage
    ? profile.roadmapStage.charAt(0).toUpperCase() + profile.roadmapStage.slice(1)
    : 'Beginner';

  return {
    fach,
    measuredLow: profile.lowestNote,
    measuredHigh: profile.highestNote,
    measuredSemitones: profile.rangeSemitones,
    typicalSemitones,
    rangeComparison,
    passaggioFocus: profile.passaggioHint?.trim() || fach.passaggioNote,
    stageLabel,
  };
}
