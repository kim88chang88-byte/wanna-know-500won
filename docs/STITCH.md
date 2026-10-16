# Google Stitch 연동 (DESIGN.md 작성용)

Stitch는 원격 MCP 서버(`https://stitch.googleapis.com/mcp`)로 연동하며, 설치할 패키지는 없습니다.
인증은 API 키를 `X-Goog-Api-Key` 헤더로 보내는 방식입니다.

## 1. API 키 만들기 (본인이 직접)
1. Stitch에 로그인
2. 오른쪽 위 프로필 사진 → **Stitch settings** → **API key** → **Create key**
3. 키는 만든 직후에만 복사할 수 있으니 바로 복사해 두세요.

> API 키는 비밀번호와 같습니다. 채팅, 코드, git 저장소에 붙여넣지 마세요.

## 2. 키를 환경변수로 등록 (macOS)
`~/.zshrc` 맨 아래에 한 줄 추가하고 터미널을 새로 여세요.
```bash
export STITCH_API_KEY="여기에_키"
```
프로젝트의 `.mcp.json` 이 `${STITCH_API_KEY}` 로 이 값을 읽어 갑니다. (`.mcp.json` 자체에는 키가 없어서 커밋해도 안전합니다.)

## 3. 연결 확인
```bash
cd ~/wanna-know-500won
claude
```
처음 열 때 프로젝트 MCP 서버(stitch)를 승인하라고 물으면 승인하세요. 그다음 `/mcp` 로 stitch 가 connected 인지 확인합니다.

키를 파일/셸 설정이 아닌 Claude Code 로컬 설정에만 두고 싶다면 `.mcp.json` 대신 아래 명령을 쓸 수 있어요. (이 경우 위 2번은 건너뜀)
```bash
claude mcp add stitch --transport http https://stitch.googleapis.com/mcp --header "X-Goog-Api-Key: 여기에_키" -s local
```

## 4. DESIGN.md 만들기
연결되면 Claude Code 에 이렇게 요청하면 됩니다.
> Stitch에서 "500원 사주" 프로젝트의 색상 팔레트와 타이포그래피, 레이아웃 규칙을 가져와서 프로젝트 루트에 DESIGN.md 로 작성해줘.

프로젝트가 아직 없다면 Stitch 에서 먼저 화면을 만들거나, 아래처럼 시작할 수 있어요.
> Stitch에 모바일 웹 프로젝트 "500원 사주"를 만들고, 생년월일 입력 화면과 결과 화면을 생성한 뒤 그 디자인을 DESIGN.md 로 정리해줘.

## 참고
- 생성/수정 호출은 몇 분 걸릴 수 있습니다. 클라이언트 타임아웃이 짧으면 실패로 보이고 재시도되어 생성이 두 번 일어날 수 있어요.
- Stitch가 제공하는 도구 목록과 DESIGN.md 형식은 공식 문서가 바뀔 수 있으니, 연결 후 `/mcp` 에서 실제 도구 목록을 확인하세요.
