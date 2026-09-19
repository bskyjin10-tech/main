// 세계의 명언 애플리케이션 핵심 로직 (app.js)

document.addEventListener('DOMContentLoaded', () => {
  // 상태 관리
  let currentCategory = 'all';
  let searchQuery = '';
  let favorites = JSON.parse(localStorage.getItem('world_quotes_favorites') || '[]');
  let currentHeroQuote = null;
  let currentTheme = localStorage.getItem('world_quotes_theme') || 'light';

  // DOM 요소 참조
  const themeBtns = document.querySelectorAll('.theme-btn');
  const heroQuoteKo = document.getElementById('heroQuoteKo');
  const heroQuoteEn = document.getElementById('heroQuoteEn');
  const heroAuthor = document.getElementById('heroAuthor');
  const heroAuthorDesc = document.getElementById('heroAuthorDesc');
  const heroDate = document.getElementById('heroDate');
  const heroBadge = document.getElementById('heroBadge');
  const heroFavBtn = document.getElementById('heroFavBtn');
  const heroCopyBtn = document.getElementById('heroCopyBtn');
  const heroSpeakBtn = document.getElementById('heroSpeakBtn');
  const heroDownloadBtn = document.getElementById('heroDownloadBtn');
  const btnRandom = document.getElementById('btnRandom');
  const searchInput = document.getElementById('searchInput');
  const categoryTabs = document.getElementById('categoryTabs');
  const quotesGrid = document.getElementById('quotesGrid');
  const quotesCount = document.getElementById('quotesCount');
  const toastContainer = document.getElementById('toastContainer');

  // 1. 테마 초기화
  applyTheme(currentTheme);

  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.getAttribute('data-theme');
      applyTheme(theme);
    });
  });

  function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('world_quotes_theme', theme);

    themeBtns.forEach(b => {
      if (b.getAttribute('data-theme') === theme) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
  }

  // 2. 오늘의 명언 계산
  function getQuoteOfTheDay() {
    const today = new Date();
    const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    
    // 날짜 기반 해시 생성
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
      hash = (hash << 5) - hash + dateString.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % QUOTES_DATA.length;
    return { quote: QUOTES_DATA[index], dateString };
  }

  // 오늘 날짜 포맷 (한국어)
  function formatKoreanDate() {
    const now = new Date();
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    return `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 ${days[now.getDay()]}`;
  }

  // 히어로 섹션에 명언 렌더링
  function renderHeroQuote(quote, isRandom = false) {
    currentHeroQuote = quote;
    const heroCard = document.getElementById('heroCard');
    heroCard.classList.remove('fade-in');
    void heroCard.offsetWidth; // 강제 리플로우
    heroCard.classList.add('fade-in');

    heroQuoteKo.textContent = `"${quote.quote_ko}"`;
    heroQuoteEn.textContent = quote.quote_en;
    heroAuthor.textContent = `${quote.author_ko} (${quote.author_en})`;
    heroAuthorDesc.textContent = quote.author_title;

    if (isRandom) {
      heroBadge.textContent = '추천 명언';
      heroDate.textContent = '영감을 주는 새로운 한 줄';
    } else {
      heroBadge.textContent = '오늘의 명언';
      heroDate.textContent = formatKoreanDate();
    }

    updateHeroFavoriteButton();
  }

  function updateHeroFavoriteButton() {
    if (!currentHeroQuote) return;
    const isFav = favorites.includes(currentHeroQuote.id);
    if (isFav) {
      heroFavBtn.classList.add('active');
      heroFavBtn.title = '즐겨찾기 해제';
    } else {
      heroFavBtn.classList.remove('active');
      heroFavBtn.title = '즐겨찾기 추가';
    }
  }

  // 초기 로딩 시 '오늘의 명언' 표시
  const qotd = getQuoteOfTheDay();
  renderHeroQuote(qotd.quote, false);

  // 랜덤 명언 버튼 클릭
  btnRandom.addEventListener('click', () => {
    let newQuote;
    do {
      const randIdx = Math.floor(Math.random() * QUOTES_DATA.length);
      newQuote = QUOTES_DATA[randIdx];
    } while (currentHeroQuote && newQuote.id === currentHeroQuote.id && QUOTES_DATA.length > 1);

    renderHeroQuote(newQuote, true);
    showToast('새로운 영감을 주는 명언을 가져왔습니다.');
  });

  // 히어로 액션 버튼들
  heroFavBtn.addEventListener('click', () => {
    if (!currentHeroQuote) return;
    toggleFavorite(currentHeroQuote.id);
    updateHeroFavoriteButton();
    renderQuotesList();
  });

  heroCopyBtn.addEventListener('click', () => {
    if (!currentHeroQuote) return;
    copyQuoteToClipboard(currentHeroQuote);
  });

  heroSpeakBtn.addEventListener('click', () => {
    if (!currentHeroQuote) return;
    speakQuote(currentHeroQuote);
  });

  heroDownloadBtn.addEventListener('click', () => {
    if (!currentHeroQuote) return;
    downloadQuoteCard(currentHeroQuote);
  });

  // 3. 카테고리 탭 클릭
  categoryTabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;

    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    currentCategory = btn.getAttribute('data-category');
    renderQuotesList();
  });

  // 4. 실시간 검색
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    renderQuotesList();
  });

  // 5. 명언 리스트 렌더링
  function getFilteredQuotes() {
    return QUOTES_DATA.filter(quote => {
      // 카테고리 필터
      if (currentCategory === 'favorites') {
        if (!favorites.includes(quote.id)) return false;
      } else if (currentCategory !== 'all') {
        if (quote.category !== currentCategory) return false;
      }

      // 검색어 필터
      if (searchQuery) {
        const matchKo = quote.quote_ko.toLowerCase().includes(searchQuery);
        const matchEn = quote.quote_en.toLowerCase().includes(searchQuery);
        const matchAuthorKo = quote.author_ko.toLowerCase().includes(searchQuery);
        const matchAuthorEn = quote.author_en.toLowerCase().includes(searchQuery);
        const matchTags = quote.tags.some(t => t.toLowerCase().includes(searchQuery));

        return matchKo || matchEn || matchAuthorKo || matchAuthorEn || matchTags;
      }

      return true;
    });
  }

  function renderQuotesList() {
    const filtered = getFilteredQuotes();
    quotesCount.textContent = `총 ${filtered.length}개의 명언`;

    // 탭 카운트 업데이트
    updateTabCounts();

    if (filtered.length === 0) {
      quotesGrid.innerHTML = `
        <div class="empty-state">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3>일치하는 명언이 없습니다</h3>
          <p>${currentCategory === 'favorites' ? '아직 즐겨찾기에 추가한 명언이 없습니다. 마음에 드는 명언의 하트 아이콘을 눌러보세요!' : '다른 검색어나 카테고리를 선택해 보세요.'}</p>
        </div>
      `;
      return;
    }

    quotesGrid.innerHTML = filtered.map(quote => {
      const isFav = favorites.includes(quote.id);
      const tagsHtml = quote.tags.map(t => `<span class="chip">#${t}</span>`).join('');

      return `
        <div class="quote-card fade-in" data-id="${quote.id}">
          <div class="card-top">
            <span class="category-tag category-${quote.category}">${quote.category_ko}</span>
            <div class="card-actions-mini">
              <button class="btn btn-icon-only btn-fav ${isFav ? 'active' : ''}" data-id="${quote.id}" title="${isFav ? '즐겨찾기 해제' : '즐겨찾기 추가'}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>
          </div>
          
          <div class="card-body">
            <p class="card-quote-ko">"${escapeHtml(quote.quote_ko)}"</p>
            <p class="card-quote-en">${escapeHtml(quote.quote_en)}</p>
            <div class="card-author-box">
              <span class="card-author">${escapeHtml(quote.author_ko)}</span>
              <span class="card-author-desc">${escapeHtml(quote.author_title)}</span>
            </div>
          </div>

          <div class="card-footer">
            <div class="card-tags">
              ${tagsHtml}
            </div>
            <div class="card-buttons">
              <button class="btn btn-icon-only btn-speak" data-id="${quote.id}" title="음성으로 듣기">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </button>
              <button class="btn btn-icon-only btn-copy" data-id="${quote.id}" title="명언 복사하기">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button class="btn btn-icon-only btn-save-img" data-id="${quote.id}" title="카드 이미지 저장">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // 카드 개별 버튼 이벤트 위임
    attachCardEvents();
  }

  function updateTabCounts() {
    const favCount = favorites.length;
    const favBadge = document.getElementById('favCountBadge');
    if (favBadge) favBadge.textContent = favCount;
  }

  function attachCardEvents() {
    // 즐겨찾기 버튼
    document.querySelectorAll('.btn-fav').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        toggleFavorite(id);
        renderQuotesList();
        updateHeroFavoriteButton();
      });
    });

    // 복사 버튼
    document.querySelectorAll('.btn-copy').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        const q = QUOTES_DATA.find(item => item.id === id);
        if (q) copyQuoteToClipboard(q);
      });
    });

    // 음성 듣기 버튼
    document.querySelectorAll('.btn-speak').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        const q = QUOTES_DATA.find(item => item.id === id);
        if (q) speakQuote(q);
      });
    });

    // 이미지 저장 버튼
    document.querySelectorAll('.btn-save-img').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        const q = QUOTES_DATA.find(item => item.id === id);
        if (q) downloadQuoteCard(q);
      });
    });
  }

  // 즐겨찾기 토글
  function toggleFavorite(id) {
    const idx = favorites.indexOf(id);
    if (idx > -1) {
      favorites.splice(idx, 1);
      showToast('즐겨찾기에서 제거되었습니다.');
    } else {
      favorites.push(id);
      showToast('즐겨찾기에 추가되었습니다.');
    }
    localStorage.setItem('world_quotes_favorites', JSON.stringify(favorites));
  }

  // 클립보드 복사
  function copyQuoteToClipboard(quote) {
    const textToCopy = `"${quote.quote_ko}"\n(${quote.quote_en})\n\n- ${quote.author_ko} (${quote.author_title})`;
    
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        showToast('명언이 클립보드에 복사되었습니다.');
      }).catch(() => {
        fallbackCopyText(textToCopy);
      });
    } else {
      fallbackCopyText(textToCopy);
    }
  }

  function fallbackCopyText(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand('copy');
      showToast('명언이 클립보드에 복사되었습니다.');
    } catch (err) {
      showToast('클립보드 복사에 실패했습니다.');
    }
    document.body.removeChild(textarea);
  }

  // 모바일 음성 낭독 (TTS) 최적화 및 상태 관리
  let globalUtterance = null;
  let audioFallback = null;

  // 모바일 음성 목록 미리 로드
  if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }

  // 모바일 오디오 언락 (첫 터치 제스처 시 오디오 컨텍스트 깨우기)
  function unlockMobileAudio() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
  }
  document.addEventListener('touchstart', unlockMobileAudio, { once: true, passive: true });
  document.addEventListener('click', unlockMobileAudio, { once: true, passive: true });

  // 음성 낭독 (TTS)
  function speakQuote(quote) {
    const text = `${quote.quote_ko}. ${quote.author_ko}`;

    // 1. Web Speech API 시도
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();

        const utterance = new SpeechSynthesisUtterance(text);
        globalUtterance = utterance; // 모바일 가비지 컬렉터에 의한 음성 중단 방지

        utterance.lang = 'ko-KR';
        utterance.rate = 0.92;
        utterance.pitch = 1.0;

        // 한국어 음성 탐색 (기기별 최적 한국어 보이스 선택)
        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          const koVoice = voices.find(v => v.lang === 'ko-KR' || v.lang === 'ko_KR') ||
                          voices.find(v => v.lang && v.lang.startsWith('ko')) ||
                          voices.find(v => (v.name && (v.name.includes('Korean') || v.name.includes('한국어'))));
          if (koVoice) {
            utterance.voice = koVoice;
          }
        }

        let hasStarted = false;
        utterance.onstart = () => {
          hasStarted = true;
          showToast('명언을 낭독합니다...');
        };

        utterance.onend = () => {
          globalUtterance = null;
        };

        utterance.onerror = (e) => {
          console.warn('SpeechSynthesis error, trying audio fallback:', e);
          globalUtterance = null;
          playAudioFallback(text);
        };

        // 모바일에서 1초 내에 재생이 안 될 경우 자동 오디오 폴백 전환
        setTimeout(() => {
          if (!hasStarted && (!window.speechSynthesis.speaking || window.speechSynthesis.paused)) {
            window.speechSynthesis.resume();
            // 그래도 안 나오면 폴백 실행
            setTimeout(() => {
              if (!hasStarted) {
                playAudioFallback(text);
              }
            }, 600);
          }
        }, 800);

        window.speechSynthesis.speak(utterance);
        return;
      } catch (err) {
        console.warn('Web Speech API failed, switching to audio fallback:', err);
      }
    }

    // 2. 모바일 Fallback: HTML5 Audio 스트림
    playAudioFallback(text);
  }

  // 모바일 오디오 폴백 함수 (카카오톡, 인스타 인앱브라우저 및 음성 엔진 미지원 모바일 기기 지원)
  function playAudioFallback(text) {
    try {
      if (audioFallback) {
        audioFallback.pause();
        audioFallback = null;
      }
      const shortText = text.length > 90 ? text.substring(0, 90) : text;
      const encoded = encodeURIComponent(shortText);
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ko&client=tw-ob&q=${encoded}`;

      audioFallback = new Audio(url);
      audioFallback.onplay = () => {
        showToast('명언을 낭독합니다...');
      };
      audioFallback.onerror = () => {
        showToast('이 기기에서는 음성 읽기를 지원하지 않습니다.');
      };

      const playPromise = audioFallback.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('Audio fallback play error:', err);
          showToast('화면을 터치한 후 다시 시도해 주세요.');
        });
      }
    } catch (e) {
      showToast('음성 재생에 실패했습니다.');
    }
  }

  // Canvas를 활용한 고품질 명언 카드 이미지 생성 및 다운로드 (순수 로컬 동작)
  function downloadQuoteCard(quote) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // 1200 x 700 고해상도 카드 캔버스
    const width = 1200;
    const height = 720;
    canvas.width = width;
    canvas.height = height;

    // 배경 그라디언트
    let bgGrad;
    if (currentTheme === 'dark') {
      bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#0f172a');
      bgGrad.addColorStop(1, '#1e1b4b');
    } else if (currentTheme === 'sunset') {
      bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#2e1065');
      bgGrad.addColorStop(0.5, '#701a75');
      bgGrad.addColorStop(1, '#831843');
    } else {
      bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#1e293b');
      bgGrad.addColorStop(1, '#334155');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 장식용 테두리 라인
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, width - 80, height - 80);

    // 상단 카테고리 태그
    ctx.fillStyle = '#818cf8';
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Noto Sans KR", sans-serif';
    ctx.fillText(`WORLD FAMOUS QUOTES  |  ${quote.category_ko}`, 80, 100);

    // 장식용 큰 따옴표
    ctx.font = 'italic 160px Georgia, serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillText('“', 70, 240);

    // 한국어 명언 텍스트 (자동 줄바꿈 처리)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px -apple-system, BlinkMacSystemFont, "Noto Sans KR", "Batang", serif';
    const maxTextWidth = width - 180;
    const lineHeight = 64;
    const startY = 240;

    const words = quote.quote_ko.split(' ');
    let line = '';
    let currentY = startY;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxTextWidth && n > 0) {
        ctx.fillText(line, 90, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 90, currentY);

    // 영문 명언
    currentY += 50;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = 'italic 26px Georgia, serif';
    const enWords = quote.quote_en.split(' ');
    let enLine = '';
    for (let n = 0; n < enWords.length; n++) {
      const testEnLine = enLine + enWords[n] + ' ';
      const metrics = ctx.measureText(testEnLine);
      if (metrics.width > maxTextWidth && n > 0) {
        ctx.fillText(enLine, 90, currentY);
        enLine = enWords[n] + ' ';
        currentY += 38;
      } else {
        enLine = testEnLine;
      }
    }
    ctx.fillText(enLine, 90, currentY);

    // 구분선
    currentY += 45;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(90, currentY);
    ctx.lineTo(width - 90, currentY);
    ctx.stroke();

    // 인물 정보
    currentY += 45;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, "Noto Sans KR", sans-serif';
    ctx.fillText(`- ${quote.author_ko} (${quote.author_en})`, 90, currentY);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '22px -apple-system, BlinkMacSystemFont, "Noto Sans KR", sans-serif';
    ctx.fillText(quote.author_title, 90, currentY + 32);

    // 다운로드 실행
    const link = document.createElement('a');
    link.download = `명언_${quote.author_ko}_${quote.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    showToast('명언 카드 이미지가 저장되었습니다.');
  }

  // 토스트 메시지
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      <span>${escapeHtml(message)}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }

  function escapeHtml(string) {
    const div = document.createElement('div');
    div.textContent = string;
    return div.innerHTML;
  }

  // 초기 렌더링
  renderQuotesList();
});
