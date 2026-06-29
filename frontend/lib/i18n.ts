export const LOCALES = ['en', 'vi'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_COOKIE = 'sime_locale';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

export function normalizeLocale(value: unknown): Locale {
  if (isLocale(value)) return value;
  if (typeof value === 'string') {
    const language = value.toLowerCase().split(/[-_]/)[0];
    if (isLocale(language)) return language;
  }
  return DEFAULT_LOCALE;
}

export function pickLocaleFromAcceptLanguage(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;
  for (const part of header.split(',')) {
    const locale = normalizeLocale(part.trim().split(';')[0]);
    if (locale !== DEFAULT_LOCALE || part.toLowerCase().startsWith(DEFAULT_LOCALE)) {
      return locale;
    }
  }
  return DEFAULT_LOCALE;
}

export const dict = {
  en: {
    localeName: 'English',
    site: {
      name: 'Sime',
      tagline: 'Sing like you mean it.',
      description:
        'AI vocal coaching that hears every note, maps your range, and turns daily practice into real progress. Free for everyone.',
    },
    nav: {
      lessons: 'Lessons',
      study: 'Study',
      practice: 'Practice',
      voice: 'Voice',
      coach: 'Coach',
      studio: 'Studio',
      account: 'Account',
      docs: 'Docs',
      api: 'API',
      help: 'Help',
      about: 'About',
      startFree: 'Start free',
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
      language: 'Language',
    },
    footer: {
      product: 'Product',
      developers: 'Developers',
      company: 'Company',
      apiReference: 'API reference',
      guides: 'Guides',
      body:
        'AI vocal coaching for every voice, from your first clear note to the stage. Free for everyone.',
    },
    common: {
      lessons: 'lessons',
      lesson: 'lesson',
      min: 'min',
      minutes: 'minutes',
      to: 'to',
      allLessons: 'All lessons',
      startPractising: 'Start practising',
      practiceSession: 'Practice session',
      completed: 'completed',
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
      professional: 'Professional',
      read: 'Read',
    },
    home: {
      dashboard: 'Dashboard',
      studentDashboardLead: 'A simple course home for your voice training: check the next lesson, see your voice profile, and open the practice tools you need for class.',
      nextLesson: 'Next lesson',
      courseProgress: 'Course progress',
      practiceTools: 'Practice tools',
      practiceToolsLead: 'Short exercises for warm-up, pitch checking, and coach guidance before or after a lesson.',
      coursePlan: 'Course plan',
      previewLesson: 'Preview',
      welcomeBack: 'Welcome back',
      lessonsCompleted: 'lessons completed',
      lessonCompleted: 'lesson completed',
      curriculumComplete: 'Curriculum complete',
      continue: 'Continue',
      track: 'track',
      allDone:
        'You have worked through every lesson. Revisit any of them to keep your voice sharp.',
      lessonsLoading: 'Lessons are loading. Check the curriculum to begin.',
      revisitLesson: 'Revisit lesson',
      resumeLesson: 'Resume lesson',
      quickPractice: 'Quick practice',
      quickPracticeBody:
        'Open your mic and get a live, in-tune readout on any note you hold. No lesson needed.',
      startPractising: 'Start practising',
      voiceProfile: 'Voice profile',
      voiceType: 'Voice type',
      range: 'Range',
      stage: 'Stage',
      span: 'Span',
      semitones: 'semitones',
      seeVoiceGuide: 'See your voice-type guide',
      noProfile:
        'No voice profile yet. Map your range to find your voice type and colour.',
      runRangeTest: 'Run the range test',
      recentActivity: 'Recent activity',
      nothingLogged:
        'Nothing logged yet. Finish a lesson or run a practice session and it shows up here.',
      warmUp: 'Warm up',
      mapRange: 'Map your range',
      pitchTest: 'Pitch test',
      earTraining: 'Ear training',
      sustainTest: 'Sustain test',
      vowelDrill: 'Vowel drill',
      songKey: 'Find your song key',
      askCoach: 'Ask the coach',
      curriculum: 'Curriculum',
      studyHandbook: 'Study handbook',
      studioAnalysis: 'Studio and analysis',
      howSimeWorks: 'How Sime works',
      signedOutEyebrow: 'Your studio',
      signedOutTitle: 'Track your voice.',
      signedOutLead:
        'Sign in to save lesson progress, build a voice profile, and pick up where you left off. Or jump straight into practice. Every feature is free.',
      signIn: 'Sign in',
      tryPractice: 'Try practice',
      browseCurriculum: 'Browse the curriculum',
      livePitchPractice: 'Live pitch practice',
    },
    about: {
      title: 'Professional vocal training, for everyone.',
      description:
        'Sime makes professional vocal training accessible to everyone, for free, with AI feedback.',
      lead:
        'A great vocal coach can hear exactly what your voice needs and tell you how to fix it. Sime puts that in reach of anyone with a microphone.',
      p1:
        'Most people never get real vocal training. Lessons are costly, schedules are tight, and a good coach is hard to find. So talented voices stay rough, and beginners give up before they ever hear themselves improve.',
      p2:
        'Sime listens to every note the way a trained ear would, shows you what is happening in real time, and turns it into practice you can actually act on. The curriculum takes you from your first clear note to performing with confidence.',
      values: [
        {
          title: 'Real pedagogy',
          body:
            'Lessons follow proven vocal technique, not random tips. Foundations first, then power, then performance.',
        },
        {
          title: 'Built for every voice',
          body:
            'Sime measures your actual range and adapts. No assumptions about how high or low you should sing.',
        },
        {
          title: 'Free for everyone',
          body:
            'Good vocal coaching is expensive and gatekept. Sime is free so anyone can start, today.',
        },
      ],
      ctaTitle: 'Step into the spotlight.',
      ctaBody:
        'Allow your microphone and sing your first note. It is free, and it starts right now.',
    },
    lessonsPage: {
      title: 'A real curriculum, not a playlist.',
      description:
        'A structured vocal curriculum, from breath support to stage performance. Free for everyone.',
      eyebrow: 'Curriculum',
      lead:
        'Structured tracks built on proven vocal pedagogy. Every lesson is free and unlocked.',
      roadmapTitle: 'From first note to diva.',
      roadmapLead:
        'No one is born a pro. This is the path, and these tracks walk you up it. Sime keeps your pitch honest at every step; the artistry is the work you put in.',
      lectureLabel: 'Lecture',
      lectureCount: 'lectures',
      lessonCount: 'lessons',
      trackLevels: {
        foundations: 'Beginner',
        technique: 'Intermediate to advanced',
        performance: 'Professional',
        health: 'All levels',
      },
      roadmap: [
        {
          level: 'Beginner',
          focus: 'Build the instrument',
          body: 'Breath, posture, pitch, and resonance. Start in the Foundations track.',
        },
        {
          level: 'Intermediate',
          focus: 'Gain control',
          body: 'Bridge your registers into a mix and free your vibrato. The Technique track.',
        },
        {
          level: 'Advanced',
          focus: 'Power and agility',
          body: 'Belt without strain and sing clean runs. Technique into Performance.',
        },
        {
          level: 'Professional',
          focus: 'Diva or divo',
          body:
            'Consistency, stamina, stagecraft, and artistry that moves a room. The Performance track plus daily discipline.',
        },
      ],
    },
    practice: {
      title: 'Sing. Sime listens.',
      description:
        'Sing into your microphone and get live pitch feedback. Audio is processed in your browser.',
      eyebrow: 'Live session',
      lead:
        'Allow your microphone and hold a note. Your audio is analyzed in your browser and never uploaded.',
      rangePrompt: 'Want your full range and voice type? Run the',
      rangeTestLink: 'range test',
      thenFind: 'then find a song key with',
      newSession: 'New session? Start with a',
      orCheck: 'or check your ear with the',
      guidedWarmup: 'guided warm-up',
      smartTranspose: 'Smart Transpose',
    },
    rangeTest: {
      title: 'Map your range.',
      description:
        'Map your vocal range and find your voice type. Glide low to high and Sime measures your lowest and highest stable notes.',
      eyebrow: 'Diagnostic',
      lead:
        'The first step of any vocal plan. Glide from low to high, and Sime measures your range, then classifies your voice type and colour so lessons and song keys fit your instrument.',
      readFirst: 'New to this? Read',
      guide: 'Find your range and voice type',
      handbookFirst: 'in the study handbook first.',
    },
    account: {
      title: 'Account',
      description: 'Manage your Sime session and saved lesson progress.',
      signedInLead: 'Your session is active across lessons, practice, and progress.',
      signedOutTitle: 'Save your practice.',
      signedOutLead:
        'Create a free account or sign in to keep lesson progress tied to your voice profile.',
      session: 'Session',
      openStudio: 'Open Studio',
      progress: 'Progress',
      completedLessons: 'completed lessons',
      noProgress: 'No saved progress yet.',
    },
    auth: {
      signIn: 'Sign in',
      register: 'Register',
      displayName: 'Display name',
      email: 'Email',
      password: 'Password',
      invalidLogin: 'Invalid email or password.',
      createError: 'Could not create account.',
      backendUnavailable: 'Backend is unavailable.',
      working: 'Working',
      createAccount: 'Create account',
      signingOut: 'Signing out',
      signOut: 'Sign out',
    },
    progressButton: {
      saving: 'Saving',
      saved: 'Saved',
      markComplete: 'Mark complete',
      signInToSave: 'Sign in to save progress',
      couldNotSave: 'Could not save progress.',
    },
    lessonPage: {
      notFound: 'Lesson not found',
      back: 'All lessons',
      why: 'Why it works',
      how: 'How to do it',
      workout: 'The workout',
      workoutLead:
        'Repeatable drills with a dose. Fold them into your warm-up and come back to them daily.',
      listen: 'Listen and feel for',
      mistakes: 'Common mistakes',
      howSimeHelps: 'How Sime helps with this lesson',
      helpLead:
        'Sime listens for pitch only. It cannot see you or judge tone, so the rest is yours to feel and check.',
      simeChecks: 'Sime checks',
      selfCheck: 'Check these yourself',
      proTips: 'Pro tips',
      proTipsLead:
        'Coach-level cues, how professionals self-monitor without an AI watching, and the next step once the basics feel easy.',
      progression: 'Your progression',
      progressionLead:
        'From first attempt to stage ready. Know which rung you are on, and what the next one asks of you.',
      comingSoon:
        'A full step-by-step guide for this lesson is on the way. For now, open Practice and work the skill while Sime gives you a live, in-tune pitch readout.',
      deeper: 'Go deeper',
      deeperLead: 'The science behind this skill, in the study handbook.',
      practise: 'Practise this lesson',
      pickAnother: 'Pick another',
    },
    coach: {
      title: 'Ask your coach.',
      description:
        'Ask the AI vocal coach. It turns your voice profile and what you are working on into warm, safety-first practice guidance.',
      eyebrow: 'AI coach',
      lead:
        'A clinical vocal pedagogue, on tap. Describe your voice and what feels hard, and it answers with plain guidance and safe drills, never raw numbers.',
      disclaimer:
        'Coaching is AI-generated guidance, not medical advice. If anything hurts, stop and rest.',
      health: 'Vocal health and safety',
    },
    docs: {
      title: 'How Sime works.',
      metadataTitle: 'Docs',
      description:
        'How Sime works: getting started, pitch and range analysis, and how your audio is handled.',
      eyebrow: 'Manual',
      lead:
        'The full manual: setting up your mic, reading the pitch readout, following lessons, how the analysis works, and what happens to your audio.',
      onThisPage: 'On this page',
      buildingTitle: 'Building on Sime?',
      buildingBody: 'The REST API that powers lessons and progress is documented for you.',
      readApi: 'Read the API reference',
    },
    help: {
      title: 'Practise well.',
      description:
        'Answers to common questions about Sime: equipment, privacy, voice types, and more.',
      eyebrow: 'Help',
      lead: 'A simple routine to build your voice, plus answers to the questions people ask most.',
      routineTitle: 'A simple practice routine',
      routineBody:
        'Short and regular beats long and rare. Fifteen minutes most days is plenty. Build each session in three parts.',
      warmup: 'Warm up (5 min)',
      skill: 'Skill (7 min)',
      apply: 'Apply (3 min)',
      selfAssess: 'Assessing yourself',
      commonQuestions: 'Common questions',
      stillStuck: 'Still stuck?',
      stuckBody: 'Read the docs for a deeper walkthrough, or learn what powers Sime under the hood.',
      readDocs: 'Read the docs',
      aboutSime: 'About Sime',
    },
    apiDocs: {
      title: 'API reference.',
      metadataTitle: 'API reference',
      description:
        'REST API reference for the Sime backend: lessons, auth, progress, analysis, voice profiles, and worker endpoints.',
      eyebrow: 'Developers',
      lead:
        'The REST and websocket contracts behind Sime. Public lessons stay open; account, progress, jobs, voice profiles, and live frames require the session cookie.',
      authRequired: 'auth required',
      errorFormat: 'Error format',
      errorBody:
        'Errors return the matching HTTP status with a JSON body. Validation failures return 400 with a flattened list of issues.',
    },
    toolPages: {
      warmup: {
        title: 'Warm up first.',
        metaTitle: 'Warm-up',
        description:
          'A guided 12 minute SOVT warm-up: humming, lip trills, straw phonation, and open vowels, the science-backed way to ready your voice.',
        eyebrow: 'Routine',
        lead:
          'Semi-occluded warm-ups balance your vocal folds gently before any hard singing. Follow the timer through humming, lip trills, straw phonation, and open vowels.',
        note: 'Why these work:',
        link: 'SOVT warm-ups',
        suffix: 'in the study handbook.',
      },
      pitch: {
        title: 'Test your ear.',
        metaTitle: 'Pitch test',
        description:
          'Test your pitch matching. Sime plays a note, you sing it back, and it scores how close your ear and voice land over eight rounds.',
        eyebrow: 'Diagnostic',
        lead:
          'The other half of the onboarding check: can you hear a note and sing it back in tune? Sime plays a target, you match it, and scores your accuracy across eight rounds.',
        note: 'Want the theory? Read',
        link: 'How singing is measured',
        suffix: 'and practise on the',
        secondLink: 'pitch matching lesson',
      },
      transpose: {
        title: 'Find your key.',
        metaTitle: 'Find your key',
        description:
          'Smart Transpose: find the safest key to sing a song in, matched to your range so you never strain reaching notes that are not yours.',
        eyebrow: 'Tool',
        lead:
          "Singing a song in the wrong key is the fastest way to strain. Smart Transpose moves a song into your range, favouring a small shift that protects your voice while keeping the song's spirit.",
        note: 'How it works:',
        link: 'Choosing your key',
        suffix: 'in the study handbook.',
      },
      exercise: {
        title: 'Vowel scales.',
        metaTitle: 'Vowel scale',
        description:
          'A guided five-note scale on the Italian vowels. Sime leads each note and scores how cleanly you match it, building tone and forward placement.',
        eyebrow: 'Exercise',
        lead:
          'Stage three of the roadmap: clean tone on open vowels. Sime leads a five-note scale, you sing each note on a chosen vowel, and it scores how close you land.',
        note: 'The theory:',
        link: 'Resonance, vowels, and placement',
      },
      ear: {
        title: 'Name the interval.',
        metaTitle: 'Ear training',
        description:
          'Train relative pitch. Sime plays an interval and you name it, building the ear behind harmony and singing in tune without a reference.',
        eyebrow: 'Ear training',
        lead:
          'Relative pitch, the ability to hear the distance between two notes, is what lets you sing harmony and stay in tune with no reference. Train it here.',
        note: 'Then test your voice on the',
        link: 'pitch test',
        suffix: 'and the',
        secondLink: 'pitch matching lesson',
      },
      sustain: {
        title: 'Breath and sustain.',
        metaTitle: 'Breath test',
        description:
          'Hold one steady note as long as you can. Sime measures how long and how evenly you sustain it, a direct read on your breath support.',
        eyebrow: 'Diagnostic',
        lead:
          'Support is the foundation of every other skill. Hold one note, and Sime measures how long you sustain it and how steady the pitch and volume stay.',
        note: 'The science:',
        link: 'Breath and support',
        suffix: 'Build it on the',
        secondLink: 'breath support lesson',
      },
      study: {
        title: 'The vocal handbook.',
        metaTitle: 'Study',
        description:
          'The vocal handbook: anatomy, registers, breath, resonance, the passaggio, voice types, measurement, and health. The science behind the lessons.',
        eyebrow: 'Study',
        lead:
          "The science and pedagogy behind the lessons: how the voice works, how to train it safely, and what is really being measured. Read in any order, or follow a lesson's Go deeper link.",
        minRead: 'min read',
      },
    },
  },
  vi: {
    localeName: 'Tiếng Việt',
    site: {
      name: 'Sime',
      tagline: 'Hát đúng điều bạn muốn.',
      description:
        'Huấn luyện thanh nhạc bằng AI: nghe từng nốt, đo quãng giọng và biến luyện tập hằng ngày thành tiến bộ thật. Miễn phí cho mọi người.',
    },
    nav: {
      lessons: 'Bài học',
      study: 'Học liệu',
      practice: 'Luyện tập',
      voice: 'Giọng hát',
      coach: 'Huấn luyện',
      studio: 'Studio',
      account: 'Tài khoản',
      docs: 'Tài liệu',
      api: 'API',
      help: 'Trợ giúp',
      about: 'Giới thiệu',
      startFree: 'Bắt đầu miễn phí',
      openMenu: 'Mở menu',
      closeMenu: 'Đóng menu',
      language: 'Ngôn ngữ',
    },
    footer: {
      product: 'Sản phẩm',
      developers: 'Nhà phát triển',
      company: 'Công ty',
      apiReference: 'Tham chiếu API',
      guides: 'Hướng dẫn',
      body:
        'Huấn luyện thanh nhạc AI cho mọi giọng hát, từ nốt rõ đầu tiên đến sân khấu. Miễn phí cho mọi người.',
    },
    common: {
      lessons: 'bài học',
      lesson: 'bài học',
      min: 'phút',
      minutes: 'phút',
      to: 'đến',
      allLessons: 'Tất cả bài học',
      startPractising: 'Bắt đầu luyện tập',
      practiceSession: 'Buổi luyện tập',
      completed: 'đã hoàn thành',
      beginner: 'Sơ cấp',
      intermediate: 'Trung cấp',
      advanced: 'Nâng cao',
      professional: 'Chuyên nghiệp',
      read: 'Đọc',
    },
    home: {
      dashboard: 'Bảng điều khiển',
      studentDashboardLead: 'Một trang học đơn giản cho luyện giọng: xem bài hôm nay, kiểm tra hồ sơ giọng và mở công cụ luyện tập cần cho buổi học.',
      nextLesson: 'Bài học tiếp theo',
      courseProgress: 'Tiến độ khóa học',
      practiceTools: 'Công cụ luyện tập',
      practiceToolsLead: 'Các bài ngắn để khởi động, kiểm tra cao độ và hỏi huấn luyện viên trước hoặc sau bài học.',
      coursePlan: 'Kế hoạch khóa học',
      previewLesson: 'Xem trước',
      welcomeBack: 'Chào mừng trở lại',
      lessonsCompleted: 'bài học đã hoàn thành',
      lessonCompleted: 'bài học đã hoàn thành',
      curriculumComplete: 'Đã hoàn thành giáo trình',
      continue: 'Tiếp tục',
      track: 'lộ trình',
      allDone: 'Bạn đã đi qua toàn bộ bài học. Hãy ôn lại để giữ giọng luôn sắc nét.',
      lessonsLoading: 'Đang tải bài học. Mở giáo trình để bắt đầu.',
      revisitLesson: 'Ôn lại bài học',
      resumeLesson: 'Tiếp tục bài học',
      quickPractice: 'Luyện nhanh',
      quickPracticeBody:
        'Mở micro và xem ngay bạn đang đúng cao độ trên bất kỳ nốt nào đang giữ. Không cần vào bài học.',
      startPractising: 'Bắt đầu luyện tập',
      voiceProfile: 'Hồ sơ giọng hát',
      voiceType: 'Loại giọng',
      range: 'Quãng giọng',
      stage: 'Trình độ',
      span: 'Độ rộng',
      semitones: 'bán cung',
      seeVoiceGuide: 'Xem hướng dẫn loại giọng',
      noProfile: 'Chưa có hồ sơ giọng hát. Hãy đo quãng giọng để tìm loại và màu giọng.',
      runRangeTest: 'Chạy kiểm tra quãng giọng',
      recentActivity: 'Hoạt động gần đây',
      nothingLogged:
        'Chưa có hoạt động nào. Hoàn thành một bài học hoặc buổi luyện tập để thấy tại đây.',
      warmUp: 'Khởi động',
      mapRange: 'Đo quãng giọng',
      pitchTest: 'Kiểm tra cao độ',
      earTraining: 'Luyện cảm âm',
      sustainTest: 'Giữ nốt dài',
      vowelDrill: 'Luyện nguyên âm',
      songKey: 'Tìm tông bài hát',
      askCoach: 'Hỏi huấn luyện viên',
      curriculum: 'Giáo trình',
      studyHandbook: 'Sổ tay học',
      studioAnalysis: 'Studio và phân tích',
      howSimeWorks: 'Cách Sime hoạt động',
      signedOutEyebrow: 'Studio của bạn',
      signedOutTitle: 'Theo dõi giọng hát của bạn.',
      signedOutLead:
        'Đăng nhập để lưu tiến độ bài học, xây hồ sơ giọng hát và tiếp tục từ nơi bạn dừng lại. Hoặc vào luyện tập ngay. Tất cả đều miễn phí.',
      signIn: 'Đăng nhập',
      tryPractice: 'Thử luyện tập',
      browseCurriculum: 'Xem giáo trình',
      livePitchPractice: 'Luyện cao độ trực tiếp',
    },
    about: {
      title: 'Huấn luyện thanh nhạc chuyên nghiệp cho mọi người.',
      description:
        'Sime đưa huấn luyện thanh nhạc chuyên nghiệp đến mọi người miễn phí, với phản hồi AI.',
      lead:
        'Một huấn luyện viên giỏi nghe được giọng bạn cần gì và chỉ cách sửa. Sime đưa điều đó đến bất kỳ ai có micro.',
      p1:
        'Phần lớn mọi người không có cơ hội học thanh nhạc đúng nghĩa. Chi phí cao, lịch khó khớp và huấn luyện viên giỏi không dễ tìm. Vì vậy nhiều giọng hát có tiềm năng vẫn thô, còn người mới bỏ cuộc trước khi nghe mình tiến bộ.',
      p2:
        'Sime lắng nghe từng nốt như một đôi tai được đào tạo, cho bạn thấy điều đang xảy ra theo thời gian thực và biến nó thành bài tập có thể làm ngay. Giáo trình đưa bạn từ nốt rõ đầu tiên đến biểu diễn tự tin.',
      values: [
        {
          title: 'Sư phạm thật',
          body:
            'Bài học dựa trên kỹ thuật thanh nhạc đã được kiểm chứng, không phải mẹo rời rạc. Nền tảng trước, rồi sức mạnh, rồi biểu diễn.',
        },
        {
          title: 'Dành cho mọi giọng',
          body:
            'Sime đo quãng giọng thật của bạn và thích nghi. Không áp đặt bạn phải hát cao hay thấp đến đâu.',
        },
        {
          title: 'Miễn phí cho mọi người',
          body:
            'Huấn luyện giọng hát tốt thường đắt và khó tiếp cận. Sime miễn phí để ai cũng có thể bắt đầu hôm nay.',
        },
      ],
      ctaTitle: 'Bước vào ánh đèn sân khấu.',
      ctaBody: 'Cho phép micro và hát nốt đầu tiên. Miễn phí, và bắt đầu ngay bây giờ.',
    },
    lessonsPage: {
      title: 'Một giáo trình thật, không phải danh sách phát.',
      description:
        'Giáo trình thanh nhạc có cấu trúc, từ hơi thở đến biểu diễn sân khấu. Miễn phí cho mọi người.',
      eyebrow: 'Giáo trình',
      lead: 'Các lộ trình dựa trên sư phạm thanh nhạc đã kiểm chứng. Mọi bài học đều mở miễn phí.',
      roadmapTitle: 'Từ nốt đầu tiên đến diva.',
      roadmapLead:
        'Không ai sinh ra đã là chuyên nghiệp. Đây là con đường, và các lộ trình này đưa bạn đi lên từng bước. Sime giữ cao độ trung thực; nghệ thuật nằm ở công sức của bạn.',
      lectureLabel: 'Bài giảng',
      lectureCount: 'bài giảng',
      lessonCount: 'bài học',
      trackLevels: {
        foundations: 'Sơ cấp',
        technique: 'Trung cấp đến nâng cao',
        performance: 'Chuyên nghiệp',
        health: 'Mọi trình độ',
      },
      roadmap: [
        {
          level: 'Sơ cấp',
          focus: 'Xây nền nhạc cụ',
          body: 'Hơi thở, tư thế, cao độ và cộng hưởng. Bắt đầu ở lộ trình Nền tảng.',
        },
        {
          level: 'Trung cấp',
          focus: 'Tăng kiểm soát',
          body: 'Nối các register thành mix và giải phóng vibrato. Lộ trình Kỹ thuật.',
        },
        {
          level: 'Nâng cao',
          focus: 'Sức mạnh và linh hoạt',
          body: 'Belt không căng và hát run sạch. Từ Kỹ thuật đến Biểu diễn.',
        },
        {
          level: 'Chuyên nghiệp',
          focus: 'Diva hoặc divo',
          body:
            'Độ ổn định, sức bền, sân khấu và nghệ thuật chạm đến khán phòng. Lộ trình Biểu diễn cùng kỷ luật hằng ngày.',
        },
      ],
    },
    practice: {
      title: 'Hát. Sime lắng nghe.',
      description: 'Hát vào micro và nhận phản hồi cao độ trực tiếp. Âm thanh được xử lý trong trình duyệt.',
      eyebrow: 'Buổi luyện trực tiếp',
      lead: 'Cho phép micro và giữ một nốt. Âm thanh được phân tích trong trình duyệt và không tải lên.',
      rangePrompt: 'Muốn biết toàn bộ quãng giọng và loại giọng? Hãy chạy',
      rangeTestLink: 'kiểm tra quãng giọng',
      thenFind: 'rồi tìm tông bài hát bằng',
      newSession: 'Buổi mới? Bắt đầu với',
      orCheck: 'hoặc kiểm tra tai nghe bằng',
      guidedWarmup: 'khởi động có hướng dẫn',
      smartTranspose: 'Smart Transpose',
    },
    rangeTest: {
      title: 'Đo quãng giọng của bạn.',
      description:
        'Đo quãng giọng và tìm loại giọng. Lướt từ thấp lên cao để Sime đo các nốt ổn định thấp nhất và cao nhất.',
      eyebrow: 'Chẩn đoán',
      lead:
        'Bước đầu tiên của mọi kế hoạch luyện giọng. Lướt từ thấp lên cao để Sime đo quãng giọng, phân loại giọng và màu giọng, giúp bài học và tông bài hát hợp với bạn.',
      readFirst: 'Mới bắt đầu? Đọc',
      guide: 'Tìm quãng giọng và loại giọng',
      handbookFirst: 'trong sổ tay học trước.',
    },
    account: {
      title: 'Tài khoản',
      description: 'Quản lý phiên đăng nhập Sime và tiến độ bài học đã lưu.',
      signedInLead: 'Phiên của bạn đang hoạt động trên bài học, luyện tập và tiến độ.',
      signedOutTitle: 'Lưu việc luyện tập của bạn.',
      signedOutLead:
        'Tạo tài khoản miễn phí hoặc đăng nhập để giữ tiến độ bài học gắn với hồ sơ giọng hát.',
      session: 'Phiên đăng nhập',
      openStudio: 'Mở Studio',
      progress: 'Tiến độ',
      completedLessons: 'bài học đã hoàn thành',
      noProgress: 'Chưa có tiến độ đã lưu.',
    },
    auth: {
      signIn: 'Đăng nhập',
      register: 'Đăng ký',
      displayName: 'Tên hiển thị',
      email: 'Email',
      password: 'Mật khẩu',
      invalidLogin: 'Email hoặc mật khẩu không đúng.',
      createError: 'Không thể tạo tài khoản.',
      backendUnavailable: 'Backend hiện không khả dụng.',
      working: 'Đang xử lý',
      createAccount: 'Tạo tài khoản',
      signingOut: 'Đang đăng xuất',
      signOut: 'Đăng xuất',
    },
    progressButton: {
      saving: 'Đang lưu',
      saved: 'Đã lưu',
      markComplete: 'Đánh dấu hoàn thành',
      signInToSave: 'Đăng nhập để lưu tiến độ',
      couldNotSave: 'Không thể lưu tiến độ.',
    },
    lessonPage: {
      notFound: 'Không tìm thấy bài học',
      back: 'Tất cả bài học',
      why: 'Vì sao hiệu quả',
      how: 'Cách thực hiện',
      workout: 'Bài tập',
      workoutLead:
        'Các bài drill có liều lượng rõ ràng. Gộp vào phần khởi động và quay lại hằng ngày.',
      listen: 'Lắng nghe và cảm nhận',
      mistakes: 'Lỗi thường gặp',
      howSimeHelps: 'Sime giúp gì trong bài này',
      helpLead:
        'Sime chỉ nghe cao độ. Sime không nhìn thấy bạn hoặc đánh giá màu giọng, nên phần còn lại là điều bạn tự cảm nhận và kiểm tra.',
      simeChecks: 'Sime kiểm tra',
      selfCheck: 'Bạn tự kiểm tra',
      proTips: 'Mẹo chuyên môn',
      proTipsLead:
        'Gợi ý ở cấp huấn luyện viên, cách người chuyên nghiệp tự theo dõi khi không có AI quan sát, và bước tiếp theo khi phần cơ bản đã dễ.',
      progression: 'Tiến trình của bạn',
      progressionLead:
        'Từ lần thử đầu đến sẵn sàng lên sân khấu. Biết mình đang ở bậc nào và bậc tiếp theo yêu cầu gì.',
      comingSoon:
        'Hướng dẫn từng bước đầy đủ cho bài này đang được chuẩn bị. Hiện tại, hãy mở Luyện tập và làm kỹ năng trong khi Sime cho bạn chỉ báo cao độ trực tiếp.',
      deeper: 'Tìm hiểu sâu hơn',
      deeperLead: 'Khoa học phía sau kỹ năng này trong sổ tay học.',
      practise: 'Luyện bài này',
      pickAnother: 'Chọn bài khác',
    },
    coach: {
      title: 'Hỏi huấn luyện viên của bạn.',
      description:
        'Hỏi huấn luyện viên thanh nhạc AI. Sime biến hồ sơ giọng hát và phần bạn đang luyện thành hướng dẫn ấm áp, an toàn và dễ làm.',
      eyebrow: 'Huấn luyện AI',
      lead:
        'Một nhà sư phạm thanh nhạc lâm sàng luôn sẵn sàng. Mô tả giọng hát và điều đang khó, Sime trả lời bằng hướng dẫn rõ ràng và bài tập an toàn, không phơi bày số liệu thô.',
      disclaimer:
        'Hướng dẫn do AI tạo ra, không phải lời khuyên y tế. Nếu thấy đau, hãy dừng và nghỉ.',
      health: 'Sức khỏe và an toàn giọng hát',
    },
    docs: {
      title: 'Cách Sime hoạt động.',
      metadataTitle: 'Tài liệu',
      description: 'Cách Sime hoạt động: bắt đầu, phân tích cao độ/quãng giọng và xử lý âm thanh.',
      eyebrow: 'Sổ tay',
      lead:
        'Sổ tay đầy đủ: thiết lập micro, đọc chỉ báo cao độ, theo bài học, cách phân tích hoạt động và điều xảy ra với âm thanh của bạn.',
      onThisPage: 'Trong trang này',
      buildingTitle: 'Xây dựng trên Sime?',
      buildingBody: 'REST API dùng cho bài học và tiến độ đã được ghi tài liệu.',
      readApi: 'Đọc tham chiếu API',
    },
    help: {
      title: 'Luyện tập đúng cách.',
      description: 'Câu trả lời cho các câu hỏi thường gặp về Sime: thiết bị, quyền riêng tư, loại giọng và hơn nữa.',
      eyebrow: 'Trợ giúp',
      lead: 'Một routine đơn giản để xây giọng, cùng câu trả lời cho các câu hỏi thường gặp.',
      routineTitle: 'Một routine luyện tập đơn giản',
      routineBody:
        'Ngắn và đều tốt hơn dài nhưng hiếm. Mười lăm phút hầu hết các ngày là đủ. Chia mỗi buổi thành ba phần.',
      warmup: 'Khởi động (5 phút)',
      skill: 'Kỹ năng (7 phút)',
      apply: 'Ứng dụng (3 phút)',
      selfAssess: 'Tự đánh giá',
      commonQuestions: 'Câu hỏi thường gặp',
      stillStuck: 'Vẫn bị kẹt?',
      stuckBody: 'Đọc tài liệu để xem hướng dẫn sâu hơn, hoặc tìm hiểu Sime hoạt động thế nào.',
      readDocs: 'Đọc tài liệu',
      aboutSime: 'Giới thiệu Sime',
    },
    apiDocs: {
      title: 'Tham chiếu API.',
      metadataTitle: 'Tham chiếu API',
      description:
        'Tham chiếu REST API cho backend Sime: bài học, xác thực, tiến độ, phân tích, hồ sơ giọng hát và endpoint worker.',
      eyebrow: 'Nhà phát triển',
      lead:
        'Các hợp đồng REST và websocket phía sau Sime. Bài học công khai vẫn mở; tài khoản, tiến độ, job, hồ sơ giọng hát và frame trực tiếp cần cookie phiên.',
      authRequired: 'cần xác thực',
      errorFormat: 'Định dạng lỗi',
      errorBody:
        'Lỗi trả về đúng HTTP status cùng JSON. Lỗi xác thực dữ liệu trả về 400 với danh sách vấn đề đã làm phẳng.',
    },
    toolPages: {
      warmup: {
        title: 'Khởi động trước.',
        metaTitle: 'Khởi động',
        description:
          'Bài khởi động SOVT 12 phút có hướng dẫn: humming, lip trill, straw phonation và nguyên âm mở, theo cách có cơ sở khoa học để sẵn sàng hát.',
        eyebrow: 'Routine',
        lead:
          'Khởi động bán khép giúp cân bằng dây thanh nhẹ nhàng trước khi hát nặng. Theo bộ đếm qua humming, lip trill, straw phonation và nguyên âm mở.',
        note: 'Vì sao hiệu quả:',
        link: 'Khởi động SOVT',
        suffix: 'trong sổ tay học.',
      },
      pitch: {
        title: 'Kiểm tra tai nghe.',
        metaTitle: 'Kiểm tra cao độ',
        description:
          'Kiểm tra khả năng bắt cao độ. Sime phát một nốt, bạn hát lại và Sime chấm độ chính xác qua tám vòng.',
        eyebrow: 'Chẩn đoán',
        lead:
          'Nửa còn lại của kiểm tra đầu vào: bạn có nghe một nốt và hát lại đúng cao độ không? Sime phát mục tiêu, bạn bắt lại và Sime chấm độ chính xác qua tám vòng.',
        note: 'Muốn hiểu lý thuyết? Đọc',
        link: 'Cách đo giọng hát',
        suffix: 'và luyện ở',
        secondLink: 'bài bắt cao độ',
      },
      transpose: {
        title: 'Tìm tông phù hợp.',
        metaTitle: 'Tìm tông',
        description:
          'Smart Transpose: tìm tông an toàn nhất cho bài hát, khớp với quãng giọng để bạn không căng khi với nốt không thuộc giọng mình.',
        eyebrow: 'Công cụ',
        lead:
          'Hát sai tông là cách nhanh nhất để căng giọng. Smart Transpose chuyển bài hát vào quãng của bạn, ưu tiên dịch ít để bảo vệ giọng mà vẫn giữ tinh thần bài hát.',
        note: 'Cách hoạt động:',
        link: 'Chọn tông của bạn',
        suffix: 'trong sổ tay học.',
      },
      exercise: {
        title: 'Scale nguyên âm.',
        metaTitle: 'Scale nguyên âm',
        description:
          'Scale năm nốt có hướng dẫn trên nguyên âm Ý. Sime dẫn từng nốt và chấm độ sạch khi bạn bắt lại, giúp xây màu giọng và vị trí âm thanh phía trước.',
        eyebrow: 'Bài tập',
        lead:
          'Giai đoạn ba của lộ trình: màu giọng sạch trên nguyên âm mở. Sime dẫn scale năm nốt, bạn hát từng nốt trên nguyên âm đã chọn và Sime chấm độ chính xác.',
        note: 'Lý thuyết:',
        link: 'Cộng hưởng, nguyên âm và vị trí âm',
      },
      ear: {
        title: 'Gọi tên quãng.',
        metaTitle: 'Luyện tai',
        description:
          'Luyện cao độ tương đối. Sime phát một quãng và bạn gọi tên, xây đôi tai cho hòa âm và hát đúng khi không có nốt tham chiếu.',
        eyebrow: 'Luyện tai',
        lead:
          'Cao độ tương đối, khả năng nghe khoảng cách giữa hai nốt, giúp bạn hát bè và giữ đúng cao độ khi không có tham chiếu. Luyện tại đây.',
        note: 'Sau đó kiểm tra giọng ở',
        link: 'kiểm tra cao độ',
        suffix: 'và',
        secondLink: 'bài bắt cao độ',
      },
      sustain: {
        title: 'Hơi thở và giữ âm.',
        metaTitle: 'Kiểm tra hơi thở',
        description:
          'Giữ một nốt ổn định lâu nhất có thể. Sime đo thời lượng và độ đều khi bạn giữ nốt, phản ánh trực tiếp hơi thở nâng đỡ.',
        eyebrow: 'Chẩn đoán',
        lead:
          'Support là nền tảng của mọi kỹ năng. Giữ một nốt và Sime đo bạn giữ được bao lâu, cao độ và âm lượng ổn định thế nào.',
        note: 'Khoa học:',
        link: 'Hơi thở và support',
        suffix: 'Xây nó trong',
        secondLink: 'bài hơi thở nâng đỡ',
      },
      study: {
        title: 'Sổ tay thanh nhạc.',
        metaTitle: 'Học liệu',
        description:
          'Sổ tay thanh nhạc: giải phẫu, register, hơi thở, cộng hưởng, passaggio, loại giọng, đo lường và sức khỏe. Khoa học phía sau bài học.',
        eyebrow: 'Học liệu',
        lead:
          'Khoa học và sư phạm phía sau bài học: giọng hoạt động thế nào, luyện an toàn ra sao và điều gì thật sự được đo. Đọc theo thứ tự bất kỳ hoặc theo liên kết Tìm hiểu sâu trong bài học.',
        minRead: 'phút đọc',
      },
    },
  },
} as const;

export type Dictionary = (typeof dict)[Locale];

export function getDictionary(locale: Locale = DEFAULT_LOCALE): Dictionary {
  return dict[locale] ?? dict[DEFAULT_LOCALE];
}



