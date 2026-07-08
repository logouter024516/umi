import React, { useState, useEffect, useRef } from 'react';

// 외부에서 가져온 Teachable Machine 모델 URL
const MODEL_URL = "https://teachablemachine.withgoogle.com/models/-tCUXZZM1/";

export default function App() {
  // 상태 관리
  const [model, setModel] = useState(null);
  const [loadingModel, setLoadingModel] = useState(true);
  const [imageSrc, setImageSrc] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [isHeatIsland, setIsHeatIsland] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  // 웹캠 제어 관련 상태
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamInstance, setWebcamInstance] = useState(null);
  const webcamVideoRef = useRef(null);
  const fileInputRef = useRef(null);

  // Supabase 연결 설정 상태
  const [supabaseClient, setSupabaseClient] = useState(null);
  const [supabaseUrl, setSupabaseUrl] = useState(() => localStorage.getItem('sb_url') || '');
  const [supabaseKey, setSupabaseKey] = useState(() => localStorage.getItem('sb_key') || '');
  const [isConnected, setIsConnected] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // 게시판 상태 (기본 하이브리드 로컬 데이터 가동)
  const [posts, setPosts] = useState([
    {
      id: 1,
      author: "그린시티 연구원",
      title: "쿨루프(Cool Roof) 설치 지원 사업 제안 (로컬 예시)",
      content: "건물 옥상에 햇빛을 반사하는 흰색 차열 페인트를 도포하는 것만으로도 실내 온도 2~3도 감소 효과가 있습니다. 지자체 차원에서 골목길 주택가를 중심으로 쿨루프 시공을 적극 지원해야 합니다.",
      status: "열섬 지역 판정 (89%)",
      likes: 12,
      comments: [
        { id: 1, author: "김환경", text: "실제로 저희 집 옥상에 칠해봤는데 한여름 에어컨 사용량이 확실히 줄었습니다!" },
        { id: 2, author: "이지혜", text: "상가 건물들도 필수적으로 도입하면 좋겠어요." }
      ],
      created_at: "2026-07-08T12:00:00Z"
    },
    {
      id: 2,
      author: "에코디자이너",
      title: "투수성 잔디 블록 주차장 활성화 방안 (로컬 예시)",
      content: "아스팔트 포장은 주간의 열을 강하게 축적해 야간 열섬을 유발합니다. 잔디 블록과 투수성 타일로 주차장을 개선하면 지표면의 열기를 효과적으로 증발시킬 수 있습니다.",
      status: "열섬 지역 판정 (94%)",
      likes: 8,
      comments: [
        { id: 3, author: "박지성", text: "미관상으로도 아름답고 빗물 순환에도 대단히 좋을 것 같습니다." }
      ],
      created_at: "2026-07-07T15:30:00Z"
    }
  ]);

  // 새 글 작성을 위한 폼 상태
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [selectedAnalysisResult, setSelectedAnalysisResult] = useState("");

  // 새 댓글 작성을 위한 개별 포스트 입력란 매핑
  const [commentInputs, setCommentInputs] = useState({});

  // 폰트 및 리소스 (TF.js, Teachable Machine, Supabase) 초기 로드
  useEffect(() => {
    // 1. Pretendard 폰트 링크 주입
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css';
    document.head.appendChild(link);

    // 2. Supabase JS CDN 동적 로드
    const supabaseScript = document.createElement('script');
    supabaseScript.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
    supabaseScript.async = true;
    supabaseScript.onload = () => {
      // 로컬 스토리지에 정보가 남아있다면 즉시 연결 수립 시도
      if (supabaseUrl && supabaseKey) {
        initSupabase(supabaseUrl, supabaseKey);
      }
    };
    document.head.appendChild(supabaseScript);

    // 3. TensorFlow 및 Teachable Machine 로드
    const tfScript = document.createElement('script');
    tfScript.src = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js";
    tfScript.async = true;
    tfScript.onload = () => {
      const tmScript = document.createElement('script');
      tmScript.src = "https://cdn.jsdelivr.net/npm/@teachablemachine/image@latest/dist/teachablemachine-image.min.js";
      tmScript.async = true;
      tmScript.onload = () => {
        initTeachableMachine();
      };
      document.head.appendChild(tmScript);
    };
    document.head.appendChild(tfScript);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Supabase 클라이언트 연결 시도
  const initSupabase = (url, key) => {
    if (!window.supabase) return;
    try {
      const client = window.supabase.createClient(url, key);
      setSupabaseClient(client);
      setIsConnected(true);
      fetchPostsAndComments(client);
    } catch (err) {
      console.error("Supabase 연결 실패:", err);
      setIsConnected(false);
    }
  };

  // Supabase로부터 포스트 및 댓글 데이터 취득
  const fetchPostsAndComments = async (client) => {
    const activeClient = client || supabaseClient;
    if (!activeClient) return;

    try {
      // 1. 포스트 최신순 가져오기
      const { data: postsData, error: postsError } = await activeClient
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // 2. 댓글 모두 가져오기
      const { data: commentsData, error: commentsError } = await activeClient
        .from('comments')
        .select('*');

      if (commentsError) throw commentsError;

      // 3. 포스트와 댓글 매핑 조합
      const structuredPosts = (postsData || []).map(post => ({
        ...post,
        comments: (commentsData || []).filter(c => c.post_id === post.id)
      }));

      setPosts(structuredPosts);
    } catch (err) {
      console.error("데이터 로드 오류:", err.message);
    }
  };

  // 연결 저장소 저장 및 즉각 수립
  const handleSaveConfig = (e) => {
    e.preventDefault();
    if (!supabaseUrl || !supabaseKey) {
      alert("두 설정값을 모두 채워주셔야 실시간 데이터베이스가 연동됩니다.");
      return;
    }
    localStorage.setItem('sb_url', supabaseUrl);
    localStorage.setItem('sb_key', supabaseKey);
    initSupabase(supabaseUrl, supabaseKey);
    setShowConfigModal(false);
    alert("Supabase 원격 데이터베이스 연결 설정이 완료되었습니다.");
  };

  const handleDisconnect = () => {
    localStorage.removeItem('sb_url');
    localStorage.removeItem('sb_key');
    setSupabaseUrl('');
    setSupabaseKey('');
    setSupabaseClient(null);
    setIsConnected(false);
    alert("원격 서버와의 연동이 해제되었으며 로컬 데모 모드로 복귀합니다.");
  };

  // Teachable Machine 모델 로드
  const initTeachableMachine = async () => {
    try {
      setLoadingModel(true);
      const modelURL = MODEL_URL + "model.json";
      const metadataURL = MODEL_URL + "metadata.json";
      
      if (window.tmImage) {
        const loadedModel = await window.tmImage.load(modelURL, metadataURL);
        setModel(loadedModel);
        console.log("Teachable Machine Model Loaded.");
      }
    } catch (error) {
      console.error("모델 로딩 실패:", error);
    } finally {
      setLoadingModel(false);
    }
  };

  // 이미지 분석 수행 (업로드용)
  const analyzeImage = async (imgElement) => {
    if (!model) return;
    setAnalyzing(true);
    try {
      const prediction = await model.predict(imgElement);
      setPredictions(prediction);

      const topPrediction = prediction.reduce((prev, current) => (prev.probability > current.probability) ? prev : current);
      const isHeat = topPrediction.className.toLowerCase().includes('heat') || 
                     topPrediction.className.includes('열섬') || 
                     topPrediction.className.toLowerCase().includes('urban');
      
      setIsHeatIsland(isHeat);
      setSelectedAnalysisResult(`${topPrediction.className} (${(topPrediction.probability * 100).toFixed(0)}%)`);
    } catch (error) {
      console.error("이미지 분석 실패:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  // 파일 업로드 핸들러
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    stopWebcam();

    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target.result);
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        analyzeImage(img);
      };
    };
    reader.readAsDataURL(file);
  };

  // 실시간 웹캠 분석 시작
  const startWebcam = async () => {
    if (!model) return;
    try {
      setImageSrc(null);
      setWebcamActive(true);
      
      const flip = true;
      const webcam = new window.tmImage.Webcam(360, 270, flip);
      await webcam.setup();
      await webcam.play();
      setWebcamInstance(webcam);

      if (webcamVideoRef.current) {
        webcamVideoRef.current.innerHTML = "";
        webcamVideoRef.current.appendChild(webcam.canvas);
      }

      const loop = async () => {
        if (!webcam.active) return;
        webcam.update();
        const prediction = await model.predict(webcam.canvas);
        setPredictions(prediction);

        const topPrediction = prediction.reduce((prev, current) => (prev.probability > current.probability) ? prev : current);
        const isHeat = topPrediction.className.toLowerCase().includes('heat') || 
                       topPrediction.className.includes('열섬') || 
                       topPrediction.className.toLowerCase().includes('urban');
        setIsHeatIsland(isHeat);
        setSelectedAnalysisResult(`${topPrediction.className} (${(topPrediction.probability * 100).toFixed(0)}%)`);

        window.requestAnimationFrame(loop);
      };
      window.requestAnimationFrame(loop);
    } catch (error) {
      console.error("카메라 인터페이스 연동 실패:", error);
      alert("웹캠을 켜는데 실패했습니다. 기기 카메라 설정 혹은 브라우저 권한을 확인해주세요.");
      setWebcamActive(false);
    }
  };

  const stopWebcam = () => {
    if (webcamInstance) {
      webcamInstance.stop();
      setWebcamInstance(null);
    }
    setWebcamActive(false);
    if (webcamVideoRef.current) {
      webcamVideoRef.current.innerHTML = "";
    }
  };

  // 새 해결 방안 게시물 업로드
  const handleSubmitPost = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim() || !newAuthor.trim()) {
      alert("작성 정보를 모두 작성해주셔야 등록 가능합니다.");
      return;
    }

    const postPayload = {
      author: newAuthor,
      title: newTitle,
      content: newContent,
      status: selectedAnalysisResult || "직접 제안",
      likes: 0
    };

    if (isConnected && supabaseClient) {
      // Supabase 원격 DB로 업로드
      try {
        const { error } = await supabaseClient
          .from('posts')
          .insert([postPayload]);

        if (error) throw error;
        
        fetchPostsAndComments();
        setNewTitle("");
        setNewContent("");
        setNewAuthor("");
        alert("Supabase 실시간 클라우드 데이터베이스에 정상 업로드되었습니다!");
      } catch (err) {
        console.error("글 업로드 중 서버 에러:", err.message);
        alert(`원격 서버 전송 오류: ${err.message}`);
      }
    } else {
      // 로컬 대체 상태 업데이트
      const localPost = {
        id: Date.now(),
        ...postPayload,
        comments: [],
        created_at: new Date().toISOString()
      };
      setPosts([localPost, ...posts]);
      setNewTitle("");
      setNewContent("");
      setNewAuthor("");
      alert("데모 환경에 아이디어가 임시 반영되었습니다! 영구 연동을 원하시면 우측 상단 'Supabase 연결' 설정을 마쳐주세요.");
    }
  };

  // 좋아요(공감하기) 트랜잭션 처리
  const handleLike = async (post) => {
    if (isConnected && supabaseClient) {
      try {
        const { error } = await supabaseClient
          .from('posts')
          .update({ likes: (post.likes || 0) + 1 })
          .eq('id', post.id);

        if (error) throw error;
        fetchPostsAndComments();
      } catch (err) {
        console.error("좋아요 처리 에러:", err.message);
      }
    } else {
      setPosts(posts.map(p => p.id === post.id ? { ...p, likes: (p.likes || 0) + 1 } : p));
    }
  };

  // 댓글 입력 핸들러
  const handleCommentChange = (id, text) => {
    setCommentInputs({
      ...commentInputs,
      [id]: text
    });
  };

  // 댓글 추가 작성
  const handleAddComment = async (postId) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    if (isConnected && supabaseClient) {
      try {
        const { error } = await supabaseClient
          .from('comments')
          .insert([{
            post_id: postId,
            author: "시민 참여자",
            text: text.trim()
          }]);

        if (error) throw error;
        setCommentInputs({ ...commentInputs, [postId]: "" });
        fetchPostsAndComments();
      } catch (err) {
        console.error("댓글 전송 중 오류 발생:", err.message);
      }
    } else {
      setPosts(posts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            comments: [
              ...(p.comments || []),
              { id: Date.now(), author: "시민 참여자", text: text.trim(), created_at: new Date().toISOString() }
            ]
          };
        }
        return p;
      }));
      setCommentInputs({ ...commentInputs, [postId]: "" });
    }
  };

  // 테이블 생성용 SQL 코드 예시
  const sqlSchema = `-- Supabase SQL Editor에 복사하여 붙여넣으세요.

-- 1. posts 테이블 생성
create table posts (
  id bigint generated by default as identity primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  author text not null,
  title text not null,
  content text not null,
  status text,
  likes int4 default 0
);

-- 2. comments 테이블 생성
create table comments (
  id bigint generated by default as identity primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  post_id bigint references posts(id) on delete cascade not null,
  author text not null,
  text text not null
);

-- 3. 실시간 및 접근 권한 설정 (모두 읽기 및 쓰기 허용)
alter table posts enable row level security;
alter table comments enable row level security;

create policy "누구나 글 읽기 가능" on posts for select using (true);
create policy "누구나 글 쓰기 가능" on posts for insert with check (true);
create policy "누구나 글 수정 가능" on posts for update using (true);

create policy "누구나 댓글 읽기 가능" on comments for select using (true);
create policy "누구나 댓글 쓰기 가능" on comments for insert with check (true);
`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-900 overflow-x-hidden relative" style={{ fontFamily: 'Pretendard, -apple-system, sans-serif' }}>
      
      {/* Liquid Glass 형태의 오로라 이펙트 백그라운드 */}
      <div className="absolute top-[-5%] left-[-5%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-tr from-cyan-500/15 to-emerald-500/5 blur-[130px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-bl from-indigo-500/10 to-purple-500/5 blur-[160px] pointer-events-none"></div>

      {/* 헤더 */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-slate-950/70 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 via-teal-400 to-emerald-400 p-[1.5px] shadow-[0_0_20px_rgba(34,211,238,0.25)]">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <span className="text-xl">🌡️</span>
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-cyan-100 to-teal-300 bg-clip-text text-transparent">
                Urban Heat Island Alleviator
              </h1>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">실시간 클라우드 DB 연동형 프로토타입</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {isConnected ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  Supabase 온라인
                </span>
                <button
                  onClick={handleDisconnect}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-rose-500/10 hover:text-rose-400 text-slate-400 border border-white/10 transition-all text-xs font-semibold"
                >
                  연동 해제
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfigModal(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 hover:opacity-90 active:scale-95 text-slate-950 font-bold text-xs shadow-lg transition-all flex items-center gap-1.5"
              >
                <span>⚡ Supabase 연결</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 왼쪽: 지표면 진단 UI */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400"></div>
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">도심 위성/항공 이미지 측정</h2>
                <p className="text-xs text-slate-400 mt-1">인공지능 모델이 열섬 위험 구역을 자동 수치 분류합니다.</p>
              </div>
              <span className="text-2xl">🖥️</span>
            </div>

            {loadingModel ? (
              <div className="h-64 flex flex-col items-center justify-center bg-slate-950/50 rounded-2xl border border-dashed border-white/10 gap-3">
                <div className="w-8 h-8 rounded-full border-4 border-cyan-400/30 border-t-cyan-400 animate-spin"></div>
                <p className="text-xs text-slate-400">Teachable Machine 인공지능 로딩 중...</p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* 비디오/이미지 뷰포트 */}
                <div className="relative aspect-[4/3] w-full bg-slate-950 rounded-2xl border border-white/5 overflow-hidden flex items-center justify-center shadow-inner">
                  {imageSrc && (
                    <img src={imageSrc} alt="진단 업로드 이미지" className="w-full h-full object-cover" />
                  )}
                  {webcamActive && (
                    <div ref={webcamVideoRef} className="w-full h-full [&>canvas]:w-full [&>canvas]:h-full [&>canvas]:object-cover" />
                  )}
                  {!imageSrc && !webcamActive && (
                    <div className="text-center p-6 space-y-3">
                      <div className="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center text-slate-400 text-2xl border border-white/10">
                        🌆
                      </div>
                      <p className="text-xs text-slate-400">열섬 평가를 위해 도심지 이미지를 제출하거나 캠을 켜세요.</p>
                    </div>
                  )}

                  {analyzing && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 rounded-full border-2 border-teal-400/20 border-t-teal-400 animate-spin"></div>
                      <p className="text-xs text-teal-400 font-semibold">인공지능 정렬 평가 중...</p>
                    </div>
                  )}
                </div>

                {/* 컨트롤러 패널 */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="py-3 px-4 rounded-xl bg-gradient-to-b from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 active:scale-98 border border-white/10 text-xs font-semibold text-white transition-all flex items-center justify-center gap-2"
                  >
                    <span>📁 로컬 사진 로드</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  {webcamActive ? (
                    <button
                      onClick={stopWebcam}
                      className="py-3 px-4 rounded-xl bg-rose-500/20 border border-rose-500/30 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold active:scale-98 transition-all flex items-center justify-center gap-2"
                    >
                      <span>⏹️ 웹캠 종료</span>
                    </button>
                  ) : (
                    <button
                      onClick={startWebcam}
                      className="py-3 px-4 rounded-xl bg-cyan-500/10 border border-cyan-400/30 hover:bg-cyan-500/20 text-cyan-300 text-xs font-semibold active:scale-98 transition-all flex items-center justify-center gap-2"
                    >
                      <span>📷 실시간 촬영</span>
                    </button>
                  )}
                </div>

                {/* 진단 피드백 출력 */}
                {predictions.length > 0 && (
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide">AI 분석 판정 지표</h3>
                      <div>
                        {isHeatIsland ? (
                          <span className="px-2.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/20 text-[10px] font-bold">집중 관리 대상 (우려)</span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-[10px] font-bold">정상 지대</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {predictions.map((pred, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs text-slate-400">
                            <span>{pred.className}</span>
                            <span className="font-semibold text-white">{(pred.probability * 100).toFixed(1)}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${idx === 0 ? 'bg-gradient-to-r from-cyan-400 to-teal-400' : 'bg-slate-700'}`} 
                              style={{ width: `${pred.probability * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </section>

        {/* 오른쪽: 아이디어 토론 게시판 */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          
          {/* 아이디어 접수 폼 */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative">
            <h2 className="text-xl font-bold text-white tracking-tight mb-4">온도 완화 제안서 작성</h2>
            <form onSubmit={handleSubmitPost} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium">제안자 서명</label>
                  <input
                    type="text"
                    placeholder="예: 그린 디자이너"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium">데이터 자동 동기화</label>
                  <input
                    type="text"
                    disabled
                    value={selectedAnalysisResult ? `분석 완료: ${selectedAnalysisResult}` : "측정이 완료되면 매칭 결과가 붙습니다."}
                    className="w-full bg-slate-950/70 border border-white/10 text-slate-500 rounded-xl px-3.5 py-2.5 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">핵심 기후 아이디어 제목</label>
                <input
                  type="text"
                  placeholder="예: 고반사 쿨루프 페인트 전동화 지원"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">상세 대안 및 파급 효과</label>
                <textarea
                  placeholder="녹화 사업, 투수 바닥 시공, 바람길 형성 등 열섬 감소를 일으키는 실용적 대안을 정성껏 기고해 주세요."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows="4"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 transition-all resize-none"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:opacity-90 active:scale-98 text-slate-950 font-bold text-xs py-3 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(34,211,238,0.15)]"
                >
                  {isConnected ? "🚀 실시간 등록 (Supabase)" : "💡 로컬 등록 (데모 저장)"}
                </button>
              </div>
            </form>
          </div>

          {/* 게시글 목록 */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>💬 누적 개선 제안서 목록</span>
              <span className="text-xs font-normal text-slate-400">({posts.length}건)</span>
            </h3>

            {posts.map((post) => (
              <div key={post.id} className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl space-y-4 transition-all">
                
                {/* 상단 메타 */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-cyan-400/10 text-cyan-400 flex items-center justify-center text-[10px] font-bold">
                      👤
                    </span>
                    <span className="font-semibold text-slate-200">{post.author}</span>
                    <span className="text-slate-500">|</span>
                    <span className="text-slate-500">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-semibold text-[10px]">
                    {post.status}
                  </span>
                </div>

                {/* 타이틀 및 상세 설명 */}
                <div className="space-y-1.5">
                  <h4 className="text-base font-bold text-white tracking-tight">
                    {post.title}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>
                </div>

                {/* 반응 기능 */}
                <div className="flex items-center gap-4 pt-3 border-t border-white/5">
                  <button
                    onClick={() => handleLike(post)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-xs text-slate-300 font-medium transition-all"
                  >
                    <span>👍 동의 및 공감</span>
                    <span className="font-semibold text-cyan-300">{post.likes || 0}</span>
                  </button>
                  <span className="text-xs text-slate-500">
                    작성된 피드백 {(post.comments || []).length}개
                  </span>
                </div>

                {/* 피드백 스레드 */}
                <div className="bg-slate-950/40 rounded-2xl p-4 border border-white/5 space-y-3">
                  {(post.comments || []).length > 0 && (
                    <div className="space-y-2">
                      {(post.comments || []).map((comment) => (
                        <div key={comment.id} className="text-xs leading-relaxed">
                          <span className="font-bold text-slate-300 mr-2">{comment.author}:</span>
                          <span className="text-slate-400">{comment.text}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 댓글 입력 폼 */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="기후 개선 대안에 대한 타당성 피드백을 전달하세요..."
                      value={commentInputs[post.id] || ""}
                      onChange={(e) => handleCommentChange(post.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddComment(post.id);
                      }}
                      className="flex-1 bg-slate-950 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 transition-all"
                    />
                    <button
                      onClick={() => handleAddComment(post.id)}
                      className="px-3 bg-white/10 border border-white/5 hover:bg-white/15 text-xs font-semibold rounded-xl text-white transition-all"
                    >
                      등록
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>

        </section>
      </main>

      {/* Supabase 설정 모달 창 */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-2xl relative shadow-2xl max-h-[85vh] overflow-y-auto space-y-5">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>⚡ Supabase 연결 인터페이스</span>
              </h3>
              <button 
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Supabase Project URL</label>
                <input
                  type="text"
                  placeholder="https://your-project-id.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-white font-mono focus:outline-none focus:border-cyan-400 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Supabase Anon Key (Public Key)</label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-white font-mono focus:outline-none focus:border-cyan-400 transition-all"
                />
              </div>

              <div className="p-3 bg-cyan-950/20 border border-cyan-800/30 rounded-xl text-cyan-300 leading-relaxed text-[11px]">
                🔑 <strong>알림:</strong> 입력하신 API Key와 연결 주소는 로컬 브라우저 보안 스토리지(localStorage)에만 기록되며, 어떠한 외부 타사 서버로도 전송되지 않으므로 안심하고 사용하셔도 좋습니다.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 text-xs font-semibold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 hover:opacity-90 active:scale-95 text-slate-950 font-bold"
                >
                  연동 가동
                </button>
              </div>
            </form>

            {/* SQL 스크립트 도우미 */}
            <div className="border-t border-white/5 pt-4 space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-teal-400">📝 연동용 PostgreSQL Table Schema 정의문</h4>
                <button
                  onClick={() => {
                    document.execCommand('copy');
                    navigator.clipboard.writeText(sqlSchema);
                    alert("SQL 쿼리가 클립보드에 복사되었습니다!");
                  }}
                  className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-semibold text-slate-300 transition-all"
                >
                  복사하기
                </button>
              </div>
              <pre className="bg-slate-950 p-3 rounded-xl border border-white/5 font-mono text-[10px] text-slate-400 overflow-x-auto max-h-40 leading-relaxed">
                {sqlSchema}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* 푸터 */}
      <footer className="border-t border-white/5 py-10 mt-16 backdrop-blur-sm bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-3">
          <p className="text-xs text-slate-500 font-medium">
            © 2026 Urban Heat Island Alleviator & Supabase Database. All rights reserved.
          </p>
          <p className="text-[10px] text-slate-600 max-w-xl mx-auto leading-relaxed">
            본 웹앱은 사용자가 입력한 Supabase 연동 주소 및 딥러닝 판단 모델을 통해 실제 관계형 데이터베이스와 유기적으로 동기화됩니다. 인공지능 탐지 기능을 통해 기후 완화 대안 수립에 힘써 주세요.
          </p>
        </div>
      </footer>
    </div>
  );
}