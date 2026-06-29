import type { Locale } from '../lib/i18n';
import { eduxSubject } from './eduxProgram';

/** A lesson as listed inside a lecture. */
export interface LessonSummary {
  id: string;
  title: string;
  durationMin: number;
  weekNumber?: number | null;
  targetMetrics?: Record<string, unknown>;
}

/** A lecture: a themed group of lessons inside a subject. */
export interface Lecture {
  id: string;
  title: string;
  summary: string;
  lessons: LessonSummary[];
}

/** A subject (stored as a lesson_track row): the top curriculum unit. */
export interface Subject {
  id: string;
  name: string;
  summary: string;
  lectures: Lecture[];
  /** Flattened lessons across all lectures, kept for older clients. */
  lessons: LessonSummary[];
}

/** A single lesson with its subject and lecture context. */
export interface LessonDetail extends LessonSummary {
  trackId: string;
  subjectId: string;
  subjectName: string;
  lectureId: string;
  lectureTitle: string;
}

type SubjectInput = Omit<Subject, 'lessons'>;

function makeSubject(input: SubjectInput): Subject {
  return {
    ...input,
    lessons: input.lectures.flatMap((lecture) => lecture.lessons),
  };
}

// Static curriculum - mirrors prisma/seed.ts and serves as the fallback when
// the database is not configured. Keep both in sync when editing lessons.
export const subjects: Subject[] = [
  eduxSubject,
  makeSubject({
    id: 'foundations',
    name: 'Foundations',
    summary: 'The base every voice needs.',
    lectures: [
      {
        id: 'foundations-setup',
        title: 'Set up the voice',
        summary: 'Breath, posture, and body setup before harder singing.',
        lessons: [
          { id: 'breath-support', title: 'Breath support and control', durationMin: 8 },
          { id: 'posture', title: 'Posture and alignment', durationMin: 6 },
        ],
      },
      {
        id: 'foundations-pitch-tone',
        title: 'Pitch and tone fundamentals',
        summary: 'Train accurate notes, resonance, and clean note starts.',
        lessons: [
          { id: 'pitch-matching', title: 'Pitch matching and ear training', durationMin: 10 },
          { id: 'resonance-basics', title: 'Resonance basics', durationMin: 9 },
          { id: 'onset-control', title: 'Onset and cord closure', durationMin: 8 },
        ],
      },
    ],
  }),
  makeSubject({
    id: 'technique',
    name: 'Technique',
    summary: 'Build power and flexibility.',
    lectures: [
      {
        id: 'technique-bridge',
        title: 'Bridge the registers',
        summary: 'Connect chest, mix, head voice, and passaggio without a break.',
        lessons: [
          { id: 'mixed-voice', title: 'Mixed voice and bridging registers', durationMin: 12 },
          { id: 'passaggio-bridging', title: 'Bridging the passaggio', durationMin: 11 },
        ],
      },
      {
        id: 'technique-power-color',
        title: 'Power, color, and control',
        summary: 'Build belt, vibrato, agility, and vowel tuning safely.',
        lessons: [
          { id: 'belting', title: 'Belting without strain', durationMin: 11 },
          { id: 'vibrato', title: 'Vibrato control', durationMin: 9 },
          { id: 'agility', title: 'Agility and runs', durationMin: 10 },
          { id: 'vowels-formants', title: 'Vowels and resonance tuning', durationMin: 10 },
        ],
      },
    ],
  }),
  makeSubject({
    id: 'performance',
    name: 'Performance',
    summary: 'Turn technique into music.',
    lectures: [
      {
        id: 'performance-expression',
        title: 'Expression and interpretation',
        summary: 'Shape phrases and make song choices that move a listener.',
        lessons: [
          { id: 'phrasing', title: 'Phrasing and dynamics', durationMin: 10 },
          { id: 'interpretation', title: 'Song interpretation', durationMin: 12 },
        ],
      },
      {
        id: 'performance-stage',
        title: 'Stage and microphone craft',
        summary: 'Bring the voice into performance conditions with confidence.',
        lessons: [
          { id: 'stage-presence', title: 'Stage presence and nerves', durationMin: 8 },
          { id: 'mic-technique', title: 'Microphone technique', durationMin: 7 },
        ],
      },
      {
        id: 'performance-runs',
        title: 'Runs and riffs',
        summary: 'Make fast melodic decoration clean, musical, and in tune.',
        lessons: [{ id: 'runs-riffs', title: 'Runs and riffs', durationMin: 10 }],
      },
    ],
  }),
  makeSubject({
    id: 'health',
    name: 'Vocal Health',
    summary: 'Sing for life, not just today.',
    lectures: [
      {
        id: 'health-care',
        title: 'Vocal care and recovery',
        summary: 'Protect the voice, manage strain, and recover after singing.',
        lessons: [
          { id: 'vocal-health', title: 'Vocal health and warm-down', durationMin: 7 },
          { id: 'avoid-strain', title: 'Singing without strain', durationMin: 9 },
        ],
      },
    ],
  }),
  makeSubject({
    id: 'music-theory',
    name: 'Music Theory for Singers',
    summary: 'Essential music theory to understand sheet music and your voice.',
    lectures: [
      {
        id: 'theory-basics',
        title: 'Reading the Language of Music',
        summary: 'Master notes, rhythms, scales, and the foundations of reading sheet music.',
        lessons: [
          { id: 'reading-notes', title: 'Reading Notes and Staves', durationMin: 12 },
          { id: 'rhythm-tempo', title: 'Rhythm, Time Signatures, and Tempo', durationMin: 10 },
          { id: 'scales-keys', title: 'Scales and Key Signatures', durationMin: 15 },
        ],
      },
      {
        id: 'theory-harmony',
        title: 'Pitch, Intervals, and Harmony',
        summary: 'Train your ear, understand intervals, and learn how chords work for harmonization.',
        lessons: [
          { id: 'intervals-chords', title: 'Intervals and Building Chords', durationMin: 15 },
          { id: 'pitch-types', title: 'Perfect Pitch vs Relative Pitch', durationMin: 8 },
        ],
      },
      {
        id: 'theory-voice',
        title: 'The Singer\'s Compass',
        summary: 'Understand vocal ranges, tessitura, and how to find your true voice type.',
        lessons: [
          { id: 'voice-types', title: 'Voice Types, Tessitura, and Transposition', durationMin: 10 },
        ],
      },
    ],
  }),
];

/** Legacy alias: older callers still call subjects "tracks". */
export const tracks = subjects;

interface ViSubjectCopy {
  name: string;
  summary: string;
  lectures: Record<string, { title: string; summary: string }>;
  lessons: Record<string, string>;
}

const viSubjectCopy: Record<string, ViSubjectCopy> = {
  foundations: {
    name: 'Nền tảng',
    summary: 'Phần căn bản mọi giọng hát đều cần.',
    lectures: {
      'foundations-setup': {
        title: 'Thiết lập giọng hát',
        summary: 'Hơi thở, tư thế và cơ thể trước khi hát khó hơn.',
      },
      'foundations-pitch-tone': {
        title: 'Nền tảng cao độ và âm sắc',
        summary: 'Luyện nốt chính xác, cộng hưởng và khởi âm sạch.',
      },
    },
    lessons: {
      'breath-support': 'Hơi thở nâng đỡ và kiểm soát',
      posture: 'Tư thế và căn chỉnh cơ thể',
      'pitch-matching': 'Bắt cao độ và luyện tai',
      'resonance-basics': 'Cơ bản về cộng hưởng',
      'onset-control': 'Khởi âm và độ khép thanh đới',
    },
  },
  technique: {
    name: 'Kỹ thuật',
    summary: 'Xây sức mạnh và độ linh hoạt.',
    lectures: {
      'technique-bridge': {
        title: 'Nối các register',
        summary: 'Kết nối chest, mix, head voice và passaggio không bị gãy.',
      },
      'technique-power-color': {
        title: 'Sức mạnh, màu giọng và kiểm soát',
        summary: 'Xây belt, vibrato, độ linh hoạt và nguyên âm một cách an toàn.',
      },
    },
    lessons: {
      'mixed-voice': 'Giọng mix và nối register',
      belting: 'Belting không căng',
      vibrato: 'Kiểm soát vibrato',
      agility: 'Linh hoạt và runs',
      'vowels-formants': 'Nguyên âm và chỉnh cộng hưởng',
      'passaggio-bridging': 'Vượt qua passaggio',
    },
  },
  performance: {
    name: 'Biểu diễn',
    summary: 'Biến kỹ thuật thành âm nhạc.',
    lectures: {
      'performance-expression': {
        title: 'Biểu cảm và diễn giải',
        summary: 'Tạo câu hát và lựa chọn âm nhạc chạm tới người nghe.',
      },
      'performance-stage': {
        title: 'Sân khấu và kỹ thuật micro',
        summary: 'Mang giọng hát vào điều kiện biểu diễn thật với tự tin.',
      },
      'performance-runs': {
        title: 'Run và riff',
        summary: 'Làm các đoạn luyến nhanh sạch, có nhạc tính và đúng cao độ.',
      },
    },
    lessons: {
      phrasing: 'Phrasing và sắc thái',
      'stage-presence': 'Hiện diện sân khấu và kiểm soát hồi hộp',
      'mic-technique': 'Kỹ thuật micro',
      interpretation: 'Diễn giải bài hát',
      'runs-riffs': 'Run và riff',
    },
  },
  health: {
    name: 'Sức khỏe giọng hát',
    summary: 'Hát bền lâu, không chỉ hôm nay.',
    lectures: {
      'health-care': {
        title: 'Chăm sóc và phục hồi giọng',
        summary: 'Bảo vệ giọng, quản lý căng giọng và hồi phục sau khi hát.',
      },
    },
    lessons: {
      'vocal-health': 'Sức khỏe giọng và hạ giọng',
      'avoid-strain': 'Hát không căng',
    },
  },
  'music-theory': {
    name: 'Nhạc lý Thanh nhạc',
    summary: 'Nhạc lý thiết yếu từ cơ bản đến chuẩn Nhạc viện dành cho ca sĩ.',
    lectures: {
      'theory-basics': {
        title: 'Ngôn ngữ của Âm nhạc',
        summary: 'Nắm vững nốt nhạc, nhịp điệu, âm giai và nền tảng đọc bản nhạc.',
      },
      'theory-harmony': {
        title: 'Cao độ, Quãng và Hòa âm',
        summary: 'Luyện cảm âm, hiểu về quãng và cấu tạo hợp âm để hát bè.',
      },
      'theory-voice': {
        title: 'La bàn của Ca sĩ',
        summary: 'Hiểu về quãng giọng, cữ âm (Tessitura) và phân loại giọng hát.',
      },
    },
    lessons: {
      'reading-notes': 'Đọc nốt và Khuông nhạc',
      'rhythm-tempo': 'Nhịp điệu, Trường độ và Tempo',
      'scales-keys': 'Âm giai và Hóa biểu',
      'intervals-chords': 'Quãng và Cấu tạo Hợp âm',
      'pitch-types': 'Cao độ Tuyệt đối vs Tương đối',
      'voice-types': 'Loại giọng, Cữ âm và Dịch tông',
    },
  },
};

export function localizeSubjects(input: Subject[], locale: Locale): Subject[] {
  if (locale !== 'vi') return input;
  return input.map((subject) => {
    const copy = viSubjectCopy[subject.id];
    if (!copy) return subject;
    const lectures = subject.lectures.map((lecture) => {
      const lectureCopy = copy.lectures[lecture.id];
      return {
        ...lecture,
        title: lectureCopy?.title ?? lecture.title,
        summary: lectureCopy?.summary ?? lecture.summary,
        lessons: lecture.lessons.map((lesson) => ({
          ...lesson,
          title: copy.lessons[lesson.id] ?? lesson.title,
        })),
      };
    });
    return {
      ...subject,
      name: copy.name,
      summary: copy.summary,
      lectures,
      lessons: lectures.flatMap((lecture) => lecture.lessons),
    };
  });
}

/** Legacy alias for the track naming. */
export const localizeTracks = localizeSubjects;

export function localizeLesson(lesson: LessonDetail, locale: Locale): LessonDetail {
  if (locale !== 'vi') return lesson;
  const copy = viSubjectCopy[lesson.subjectId];
  if (!copy) return lesson;
  return {
    ...lesson,
    title: copy.lessons[lesson.id] ?? lesson.title,
    subjectName: copy.name,
    lectureTitle: copy.lectures[lesson.lectureId]?.title ?? lesson.lectureTitle,
  };
}

export function findLesson(id: string): LessonDetail | undefined {
  for (const subject of subjects) {
    for (const lecture of subject.lectures) {
      const lesson = lecture.lessons.find((item) => item.id === id);
      if (lesson) {
        return {
          ...lesson,
          trackId: subject.id,
          subjectId: subject.id,
          subjectName: subject.name,
          lectureId: lecture.id,
          lectureTitle: lecture.title,
        };
      }
    }
  }
  return undefined;
}

