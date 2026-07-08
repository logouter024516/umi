import React, { useState, useEffect, useRef } from 'react';

const MODEL_URL = "https://teachablemachine.withgoogle.com/models/-tCUXZZM1/";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export default function App() {
  const [model, setModel] = useState(null);
  const [loadingModel, setLoadingModel] = useState(true);
  const [imageSrc, setImageSrc] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [isHeatIsland, setIsHeatIsland] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamInstance, setWebcamInstance] = useState(null);
  const webcamVideoRef = useRef(null);
  const fileInputRef = useRef(null);

  const [supabaseClient, setSupabaseClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

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

  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [selectedAnalysisResult, setSelectedAnalysisResult] = useState("");

  const [commentInputs, setCommentInputs] = useState({});

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css';
    document.head.appendChild(link);

    const supabaseScript = document.createElement('script');
    supabaseScript.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
    supabaseScript.async = true;
    supabaseScript.onload = () => {
      if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        initSupabase(SUPABASE_URL, SUPABASE_ANON_KEY);
      }
    };
    document.head.appendChild(supabaseScript);

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

  const fetchPostsAndComments = async (client?) => {
    const activeClient = client || supabaseClient;
    if (!activeClient) return;

    try {
      const { data: postsData, error: postsError } = await activeClient
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      const { data: commentsData, error: commentsError } = await activeClient
        .from('comments')
        .select('*');

      if (commentsError) throw commentsError;

      const structuredPosts = (postsData || []).map(post => ({
        ...post,
        comments: (commentsData || []).filter(c => c.post_id === post.id)
      }));

      setPosts(structuredPosts);
    } catch (err) {
      console.error("데이터 로드 오류:", err.message);
    }
  };

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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    stopWebcam();

    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target.result as string);
      const img = new Image();
      img.src = event.target.result as string;
      img.onload = () => {
        analyzeImage(img);
      };
    };
    reader.readAsDataURL(file);
  };

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
      alert("데모 환경에 아이디어가 임시 반영되었습니다!");
    }
  };

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

  const handleCommentChange = (id, text) => {
    setCommentInputs({
      ...commentInputs,
      [id]: text
    });
  };

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-900 overflow-x-hidden relative" style={{ fontFamily: 'Pretendard, -apple-system, sans-serif' }}>

      <div className="absolute top-[-5%] left-[-5%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-tr from-cyan-500/15 to-emerald-500/5 blur-[130px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-bl from-indigo-500/10 to-purple-500/5 blur-[160px] pointer-events-none"></div>

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
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                온라인
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                로컬 데모 모드
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">

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
                <p className="text-xs text-slate-400">인공지능 로딩 중...</p>
              </div>
            ) : (
              <div className="space-y-6">

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

        <section className="lg:col-span-7 flex flex-col gap-6">

          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative">
            <h2 className="text-xl font-bold text-white tracking-tight mb-4">온도 완화 제안서 작성</h2>
            <form onSubmit={handleSubmitPost} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium">제안자 성명</label>
                  <input
                    type="text"
                    placeholder="예: 그린 디자이너"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium">분석 정보</label>
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
                  rows={4}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 transition-all resize-none"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:opacity-90 active:scale-98 text-slate-950 font-bold text-xs py-3 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(34,211,238,0.15)]"
                >
                  {isConnected ? "등록" : "임시 저장"}
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>💬 누적 개선 제안서 목록</span>
              <span className="text-xs font-normal text-slate-400">({posts.length}건)</span>
            </h3>

            {posts.map((post) => (
              <div key={post.id} className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl space-y-4 transition-all">

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

                <div className="space-y-1.5">
                  <h4 className="text-base font-bold text-white tracking-tight">
                    {post.title}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>
                </div>

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

      <footer className="border-t border-white/5 py-10 mt-16 backdrop-blur-sm bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-3">
          <p className="text-xs text-slate-500 font-medium">
            © 2026 Urban Heat Island Alleviator & Supabase Database. All rights reserved.
          </p>
          <p className="text-[10px] text-slate-600 max-w-xl mx-auto leading-relaxed">
            본 웹앱은 사전 설정된 Supabase 연동 주소 및 딥러닝 판단 모델을 통해 실제 관계형 데이터베이스와 유기적으로 동기화됩니다. 인공지능 탐지 기능을 통해 기후 완화 대안 수립에 힘써 주세요.
          </p>
        </div>
      </footer>
    </div>
  );
}
