(() => {
  const $ = id => document.getElementById(id);
  const dialog = $('accountDialog');
  const status = $('syncStatus');
  const accountButton = $('accountOpen');
  let mode = 'login', auth = null, db = null, currentUser = null, unsubscribe = null, hadAuthenticatedSession = false;
  let applyingRemote = false, syncTimer = null, firstSnapshot = true;
  const usernameEmail = name => `${name.toLowerCase()}@readingroom.app`;
  const setStatus = value => { if (status) status.textContent = value; };
  const setError = value => { $('accountError').textContent = value || ''; };
  const explainError = error => {
    const code = error?.code || '';
    if (code.includes('email-already-in-use')) return '이미 사용 중인 아이디예요. 로그인하거나 다른 아이디를 사용해 주세요.';
    if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')) return '아이디 또는 비밀번호가 올바르지 않아요.';
    if (code.includes('weak-password')) return '비밀번호는 6자 이상으로 입력해 주세요.';
    if (code.includes('invalid-email')) return '아이디 형식을 확인해 주세요. 영문 소문자·숫자·밑줄만 사용할 수 있어요.';
    if (code.includes('network')) return '네트워크 연결을 확인한 뒤 다시 시도해 주세요.';
    if (code.includes('permission-denied')) return 'Firebase 보안 규칙 설정을 확인해 주세요. README의 규칙을 그대로 적용했는지 확인해 주세요.';
    return `연결 중 문제가 생겼어요. (${code || '알 수 없는 오류'})`;
  };
  const validConfig = () => {
    const c = window.READING_ROOM_FIREBASE_CONFIG;
    return c && c.apiKey && !String(c.apiKey).startsWith('여기에') && c.projectId && !String(c.projectId).startsWith('여기에') && c.appId && !String(c.appId).startsWith('여기에');
  };
  const localData = () => window.ReadingRoomApp.getData();
  const meaningful = data => (data.books?.length || 0) + (data.wishlist?.length || 0) > 0;
  const mergeData = (cloud, local) => {
    const books = [...(cloud.books || [])];
    const keys = new Set(books.map(b => b.id));
    (local.books || []).forEach(b => { if (!keys.has(b.id)) { books.push(b); keys.add(b.id); } });
    const wishlist = [...(cloud.wishlist || [])];
    const wishKeys = new Set(wishlist.map(w => `${w.title}|${w.author || ''}`));
    (local.wishlist || []).forEach(w => { const k = `${w.title}|${w.author || ''}`; if (!wishKeys.has(k)) { wishlist.push(w); wishKeys.add(k); } });
    const genres = [...new Set([...(cloud.genres || []), ...(local.genres || [])])];
    return { books, wishlist, genres, genreColors: { ...(local.genreColors || {}), ...(cloud.genreColors || {}) }, favoriteBookId: cloud.favoriteBookId || local.favoriteBookId || '' };
  };
  const docRef = () => db.collection('users').doc(currentUser.uid).collection('private').doc('library');
  const push = async () => {
    if (!currentUser || applyingRemote) return;
    try {
      await docRef().set({ data: localData(), updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
      setStatus('모든 기기에 동기화됨');
    } catch (e) { console.error(e); setStatus('동기화 오류 · 설정 확인'); }
  };
  const subscribe = () => {
    if (unsubscribe) unsubscribe();
    firstSnapshot = true;
    unsubscribe = docRef().onSnapshot(async snap => {
      if (!snap.exists) {
        const data = localData();
        if (meaningful(data)) await push();
        else await docRef().set({ data, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
        setStatus('클라우드 서재 준비 완료');
        return;
      }
      const cloud = snap.data()?.data || {};
      const local = localData();
      const merged = firstSnapshot ? mergeData(cloud, local) : cloud;
      firstSnapshot = false;
      applyingRemote = true;
      window.ReadingRoomApp.setData(merged);
      applyingRemote = false;
      setStatus('모든 기기에 동기화됨');
      if (JSON.stringify(merged) !== JSON.stringify(cloud)) await push();
    }, e => { console.error(e); setStatus('동기화 오류 · 보안 규칙 확인'); });
  };
  const openDialog = () => { setError(''); if (dialog && !dialog.open) dialog.showModal(); };
  const setMode = next => {
    mode = next;
    $('accountTitle').innerHTML = next === 'signup' ? '새 서재를 만들어요<span>.</span>' : '나만의 서재에 로그인<span>.</span>';
    $('accountSubmit').textContent = next === 'signup' ? '계정 만들기' : '로그인';
    $('accountPassword').autocomplete = next === 'signup' ? 'new-password' : 'current-password';
    $('accountSwitch').textContent = next === 'signup' ? '이미 계정이 있나요? 로그인하기' : '처음 오셨나요? 새 계정 만들기';
    setError('');
  };
  const signOut = async () => {
    if (!auth || !currentUser) return;
    if (!confirm('로그아웃할까요? 이 기기에 저장된 기록은 그대로 남아 있어요.')) return;
    await auth.signOut();
  };
  if (!validConfig() || !window.firebase) {
    setStatus('Firebase 연결 설정 필요');
    accountButton.textContent = '계정 설정';
    accountButton.addEventListener('click', () => { openDialog(); setError('아직 Firebase 연결 설정이 비어 있어요. ZIP 안의 README를 따라 Firebase 프로젝트를 만든 뒤 firebase-config.js에 설정값을 넣어 주세요.'); });
    $('accountClose').onclick = () => dialog.close();
    $('accountSwitch').onclick = () => setMode(mode === 'login' ? 'signup' : 'login');
    $('accountForm').addEventListener('submit', e => { e.preventDefault(); setError('Firebase 설정을 먼저 완료해 주세요.'); });
    return;
  }
  try {
    if (!firebase.apps.length) firebase.initializeApp(window.READING_ROOM_FIREBASE_CONFIG);
    auth = firebase.auth(); db = firebase.firestore();
  } catch (e) { console.error(e); setStatus('Firebase 초기화 오류'); }
  accountButton.addEventListener('click', () => currentUser ? signOut() : openDialog());
  $('accountClose').onclick = () => dialog.close();
  $('accountSwitch').onclick = () => setMode(mode === 'login' ? 'signup' : 'login');
  $('accountForm').addEventListener('submit', async e => {
    e.preventDefault(); setError('');
    const username = $('accountUsername').value.trim().toLowerCase();
    const password = $('accountPassword').value;
    if (!/^[a-z0-9_]{3,20}$/.test(username)) { setError('아이디는 영문 소문자·숫자·밑줄로 3~20자 입력해 주세요.'); return; }
    const submit = $('accountSubmit'); submit.disabled = true; submit.textContent = '연결 중…';
    try {
      const email = usernameEmail(username);
      if (mode === 'signup') await auth.createUserWithEmailAndPassword(email, password);
      else await auth.signInWithEmailAndPassword(email, password);
      $('accountPassword').value = ''; dialog.close();
    } catch (error) { setError(explainError(error)); }
    finally { submit.disabled = false; submit.textContent = mode === 'signup' ? '계정 만들기' : '로그인'; }
  });
  auth.onAuthStateChanged(user => {
    currentUser = user;
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }
    if (user) {
      hadAuthenticatedSession = true;
      accountButton.textContent = '로그아웃';
      setStatus('클라우드 서재 연결 중…');
      subscribe();
    } else {
      accountButton.textContent = '로그인';
      setStatus('기기에 저장 중 · 로그인하면 동기화');
      if (hadAuthenticatedSession) {
        applyingRemote = true;
        const saved = localData();
        window.ReadingRoomApp.setData({ books: [], wishlist: [], genres: saved.genres, genreColors: saved.genreColors, favoriteBookId: '' });
        applyingRemote = false;
        hadAuthenticatedSession = false;
      }
    }
  });
  window.ReadingRoomCloud = {
    scheduleSync() {
      if (!currentUser || applyingRemote) return;
      setStatus('변경사항 저장 중…');
      clearTimeout(syncTimer);
      syncTimer = setTimeout(push, 700);
    }
  };
})();
