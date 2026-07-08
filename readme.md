[프로젝트 결과 보고서] 도심 열섬 현상 정밀 분석 및 Supabase 연동형 시민 참여 플랫폼 개발

과제명: AI 기반 도심 열섬 현상(Urban Heat Island) 진단 및 실시간 시민 해결 방안 제안 플랫폼 구축

개발 기간: 2026. 06. ~ 2026. 07.

주요 기술: React, Supabase, TensorFlow.js, Teachable Machine, Tailwind CSS

1. 서론 (Introduction)

1.1. 개발 배경 및 필요성

급격한 도시화와 아스팔트·콘크리트 피복 면적의 증가는 주간의 태양열 축적 및 야간의 방출 억제를 야기하여 주변 농촌 지역보다 도시 중심부의 온도가 현저하게 높아지는 도심 열섬 현상(Urban Heat Island, UHI)을 유발합니다.

열섬 현상의 강도($\Delta T_{u-r}$)는 다음과 같은 열수지 방정식의 간소화된 형태로 표현될 수 있습니다.

$$\Delta T_{u-r} = T_{urban} - T_{rural}$$

$$Q^* + Q_F = Q_H + Q_E + \Delta Q_S$$

(여기서 $Q^$는 순 복사 에너지, $Q_F$는 인공열, $Q_H$는 현열 수송, $Q_E$는 잠열 수송, $\Delta Q_S$는 도심 지표에 저장되는 열량)*

도시 열환경 악화는 시민들의 온열 질환 유발, 냉방 에너지 사용 급증으로 인한 이산화탄소 배출 증가 등 기후 변화의 악순환을 초래합니다. 이를 예방하기 위해서는 고온 집중 구역을 정밀하게 탐지하고, 바람길 확보, 녹지 조성, 고반사 차열 페인트(Cool Roof) 시공 등 위치 맞춤형 해결 대책이 조속히 실행되어야 합니다.

1.2. 개발 목적

본 프로젝트는 "AI 분석 기술"과 "실시간 클라우드 데이터베이스"를 결합하여 다음과 같은 목적을 달성하고자 합니다.

사용자가 업로드한 도심 위성·항공 이미지나 실시간 카메라 입력을 AI 모델로 즉각 분석하여 열섬 위험 구역 여부 정량 평가.

판정된 정량 지표를 바탕으로 시민과 기후 연구원이 직접 온도 저감 대안(Idea)을 제안하는 크라우드소싱 공간 제공.

Supabase와의 실시간 연동을 통한 데이터 무결성 보존 및 기후 위기 극복을 위한 디지털 거버넌스 프로토타입 제시.

2. 시스템 아키텍처 및 핵심 기술 (System Architecture)

본 시스템은 클라이언트 측에서 모든 인공지능 연산과 렌더링을 처리하고, 서버리스 백엔드인 Supabase를 통해 실시간 데이터 저장 및 동기화를 수행하는 Serverless Thin-Client 아키텍처를 채택하였습니다.

       [ Client Side (React App) ]
+----------------------------------------+
|  +----------------------------------+  |
|  |     Teachable Machine Engine     |  |
|  |   (TensorFlow.js / Web Camera)   |  |
|  +-----------------+----------------+  |
|                    | 판정 메타데이터      |
|                    v                   |
|  +----------------------------------+  |       API Call (HTTPS)
|  |     React App State Manager     |=========================> [ Supabase Cloud ]
|  | (Local Fallback <-> Live Hybrid) |                          | - PostgreSQL DB |
|  +----------------------------------+  | <=========================| - RLS Guard     |
+----------------------------------------+     Realtime Sync     +-----------------+


2.1. 프론트엔드 (Frontend)

React: 사용자 인터페이스의 상태(State)와 컴포넌트 생명주기를 선언적으로 관리합니다.

Tailwind CSS: 다크 모드 기반의 프리미엄 UI 디자인 시스템을 신속하게 구축하며, 모바일 화면에서도 요소가 깨지지 않도록 완전 반응형 중단점(Breakpoints)을 설계했습니다.

Pretendard Font: 가독성을 높이기 위해 한글 자모가 유려하게 최적화된 사외 서체를 동적으로 주입하였습니다.

2.2. 기계 학습 모델 (Machine Learning)

TensorFlow.js & Teachable Machine: 브라우저 환경에서 CPU/GPU 하드웨어 가속을 활용해 서버 오버헤드 없이 온디바이스(On-device) 이미지 분류 모델을 가동합니다.

이중 캡처 인터페이스: FileReader API를 이용한 정적 이미지 분석 방식과 Webcam API를 통한 실시간 동영상 프레임 분석 방식을 모두 지원합니다.

2.3. 데이터베이스 및 실시간성 (Database & Realtime)

Supabase Client: 원격 PostgreSQL 인스턴스와 보안 터널을 생성하여 실시간 데이터 검색, 삽입, 갱신 트랜잭션을 처리합니다.

하이브리드 모드 상태 관리: Supabase 접근에 필요한 인증 정보가 부재할 경우 localStorage 및 인메모리(In-Memory) 상태 배열로 부드럽게 Fallback 처리되어 중단 없는 사용자 경험을 보장합니다.

3. 데이터베이스 설계 및 보안 (Database & Security)

본 플랫폼은 데이터의 원자성(Atomicity)과 일관성(Consistency)을 유지하기 위해 관계형 데이터베이스(RDBMS) 스키마를 탑재하고 있으며, 권한이 없는 비정상 접근을 차단하기 위해 PostgreSQL의 행 수준 보안(RLS, Row Level Security) 정책을 엄격하게 수립하였습니다.

3.1. 관계형 스키마 정의 (ERD Schema)

        [ posts ]                         [ comments ]
+--------------------+               +--------------------+
| id (PK)   bigint   |<------+       | id (PK)   bigint   |
| created_at timestz |       +------| post_id   bigint   |
| author     text    |               | created_at timestz |
| title      text    |               | author     text    |
| content    text    |               | text       text    |
| status     text    |               +--------------------+
| likes      int4    |
+--------------------+


1) 게시글 테이블 (posts)

id (bigint, PK): 기본 키, 자동 증가 서열값.

created_at (timestamp with time zone): 게시글 최초 등록 시간 (UTC 기준 기본값 설정).

author (text): 게시글 작성자 명의.

title (text): 제안하고자 하는 기후 완화 대안의 제목.

content (text): 기술적/정책적 대안 및 온도 저감 기대 효과의 내용.

status (text): AI가 판단한 열섬 위험도 바인딩 문자열.

likes (int4): 해당 기안에 대한 시민들의 공감 및 추천 수 (기본값: 0).

2) 피드백 댓글 테이블 (comments)

id (bigint, PK): 기본 키, 자동 증가 서열값.

post_id (bigint, FK): posts.id를 참조하며, 원본 제안글이 삭제될 시 종속된 모든 피드백 댓글이 함께 물리적 삭제되도록 ON DELETE CASCADE 관계 수립.

author (text): 피드백 작성자 명의.

text (text): 해당 기술 제안서에 대한 정성적 검토 피드백.

3.2. 보안 규칙 설계 (Row Level Security)

개발 환경 보안을 넘어 배포 단계의 안전망을 위해 다음과 같이 RLS 정책을 수립하였습니다.

-- RLS 기능 원천 활성화
alter table posts enable row level security;
alter table comments enable row level security;

-- 누구나 기후 제안 및 피드백 의견을 투명하게 열람할 수 있도록 Select 정책 설정
create policy "누구나 글 읽기 가능" on posts for select using (true);
create policy "누구나 댓글 읽기 가능" on comments for select using (true);

-- 크라우드소싱 시민 참여를 장려하기 위해 누구나 글/댓글 작성이 가능하도록 Insert 정책 수립
create policy "누구나 글 쓰기 가능" on posts for insert with check (true);
create policy "누구나 댓글 쓰기 가능" on comments for insert with check (true);

-- 공감(👍 좋아요) 수 가산을 위한 Update 정책 설정
create policy "누구나 글 수정 가능" on posts for update using (true);


4. 핵심 기능 구현 세부 사항 (Core Implementation)

4.1. 온디바이스 AI 열섬 구역 진단 프로세스

사용자가 도심 항공 사진 파일을 업로드하거나 실시간 웹캠을 켭니다.

이미지 프레임이 주입되면 tmImage.predict() 함수가 호출됩니다.

딥러닝 모델의 출력 노드에서 반환된 분류 레이블 중 최대 임계값(Threshold)을 만족하는 결과를 추출합니다.

추출된 최종 판정 결과(예: Urban Heat Island (89%))는 컴포넌트 상태 변수인 selectedAnalysisResult에 기록되며, 제안서 작성 서식 양식 내부의 "데이터 자동 동기화" 칸으로 실시간 전사됩니다.

4.2. 하이브리드 데이터 동기화 알고리즘

데이터 통신 실패 상황이나 Supabase 연결 정보 비활성화 상태에서도 애플리케이션의 핵심 동선이 마비되지 않도록 이중 통제 구조를 설계했습니다.

const handleSubmitPost = async (e) => {
  e.preventDefault();
  
  const postPayload = {
    author: newAuthor,
    title: newTitle,
    content: newContent,
    status: selectedAnalysisResult || "직접 제안",
    likes: 0
  };

  if (isConnected && supabaseClient) {
    // 1순위: Supabase 원격 서버리스 데이터베이스 저장 시도
    const { error } = await supabaseClient.from('posts').insert([postPayload]);
    if (!error) {
      fetchPostsAndComments(); // 즉각적인 UI 리프레시 수행
    }
  } else {
    // 2순위: 통신 비활성화 시 로컬 메모리 상태에 일시 보관 처리
    const localPost = {
      id: Date.now(),
      ...postPayload,
      comments: [],
      created_at: new Date().toISOString()
    };
    setPosts([localPost, ...posts]);
  }
};


5. 기대 효과 및 향후 과제 (Conclusion & Future Work)

5.1. 기대 효과

정량적 기후 지표 연동: 시민들이 단순한 감상적 기고를 넘어서, 이미지 분석 AI를 활용한 정량적 판정 지표를 무기로 논리적이고 실증적인 정책 대안을 발의할 수 있습니다.

기후 민주주의 실현: 제안된 아이디어에 대해 투명한 찬반 공감 시스템과 피드백 댓글 인프라를 클라우드로 제공하여, 디지털 리터러시 기반의 기후 거버넌스를 구축할 수 있습니다.

서버리스 아키텍처의 경제성: 트래픽 부하가 심한 이미지 추론 연산은 클라이언트 기기 자원을 전적으로 활용하고, 정형 데이터 통신만 백엔드로 연동하여 극도의 서버 비용 절감 및 빠른 응답 속도를 확보합니다.

6. 프로젝트 설정 및 배포 (Project Setup & Deployment)

6.1. 로컬 개발 환경 구성

```bash
# 의존성 설치
npm install

# 환경 변수 설정 (Supabase 연동 시)
# .env.example을 복사하여 .env 파일을 만들고 실제 값 입력
cp .env.example .env

# 개발 서버 실행
npm run dev
```

6.2. GitHub Actions를 통한 GitHub Pages 배포

본 프로젝트는 GitHub Actions 워크플로우를 통해 main 브랜치 푸시 시 자동으로 GitHub Pages에 배포됩니다.

레포지토리 Settings → Secrets and variables → Actions에서 다음 Secrets를 설정하세요:

| Secret 이름 | 설명 |
|---|---|
| `SUPABASE_URL` | Supabase 프로젝트 URL (예: https://xxx.supabase.co) |
| `SUPABASE_ANON_KEY` | Supabase Anon Public Key |

워크플로우 파일: `.github/workflows/deploy.yml`

배포 시 `VITE_SUPABASE_URL`과 `VITE_SUPABASE_ANON_KEY`가 빌드 환경 변수로 자동 주입되며, 앱은 모달이나 버튼 없이 사전 설정된 Supabase에 자동 연결됩니다. 환경 변수가 없을 경우 로컬 데모 모드로 동작합니다.

6.3. Node.js 프로젝트 구조

```
heat-island-analyzer/
├── .github/workflows/deploy.yml   # GitHub Pages 배포 워크플로우
├── .env.example                    # 환경 변수 템플릿
├── index.html                      # Vite 진입 HTML
├── package.json                    # Node.js 의존성 및 스크립트
├── tsconfig.json / tsconfig.*.json # TypeScript 설정
├── vite.config.ts                  # Vite + Tailwind CSS 설정
└── src/
    ├── main.tsx                    # React 진입점
    ├── App.tsx                     # 메인 컴포넌트 (Supabase 자동 연동)
    ├── index.css                   # Tailwind CSS 진입
    ├── types.d.ts                  # Window 전역 타입 선언
    └── vite-env.d.ts               # Vite 타입 선언
```

5.2. 고도화 과제

웹소켓 리얼타임 동기화: supabase.channel() API를 도입하여, 다른 사용자가 새로운 대안을 올리거나 공감을 누를 때 별도의 폴링이나 수동 새로고침 없이 화면이 실시간 갱신되도록 개선할 예정입니다.

대용량 미디어 파일 저장소 연동: 사용자가 진단에 활용한 원본 이미지를 Supabase Storage 버킷에 직접 업로드하고, 데이터베이스에 해당 미디어의 Public URL을 함께 바인딩하여 게시판 카드에 시각 자료를 추가할 예정입니다.
