# DREAM CANVAS

나만 쓰는 AI 그림 생성 앱이에요. 설치나 빌드, 서버 없이 브라우저만 있으면 돌아가요.

## 실행

```bash
cd ai-studio
python3 -m http.server 4180
```

브라우저에서 http://localhost:4180 을 열면 돼요.
`index.html`을 더블클릭해서 열면 동작하지 않으니, 꼭 위처럼 주소로 열어 주세요.

## 그림 엔진 고르기 (오른쪽 위 ⚙ 설정)

### 1. Pollinations: 그래픽카드 없이 쓰기

1. https://enter.pollinations.ai/keys 에 가입해서 **Secret key(`sk_…`)** 를 만들어요.
   - 만들 때 **예산(budget)을 작게** 걸고, 권한은 이미지 모델만 주는 걸 추천해요.
2. 앱 설정에 키를 붙여 넣고 저장해요.
3. 모델 목록에는 기본으로 **무료 모델만** 보여요. 예: Z-Image Turbo, FLUX.1 Schnell, FLUX.2 Klein.

> 무료 모델도 계정의 무료 Pollen을 조금씩 써요. 무료로 주는 양은 Pollinations 정책에 따라 바뀔 수 있어요.
> 키는 이 브라우저의 localStorage에만 저장되고, Pollinations 말고 다른 곳으로는 보내지 않아요.

### 2. 내 PC: 완전 무료, 횟수 무제한, 애니메 모델 자유롭게

NVIDIA 그래픽카드가 있으면(VRAM 6GB 이상 권장) 이 방법이 PixAI와 가장 비슷한 결과를 내요.

1. [Stable Diffusion WebUI Forge](https://github.com/lllyasviel/stable-diffusion-webui-forge)를 설치해요.
   AUTOMATIC1111 WebUI도 돼요.
2. 원하는 SDXL 애니메 모델(예: Illustrious, NoobAI, Animagine 계열)을 받아서 `models/Stable-diffusion/` 폴더에 넣어요.
3. API와 CORS를 켜고 실행해요.
   - Windows: `webui-user.bat`의 `set COMMANDLINE_ARGS=--api --cors-allow-origins=*`
   - Mac/Linux: `./webui.sh --api --cors-allow-origins=*`
4. 앱 설정에서 엔진을 **내 PC**로 바꾸고 **연결 확인**을 눌러요.
   주소는 기본값 `http://127.0.0.1:7860`이에요.

내 PC 엔진에서는 네거티브 프롬프트, 스텝, CFG, 샘플러, 체크포인트 선택이 적용돼요.

## 기능

- 그림체 프리셋 11종 (게임 캐릭터, 애니메, 수채화, 픽셀아트 등): 프롬프트 뒤에 스타일 태그를 붙여 줘요
- 비율 5종 (1:1, 2:3, 3:2, 9:16, 16:9), 한 번에 1~4장
- 시드 고정과 랜덤: 같은 시드를 쓰면 비슷한 그림을 다시 뽑을 수 있어요
- 갤러리 자동 저장 (브라우저 IndexedDB): 새로고침해도 남아요
- 크게 보기, 다운로드, **이 설정 다시 쓰기**, 삭제
- 입력하던 프롬프트와 설정 자동 저장, 다크 모드, 모바일 화면 지원

## 파일

| 파일 | 내용 |
|---|---|
| `index.html` | 화면 구조 |
| `style.css` | 디자인 (라이트/다크) |
| `app.js` | 엔진 연결, 생성, 갤러리 저장 |
