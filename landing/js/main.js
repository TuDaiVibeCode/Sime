/* =========================================================
   Sime - landing interactions
   Vanilla JS. No dependencies. No inline handlers.
   Security: no innerHTML on dynamic/user data (textContent only),
   no eval, all DOM writes are static strings.
   Motion: IntersectionObserver + rAF (no scroll listeners),
   fully gated by prefers-reduced-motion.
   ========================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LOCALE_COOKIE = 'sime_locale';
  var locale = detectLocale();

  var viText = {
    'Skip to content': 'Bỏ qua đến nội dung',
    'Open menu': 'Mở menu',
    'Close menu': 'Đóng menu',
    'How it works': 'Cách hoạt động',
    'Features': 'Tính năng',
    'Lessons': 'Bài học',
    'Free': 'Miễn phí',
    'Sign in': 'Đăng nhập',
    'Start free': 'Bắt đầu miễn phí',
    'AI vocal coach': 'Huấn luyện thanh nhạc AI',
    'Sing like': 'Hát đúng',
    'you mean it.': 'điều bạn muốn.',
    'Personal AI vocal coaching that hears every note, maps your range, and turns daily practice into real, measurable progress.':
      'Huấn luyện thanh nhạc AI nghe từng nốt, đo quãng giọng và biến luyện tập hằng ngày thành tiến bộ thật, đo được.',
    'Hear it in action': 'Xem cách hoạt động',
    'Live session': 'Buổi luyện trực tiếp',
    'Lesson 04 · Sustained tone': 'Bài 04 · Giữ âm ổn định',
    'In tune': 'Đúng cao độ',
    'Slightly flat': 'Hơi thấp',
    'A touch sharp': 'Hơi cao',
    'Locked in': 'Rất ổn định',
    'Musical theater': 'Nhạc kịch',
    'Classical': 'Cổ điển',
    'Gospel': 'Gospel',
    'Country': 'Country',
    'Three steps, every session.': 'Ba bước cho mỗi buổi luyện.',
    'No setup, no gear, no theory homework. Open the app and sing.':
      'Không cần thiết lập, không cần thiết bị riêng, không bài tập lý thuyết. Mở app và hát.',
    'Sing': 'Hát',
    'Pick a lesson and sing into your mic. Sime starts listening the moment you do.':
      'Chọn một bài học và hát vào micro. Sime bắt đầu lắng nghe ngay khi bạn hát.',
    'See': 'Xem',
    'Watch pitch, timing, and tone break down live, note by note, as you hold each phrase.':
      'Xem cao độ, nhịp và màu giọng được phân tích trực tiếp, từng nốt một, khi bạn giữ câu hát.',
    'Improve': 'Tiến bộ',
    'Get targeted drills that fix the exact thing holding your voice back, then track the gain.':
      'Nhận bài tập đúng điểm đang cản giọng bạn, rồi theo dõi tiến bộ.',
    'What Sime does': 'Sime làm gì',
    'A coach that actually listens.': 'Một huấn luyện viên thật sự lắng nghe.',
    'Real-time feedback': 'Phản hồi thời gian thực',
    'Pitch, timing, breath, and tone, analyzed as you sing. The same notes a great teacher would catch, every single take.':
      'Cao độ, nhịp, hơi thở và màu giọng được phân tích khi bạn hát. Những điều một giáo viên giỏi sẽ nghe ra trong từng lượt hát.',
    'Find your true range': 'Tìm quãng giọng thật',
    'Sime maps your lowest comfortable note to your highest and tracks how it grows.':
      'Sime đo từ nốt thấp thoải mái nhất đến nốt cao nhất và theo dõi nó phát triển.',
    'Guided curriculum': 'Giáo trình có hướng dẫn',
    'Breath support': 'Hơi thở nâng đỡ',
    'Mixed voice': 'Giọng mix',
    'Belting safely': 'Belting an toàn',
    'Built around your voice': 'Xây quanh giọng của bạn',
    'Your plan adapts to your tone, goals, and the genres you love.':
      'Kế hoạch thích nghi với màu giọng, mục tiêu và thể loại bạn yêu thích.',
    'Warm-ups that adapt': 'Khởi động biết thích nghi',
    'Daily routines that scale with your voice and protect it from strain.':
      'Routine hằng ngày đi theo giọng bạn và bảo vệ khỏi căng giọng.',
    'See your voice on a map.': 'Nhìn giọng hát của bạn trên bản đồ.',
    'Every session plots where your voice is comfortable, where it strains, and where it is quietly getting stronger. Watch your range stretch week over week instead of guessing.':
      'Mỗi buổi luyện cho thấy vùng giọng thoải mái, vùng bị căng và nơi giọng đang mạnh lên. Theo dõi quãng giọng mở rộng từng tuần thay vì đoán.',
    'Full range from your lowest to highest usable note': 'Toàn bộ quãng từ nốt thấp nhất đến cao nhất dùng được',
    'Your comfortable zone, so you train smart, not sore': 'Vùng thoải mái để luyện thông minh, không đau',
    'Progress history you can actually feel proud of': 'Lịch sử tiến bộ bạn có thể tự hào',
    'A real curriculum, not a playlist.': 'Một giáo trình thật, không phải playlist.',
    'Structured tracks built on proven vocal pedagogy, from your first clear note to the stage.':
      'Các lộ trình có cấu trúc dựa trên sư phạm thanh nhạc đã kiểm chứng, từ nốt rõ đầu tiên đến sân khấu.',
    'Foundations': 'Nền tảng',
    'The base every voice needs': 'Nền móng mọi giọng hát đều cần',
    'Breath support and control': 'Hơi thở nâng đỡ và kiểm soát',
    'Posture and alignment': 'Tư thế và căn chỉnh',
    'Pitch matching and ear training': 'Bắt cao độ và luyện tai',
    'Resonance basics': 'Cơ bản về cộng hưởng',
    'Technique': 'Kỹ thuật',
    'Build power and flexibility': 'Xây sức mạnh và linh hoạt',
    'Mixed voice and bridging registers': 'Giọng mix và nối register',
    'Belting without strain': 'Belting không căng',
    'Vibrato control': 'Kiểm soát vibrato',
    'Agility and runs': 'Linh hoạt và runs',
    'Performance': 'Biểu diễn',
    'Turn technique into music': 'Biến kỹ thuật thành âm nhạc',
    'Phrasing and dynamics': 'Phrasing và sắc thái',
    'Stage presence and nerves': 'Hiện diện sân khấu và kiểm soát hồi hộp',
    'Microphone technique': 'Kỹ thuật micro',
    'Song interpretation': 'Diễn giải bài hát',
    'Singers who stopped guessing.': 'Những ca sĩ đã ngừng đoán mò.',
    'Six weeks in, I can finally hold the high notes in my own songs without straining. The live feedback is like having a coach in the room.':
      'Sau sáu tuần, cuối cùng tôi giữ được nốt cao trong bài của mình mà không căng. Phản hồi trực tiếp như có huấn luyện viên trong phòng.',
    'Indie songwriter': 'Nhạc sĩ indie',
    'I book more gigs now. Sime found the cracks in my mix voice and gave me drills that actually fixed them.':
      'Giờ tôi nhận nhiều show hơn. Sime tìm ra điểm nứt trong giọng mix và đưa bài tập thật sự sửa được nó.',
    'Wedding and event singer': 'Ca sĩ sự kiện',
    'I send my whole section here for warm-ups. Everyone shows up to rehearsal more confident than before.':
      'Tôi gửi cả bè vào đây để khởi động. Mọi người đến buổi tập tự tin hơn trước.',
    'Community choir lead': 'Trưởng nhóm hợp xướng cộng đồng',
    'Free access': 'Truy cập miễn phí',
    'Every feature. Free, right now.': 'Mọi tính năng. Miễn phí ngay bây giờ.',
    'No card, no trial timer, no locked lessons. The full curriculum and every bit of AI feedback are open to everyone while we grow.':
      'Không cần thẻ, không giới hạn dùng thử, không khóa bài học. Toàn bộ giáo trình và phản hồi AI mở cho mọi người trong giai đoạn phát triển.',
    'for everyone': 'cho mọi người',
    'Full guided curriculum, unlimited sessions': 'Giáo trình đầy đủ, không giới hạn buổi luyện',
    'Real-time pitch, timing, and tone feedback': 'Phản hồi cao độ, nhịp và màu giọng theo thời gian thực',
    'Vocal range tracking and history': 'Theo dõi quãng giọng và lịch sử',
    'Daily warm-ups that adapt to your voice': 'Khởi động hằng ngày thích nghi với giọng bạn',
    'A plan personalized to your goals': 'Kế hoạch cá nhân hóa theo mục tiêu',
    'No payment and no credit card required.': 'Không cần thanh toán và không cần thẻ tín dụng.',
    'Step into the spotlight.': 'Bước vào ánh đèn sân khấu.',
    'Create your free account and sing your first guided lesson in under two minutes.':
      'Tạo tài khoản miễn phí và hát bài học có hướng dẫn đầu tiên trong chưa đến hai phút.',
    'Email address': 'Địa chỉ email',
    'Please enter a valid email address.': 'Vui lòng nhập địa chỉ email hợp lệ.',
    'You are on the list. Check your inbox to finish setting up.':
      'Bạn đã có trong danh sách. Hãy kiểm tra hộp thư để hoàn tất thiết lập.',
    'Lowest': 'Thấp nhất',
    'Highest': 'Cao nhất',
    'Comfortable zone': 'Vùng thoải mái',
    '3.5 octaves and growing': '3,5 quãng tám và đang mở rộng',
    'Product': 'Sản phẩm',
    'Company': 'Công ty',
    'Legal': 'Pháp lý',
    'About': 'Giới thiệu',
    'Blog': 'Blog',
    'Contact': 'Liên hệ',
    'Privacy': 'Quyền riêng tư',
    'Terms': 'Điều khoản',
    'AI vocal coaching for every voice, from your first clear note to the stage.':
      'Huấn luyện thanh nhạc AI cho mọi giọng hát, từ nốt rõ đầu tiên đến sân khấu.',
    '© 2026 Sime. Sing like you mean it.': '© 2026 Sime. Hát đúng điều bạn muốn.'
  };

  function detectLocale() {
    var url = new URL(window.location.href);
    var queryLocale = url.searchParams.get('lang');
    if (queryLocale === 'en' || queryLocale === 'vi') {
      setLocaleCookie(queryLocale);
      return queryLocale;
    }
    var match = document.cookie.match(/(?:^|;\s*)sime_locale=(en|vi)(?:;|$)/);
    if (match) return match[1];
    return (navigator.language || '').toLowerCase().indexOf('vi') === 0 ? 'vi' : 'en';
  }

  function setLocaleCookie(nextLocale) {
    document.cookie = LOCALE_COOKIE + '=' + nextLocale + '; Max-Age=31536000; Path=/; SameSite=Lax';
  }

  function t(text) {
    return locale === 'vi' ? (viText[text] || text) : text;
  }

  function applyI18n() {
    document.documentElement.lang = locale;
    document.title = locale === 'vi'
      ? 'Sime - Huấn luyện thanh nhạc AI giúp bạn hát tốt hơn'
      : 'Sime - AI vocal coaching that helps you sing like the pros';

    var description = document.querySelector('meta[name="description"]');
    if (description && locale === 'vi') {
      description.setAttribute('content', 'Huấn luyện thanh nhạc AI nghe từng nốt, đo quãng giọng và biến luyện tập thành tiến bộ đo được.');
    }

    walkText(document.body);
    var toggle = document.getElementById('navToggle');
    if (toggle) toggle.setAttribute('aria-label', t('Open menu'));
    var localeSelect = document.getElementById('localeSelect');
    if (localeSelect) localeSelect.value = locale;
  }

  function walkText(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var parent = node.parentElement;
        if (!parent || /^(SCRIPT|STYLE|TEXTAREA|SELECT|OPTION|CANVAS)$/.test(parent.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
        return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });

    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var raw = node.nodeValue;
      var trimmed = raw.trim();
      var translated = t(trimmed);
      if (translated !== trimmed) {
        node.nodeValue = raw.replace(trimmed, translated);
      }
    });
  }

  applyI18n();

  (function () {
    var localeSelect = document.getElementById('localeSelect');
    if (!localeSelect) return;
    localeSelect.addEventListener('change', function () {
      locale = localeSelect.value === 'vi' ? 'vi' : 'en';
      setLocaleCookie(locale);
      window.location.reload();
    });
  })();

  /* ---------- crisp canvas helper ---------- */
  function fitCanvas(canvas) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var rect = canvas.getBoundingClientRect();
    var w = rect.width || canvas.width;
    var h = (canvas.height / (canvas.width || 1)) * w;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h };
  }

  /* ---------- mobile nav ---------- */
  (function () {
    var toggle = document.getElementById('navToggle');
    var links = document.getElementById('primary-nav');
    if (!toggle || !links) return;

    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? t('Close menu') : t('Open menu'));
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', t('Open menu'));
      }
    });
  })();

  /* ---------- scroll reveals ---------- */
  (function () {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- accordion ---------- */
  (function () {
    var heads = document.querySelectorAll('.acc__head');
    heads.forEach(function (head) {
      var body = head.nextElementSibling;
      // set initial open height
      if (head.getAttribute('aria-expanded') === 'true' && body) {
        body.style.maxHeight = body.scrollHeight + 'px';
      }
      head.addEventListener('click', function () {
        var open = head.getAttribute('aria-expanded') === 'true';
        head.setAttribute('aria-expanded', open ? 'false' : 'true');
        if (!body) return;
        body.style.maxHeight = open ? '0px' : body.scrollHeight + 'px';
      });
    });
    // keep open panels sized correctly on resize
    window.addEventListener('resize', function () {
      document.querySelectorAll('.acc__head[aria-expanded="true"]').forEach(function (head) {
        var body = head.nextElementSibling;
        if (body) body.style.maxHeight = body.scrollHeight + 'px';
      });
    });
  })();

  /* ---------- signup form (front-end validation, XSS-safe) ---------- */
  (function () {
    var form = document.getElementById('signupForm');
    var input = document.getElementById('email');
    var msg = document.getElementById('formMsg');
    if (!form || !input || !msg) return;

    var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var value = input.value.trim();
      if (!EMAIL.test(value)) {
        input.setAttribute('aria-invalid', 'true');
        msg.className = 'cta__msg is-err';
        msg.textContent = t('Please enter a valid email address.'); // static string only
        input.focus();
        return;
      }
      input.removeAttribute('aria-invalid');
      msg.className = 'cta__msg is-ok';
      // Note: no backend yet. We never echo the user value back into the DOM.
      msg.textContent = t('You are on the list. Check your inbox to finish setting up.');
      form.reset();
    });

    input.addEventListener('input', function () {
      if (input.getAttribute('aria-invalid') === 'true' && EMAIL.test(input.value.trim())) {
        input.removeAttribute('aria-invalid');
        msg.textContent = '';
        msg.className = 'cta__msg';
      }
    });
  })();

  /* ---------- pitch readout cycle (textContent only) ---------- */
  (function () {
    var note = document.getElementById('pitchNote');
    var cents = document.getElementById('pitchCents');
    var label = document.getElementById('pitchLabel');
    var dot = document.getElementById('pitchDot');
    if (!note || !cents || !label || !dot) return;

    var states = [
      { note: 'A4', cents: '+4 cents', label: t('In tune'), tone: 'var(--good)' },
      { note: 'C5', cents: '-9 cents', label: t('Slightly flat'), tone: 'var(--accent)' },
      { note: 'E4', cents: '+1 cent', label: t('In tune'), tone: 'var(--good)' },
      { note: 'G4', cents: '+12 cents', label: t('A touch sharp'), tone: 'var(--accent)' },
      { note: 'D5', cents: '0 cents', label: t('Locked in'), tone: 'var(--good)' }
    ];

    function apply(s) {
      note.textContent = s.note;
      cents.textContent = s.cents;
      label.textContent = s.label;
      dot.style.background = s.tone;
    }

    apply(states[0]);
    if (reduceMotion) return;

    var i = 0;
    setInterval(function () {
      i = (i + 1) % states.length;
      apply(states[i]);
    }, 2300);
  })();

  /* ---------- animated waveform (hero + feature cell) ---------- */
  function makeWave(canvas, opts) {
    if (!canvas) return;
    opts = opts || {};
    var dim = fitCanvas(canvas);
    var ctx = dim.ctx, w = dim.w, h = dim.h;
    var running = false, raf = 0, t = 0;
    var bars = opts.bars || false;

    window.addEventListener('resize', function () {
      dim = fitCanvas(canvas); ctx = dim.ctx; w = dim.w; h = dim.h;
    });

    function grad() {
      var g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, 'rgba(255,184,77,0.15)');
      g.addColorStop(0.5, 'rgba(255,199,107,1)');
      g.addColorStop(1, 'rgba(255,184,77,0.15)');
      return g;
    }

    function drawWave() {
      ctx.clearRect(0, 0, w, h);
      var mid = h / 2;
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = grad();
      ctx.shadowColor = 'rgba(255,184,77,0.5)';
      ctx.shadowBlur = 10;
      for (var layer = 0; layer < 3; layer++) {
        ctx.globalAlpha = layer === 0 ? 1 : 0.28;
        ctx.beginPath();
        for (var x = 0; x <= w; x += 4) {
          var k = x / w;
          var env = Math.sin(k * Math.PI); // taper at the ends
          var y = mid + Math.sin(k * 14 - t + layer * 1.1) * 26 * env
                      + Math.sin(k * 31 - t * 1.7 + layer) * 12 * env;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }

    function drawBars() {
      ctx.clearRect(0, 0, w, h);
      var n = 44, gap = 3, bw = (w - gap * (n - 1)) / n, mid = h / 2;
      ctx.fillStyle = grad();
      for (var i = 0; i < n; i++) {
        var k = i / n;
        var env = 0.35 + 0.65 * Math.sin(k * Math.PI);
        var amp = (Math.abs(Math.sin(k * 20 - t * 1.4)) * 0.6 + Math.abs(Math.sin(k * 7 - t)) * 0.4) * env;
        var bh = Math.max(3, amp * (h * 0.9));
        var x = i * (bw + gap);
        ctx.fillRect(x, mid - bh / 2, bw, bh);
      }
    }

    function frame() {
      t += 0.05;
      if (bars) drawBars(); else drawWave();
      raf = requestAnimationFrame(frame);
    }

    function start() { if (!running) { running = true; frame(); } }
    function stop() { running = false; cancelAnimationFrame(raf); }

    if (reduceMotion) {
      // static single frame
      if (bars) drawBars(); else drawWave();
      return;
    }

    // pause when offscreen to save battery / GPU
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries[0].isIntersecting ? start() : stop();
      }, { threshold: 0.05 });
      io.observe(canvas);
    } else {
      start();
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else if (isVisible(canvas)) start();
    });
  }

  function isVisible(el) {
    var r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < (window.innerHeight || 0);
  }

  makeWave(document.getElementById('heroWave'), { bars: false });
  makeWave(document.getElementById('cellWave'), { bars: true });

  /* ---------- static range visualizations ---------- */
  function drawRangeMap(canvas) {
    if (!canvas) return;
    var dim = fitCanvas(canvas);
    var ctx = dim.ctx, w = dim.w, h = dim.h;

    function render() {
      dim = fitCanvas(canvas); ctx = dim.ctx; w = dim.w; h = dim.h;
      ctx.clearRect(0, 0, w, h);

      var padX = 24, padTop = 40, keyTop = h - 70, keyH = 48;
      var trackW = w - padX * 2;

      // baseline track
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      roundRect(ctx, padX, keyTop, trackW, keyH, 10); ctx.fill();

      // piano key ticks
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      var keys = 28;
      for (var i = 0; i <= keys; i++) {
        var x = padX + (trackW / keys) * i;
        ctx.beginPath(); ctx.moveTo(x, keyTop); ctx.lineTo(x, keyTop + keyH); ctx.stroke();
      }

      // comfortable zone band
      var zStart = padX + trackW * 0.22;
      var zEnd = padX + trackW * 0.68;
      var g = ctx.createLinearGradient(zStart, 0, zEnd, 0);
      g.addColorStop(0, 'rgba(255,184,77,0.0)');
      g.addColorStop(0.5, 'rgba(255,184,77,0.55)');
      g.addColorStop(1, 'rgba(255,184,77,0.0)');
      ctx.fillStyle = g;
      roundRect(ctx, zStart, keyTop, zEnd - zStart, keyH, 10); ctx.fill();

      // full-range bar above keys
      var fStart = padX + trackW * 0.10;
      var fEnd = padX + trackW * 0.90;
      ctx.strokeStyle = 'rgba(255,199,107,0.9)';
      ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(fStart, padTop + 22); ctx.lineTo(fEnd, padTop + 22); ctx.stroke();

      // endpoint dots + labels
      label(fStart, 'E2', 'Lowest');
      label(fEnd, 'C6', 'Highest');

      function label(x, note, sub) {
        ctx.fillStyle = '#FFC76B';
        ctx.beginPath(); ctx.arc(x, padTop + 22, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#F4F1EA';
        ctx.font = '600 16px Sora, sans-serif';
        ctx.textAlign = x < w / 2 ? 'left' : 'right';
        ctx.fillText(note, x, padTop + 4);
        ctx.fillStyle = '#756E80';
        ctx.font = '400 11px Sora, sans-serif';
        ctx.fillText(t(sub), x, keyTop - 10);
      }

      // caption for comfortable zone
      ctx.fillStyle = '#ABA4B4';
      ctx.font = '500 12px Sora, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t('Comfortable zone'), (zStart + zEnd) / 2, keyTop - 10);
    }

    render();
    window.addEventListener('resize', render);
  }

  function drawCellRange(canvas) {
    if (!canvas) return;
    var dim = fitCanvas(canvas);
    var ctx = dim.ctx, w = dim.w, h = dim.h;

    function render() {
      dim = fitCanvas(canvas); ctx = dim.ctx; w = dim.w; h = dim.h;
      ctx.clearRect(0, 0, w, h);
      var y = h - 24, padX = 6, trackW = w - padX * 2;

      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      roundRect(ctx, padX, y, trackW, 8, 4); ctx.fill();

      var g = ctx.createLinearGradient(padX, 0, padX + trackW, 0);
      g.addColorStop(0, '#FFB84D'); g.addColorStop(1, '#FFC76B');
      ctx.fillStyle = g;
      roundRect(ctx, padX + trackW * 0.15, y, trackW * 0.62, 8, 4); ctx.fill();

      ctx.fillStyle = '#F4F1EA';
      ctx.font = '700 22px Sora, sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('E2', padX, y - 16);
      ctx.textAlign = 'right';
      ctx.fillText('C6', padX + trackW, y - 16);
      ctx.fillStyle = '#756E80';
      ctx.font = '400 11px Sora, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(t('3.5 octaves and growing'), w / 2, y + 24);
    }
    render();
    window.addEventListener('resize', render);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  drawRangeMap(document.getElementById('rangeMap'));
  drawCellRange(document.getElementById('cellRange'));
})();
