# The Reading Room

따뜻한 빈티지 서재 콘셉트의 개인 독서 기록 홈페이지입니다.

## 포함된 기능
- 책 표지 진열 (이미지 URL 입력 또는 기본 타이포그래피 표지)
- 책 추가 / 수정 / 삭제
- 별점 및 독서평
- 인상 깊은 문장과 출처 저장, 문장 넘겨보기
- 읽은 날짜별 독서 기록
- 장르별 분류 및 필터
- 브라우저 `localStorage`에 기록 자동 저장

## GitHub Pages 배포 방법
1. GitHub에 로그인하고 **New repository**를 선택합니다.
2. 저장소 이름을 `the-reading-room` 등으로 정하고 Public으로 생성합니다.
3. 이 폴더 안의 `index.html`, `style.css`, `script.js`, `README.md`를 저장소 최상위(root)에 업로드합니다.
4. 저장소의 **Settings → Pages**로 이동합니다.
5. **Build and deployment**에서 `Deploy from a branch`를 선택합니다.
6. Branch는 `main`, 폴더는 `/ (root)`로 지정하고 Save를 누릅니다.
7. 잠시 기다리면 `https://깃허브아이디.github.io/the-reading-room/` 주소로 공개됩니다.

## 기록 데이터 관련 주의
책 기록은 현재 사용 중인 브라우저의 localStorage에 저장됩니다. 따라서 다른 기기나 브라우저와 자동 동기화되지 않으며, 브라우저 데이터를 삭제하면 기록이 사라질 수 있습니다. 중요한 독서 기록은 별도로 백업해 주세요.

## 커스터마이징
- 색상·글꼴·레이아웃: `style.css`
- 첫 화면의 기본 샘플 책: `script.js`의 `starterBooks`
- 사이트 문구와 섹션: `index.html`
