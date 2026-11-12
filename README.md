# The Reading Room v9 — 계정별 클라우드 동기화

## 먼저 알아둘 점
- 기존 v8의 책·독서 날짜·누적 페이지·문장·하이라이트·위시리스트·장르 정보를 유지합니다.
- 기존 브라우저에 저장된 기록은 로그인 후 첫 클라우드 연결 때 클라우드에 기록이 없다면 업로드됩니다. 이미 클라우드 기록이 있으면 첫 연결 때 책 ID 기준으로 합쳐 중복을 줄입니다.
- 로그인하지 않은 방문자는 비어 있는 서재를 봅니다. 로그인 전의 기존 로컬 기록은 브라우저 저장소에 남아 있습니다.
- Firebase 프로젝트 설정을 완료해야 계정 로그인과 동기화가 작동합니다. 설정 전에는 홈페이지의 '계정 설정' 안내가 표시됩니다.
- 아이디/비밀번호 방식이며 실제 이메일 주소를 받지 않습니다. 따라서 비밀번호 재설정은 제공되지 않습니다. 비밀번호를 잊지 않도록 안전하게 보관하세요.

## 1. Firebase 프로젝트 만들기
1. https://console.firebase.google.com/ 에 접속해 Google 계정으로 로그인합니다.
2. **프로젝트 추가**를 누르고 프로젝트 이름을 `the-reading-room` 등으로 정합니다.
3. Google 애널리틱스는 사용하지 않아도 됩니다. 프로젝트를 만듭니다.
4. 프로젝트 개요 화면에서 웹 아이콘 `</>`을 눌러 웹 앱을 추가합니다. 앱 닉네임은 `The Reading Room`으로 합니다.
5. 앱 등록 후 표시되는 Firebase SDK 설정의 `firebaseConfig` 값을 확인합니다.

## 2. 로그인 기능 켜기
1. Firebase 왼쪽 메뉴 **빌드 → Authentication**으로 이동합니다.
2. **시작하기**를 누릅니다.
3. **Sign-in method(로그인 방법)**에서 **이메일/비밀번호**를 선택하고 사용 설정합니다.
4. 저장합니다.

> 홈페이지에서는 이메일을 받지 않는 아이디/비밀번호 화면을 제공하지만, Firebase 내부에서는 `아이디@readingroom.app` 형식의 가상 로그인 주소를 사용합니다. 실제 메일을 받을 필요는 없습니다.

## 3. 데이터베이스 만들기
1. Firebase 왼쪽 메뉴 **빌드 → Firestore Database**로 이동합니다.
2. **데이터베이스 만들기**를 누릅니다.
3. 프로덕션 모드로 시작하고 가까운 위치를 선택합니다. 위치는 만든 뒤 변경하기 어려우니 대한민국 사용자라면 아시아 리전을 선택하세요(예: Seoul이 제공되면 Seoul).
4. 생성이 끝나면 **규칙(Rules)** 탭에서 아래 규칙으로 전체를 교체하고 **게시(Publish)**를 누릅니다.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/private/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

이 규칙은 로그인한 사용자가 자기 UID 경로의 데이터만 읽고 쓸 수 있게 제한합니다.

## 4. 홈페이지 설정값 넣기
1. 웹 앱 등록 직후 표시된 설정 객체에서 아래 여섯 항목을 복사합니다: `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`.
2. GitHub 저장소의 `firebase-config.js` 파일을 엽니다.
3. `여기에_...`라고 적힌 값을 본인의 Firebase 값으로 바꿉니다. 따옴표와 쉼표는 유지합니다.
4. 저장(Commit changes)합니다.

예시 형식(값은 본인 Firebase 콘솔에서 복사해야 합니다):

```javascript
window.READING_ROOM_FIREBASE_CONFIG = {
  apiKey: "실제_apiKey",
  authDomain: "실제_projectId.firebaseapp.com",
  projectId: "실제_projectId",
  storageBucket: "실제_projectId.appspot.com",
  messagingSenderId: "실제_messagingSenderId",
  appId: "실제_appId"
};
```

## 5. GitHub에 올릴 파일
압축을 풀고 아래 파일을 저장소 최상위(root)에 올려 기존 파일을 교체합니다.

- `index.html`
- `script.js`
- `style.css`
- `cloud.js`
- `firebase-config.js`
- `KcalliAutumnGothic.ttf`는 기존 저장소의 파일을 그대로 둡니다(압축 파일에는 넣지 않았습니다).

`README.md`는 참고용으로 교체해도 됩니다. Firebase 설정값을 넣은 `firebase-config.js`는 개인 설정 파일이므로 다른 사람에게 공유하지 마세요.

## 6. 첫 로그인 및 기록 확인
1. GitHub Pages 배포가 끝난 뒤 홈페이지를 새로고침합니다.
2. **로그인 → 새 계정 만들기**에서 아이디(영문 소문자·숫자·밑줄 3~20자)와 비밀번호(6자 이상)를 만듭니다.
3. 이 브라우저에 기존 v8 기록이 있으면, 새 계정의 클라우드 서재가 비어 있을 때 기존 책과 위시리스트가 최초 업로드됩니다.
4. 휴대폰 등 다른 기기에서 같은 아이디와 비밀번호로 로그인해 동기화 여부를 확인합니다.

## 안전하게 사용하기
- 기존 기록이 있는 기기에서 계정을 처음 연결하기 전까지 브라우저 데이터/사이트 데이터를 삭제하지 마세요.
- 기존 계정에 처음 연결하는 다른 기기에 별도 로컬 기록이 있으면 첫 연결 시 클라우드 기록과 합쳐집니다. 책은 ID가 다르면 둘 다 보존됩니다.
- 아이디 기반 계정은 비밀번호 찾기가 불가능합니다. 잊어버리면 해당 계정에 다시 로그인하지 못할 수 있습니다.
- Firebase 웹 설정의 API 키는 웹 앱에서 사용되는 공개 식별자입니다. 실제 접근 보호는 Firestore 보안 규칙과 Firebase Authentication이 담당합니다. 보안 규칙을 위와 같이 게시하지 않으면 배포하지 마세요.
