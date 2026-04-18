import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Home, Lock, Music, Play, Pause, SkipForward, SkipBack, MessageCircleHeart, Ghost, Waves, CloudRain, Flame, Sparkles, Wind, Bot, Send, X } from 'lucide-react';
import { messageApi, aiModelApi, spiritApi } from '../api';

const MUSIC_BASE_URL = '/assets/music';
const AMBIENT_BASE_URL = '/assets/ambient';

const rawPlaylist = [
  "青花瓷-周杰伦.mp3",
  "晴天-周杰伦.mp3",
  "兰亭序-周杰伦.mp3",
  "消愁-薛之谦&毛不易.mp3",
  "有何不可-许嵩.mp3",
  "玫瑰花的葬礼-许嵩.mp3",
];

const playlist = rawPlaylist.map(file => {
  const [namePart] = file.split('.mp3');
  const lastDash = namePart.lastIndexOf('-');
  return {
    title: namePart.substring(0, lastDash),
    artist: namePart.substring(lastDash + 1),
    url: `${MUSIC_BASE_URL}/${encodeURIComponent(file)}`,
  };
});

const anonAvatars = [
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Midnight",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Ocean",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Sunset",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Forest",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Cloud"
];

/**
 * 极简粒子类 - 用于蓝眼泪效果
 */
class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 2 + 1;
    this.speedX = (Math.random() - 0.5) * 0.5;
    this.speedY = (Math.random() - 0.5) * 0.5;
    this.life = 1;
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.life -= 0.005;
  }
}

const IslandCanvas = () => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let w, h;
    const stars = [];
    const meteors = [];
    const particles = [];
    const islandPoints = [];

    const init = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;

      stars.length = 0;
      for (let i = 0; i < 150; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h * 0.8,
          size: Math.random() * 1.5,
          opacity: Math.random(),
          blink: Math.random() * 0.05
        });
      }

      islandPoints.length = 0;
      const segments = 30;
      for (let i = 0; i <= segments; i++) {
        const relX = i / segments;
        let baseHeight = Math.sin(relX * Math.PI) * 80;
        if (relX > 0.6 && relX < 0.8) baseHeight += 40;
        let noise = baseHeight + (Math.random() - 0.5) * 20;
        if (i === 0 || i === segments) noise = 0;
        islandPoints.push({ x: relX, y: noise });
      }
    };

    const drawSky = (time) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#020a1a');
      grad.addColorStop(0.5, '#051b36');
      grad.addColorStop(1, '#0c2d52');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    };

    const drawMeteors = (time) => {
      if (Math.random() < 0.005) {
        meteors.push({
          x: Math.random() * w,
          y: 0,
          len: Math.random() * 80 + 20,
          speed: Math.random() * 10 + 5,
          opacity: 1
        });
      }

      meteors.forEach((m, i) => {
        m.x += m.speed;
        m.y += m.speed;
        m.opacity -= 0.01;
        if (m.opacity <= 0) meteors.splice(i, 1);

        ctx.strokeStyle = `rgba(255, 255, 255, ${m.opacity})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x - m.len, m.y - m.len);
        ctx.stroke();
      });
    };

    const drawSea = (time) => {
      const seaLevel = h * 0.72;

      const layers = [
        { color: '#0a2342', amp: 10, freq: 0.002, speed: 0.001 },
        { color: '#061830', amp: 15, freq: 0.003, speed: 0.0008 },
        { color: '#020c1a', amp: 12, freq: 0.0015, speed: 0.0005 }
      ];

      layers.forEach((layer, idx) => {
        ctx.fillStyle = layer.color;
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 20) {
          const y = seaLevel + idx * 20 + Math.sin(x * layer.freq + time * layer.speed) * layer.amp;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.fill();
      });

      if (Math.random() > 0.5) {
        particles.push(new Particle(mouseRef.current.x, mouseRef.current.y));
      }
      particles.forEach((p, i) => {
        p.update();
        if (p.life <= 0) particles.splice(i, 1);
        ctx.fillStyle = `rgba(0, 150, 255, ${p.life})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const drawIsland = (time) => {
      const centerX = w * 0.55;
      const centerY = h * 0.72;
      const iW = Math.min(w * 0.65, 400);

      ctx.save();
      ctx.translate(centerX - iW / 2, centerY);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      islandPoints.forEach(p => ctx.lineTo(p.x * iW, -p.y));
      ctx.lineTo(iW, 0);
      ctx.closePath();

      const islandGrad = ctx.createLinearGradient(0, -100, 0, 0);
      islandGrad.addColorStop(0, '#081a33');
      islandGrad.addColorStop(1, '#020812');
      ctx.fillStyle = islandGrad;
      ctx.fill();

      const ltX = iW * 0.75;
      const ltY = -islandPoints[Math.floor(islandPoints.length * 0.75)].y;

      ctx.fillStyle = '#ffaa00';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ffaa00';
      ctx.fillRect(ltX + 2, ltY - 12, 2, 3);
      ctx.shadowBlur = 0;

      const angle = (time * 0.0008) % (Math.PI * 2);
      const beamGrad = ctx.createRadialGradient(ltX + 3, ltY - 18, 0, ltX + 3, ltY - 18, 250);
      beamGrad.addColorStop(0, 'rgba(255, 255, 220, 0.3)');
      beamGrad.addColorStop(1, 'rgba(255, 255, 220, 0)');

      ctx.save();
      ctx.translate(ltX + 3, ltY - 18);
      ctx.rotate(angle);
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 250, -0.15, 0.15);
      ctx.fill();
      ctx.restore();

      ctx.restore();
    };

    const render = (time) => {
      ctx.clearRect(0, 0, w, h);
      drawSky(time);
      drawMeteors(time);
      drawIsland(time);
      drawSea(time);

      stars.forEach(s => {
        s.opacity += (Math.random() - 0.5) * 0.02;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.2, Math.min(1, s.opacity))})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('resize', init);
    window.addEventListener('mousemove', handleMouseMove);
    init();
    render(0);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', init);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 bg-[#010812]" />;
};

export default function HomePage() {
  const navigate = useNavigate();
  const [view, setView] = useState('home');
  const [messages, setMessages] = useState([]);
  const [searchCode, setSearchCode] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isMusicOpen, setIsMusicOpen] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoAuditEnabled, setAutoAuditEnabled] = useState(true);
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  const audioRef = useRef(null);
  const ambientRef = useRef({ waves: null, rain: null, fire: null });

  // 岛屿情绪状态
  const [islandMood, setIslandMood] = useState({
    color: 'rgba(5, 22, 42, 0.8)',
    weather: '微风',
    intensity: 1
  });

  // 白噪音状态
  const [ambientSounds, setAmbientSounds] = useState({ waves: false, rain: false, fire: false });

  // 岛屿之灵状态
  const [isSpiritOpen, setIsSpiritOpen] = useState(false);
  const [spiritChat, setSpiritChat] = useState([]);
  const [spiritInput, setSpiritInput] = useState('');
  const [isSpiritTyping, setIsSpiritTyping] = useState(false);

  // 加载AI审核配置
  useEffect(() => {
    const loadAuditConfig = async () => {
      try {
        const result = await aiModelApi.getAiConfig();
        if (result.code === 200) {
          setAutoAuditEnabled(result.data.autoAudit);
        }
      } catch (error) {
        console.error('获取AI配置失败:', error);
      }
    };
    loadAuditConfig();
  }, []);

  // 加载今日寄语
  useEffect(() => {
    const loadDailyQuote = async () => {
      try {
        const result = await messageApi.getDailyQuote();
        if (result.code === 200 && result.data?.quote) {
          setIslandQuote(result.data.quote);
        }
      } catch (error) {
        console.error('获取今日寄语失败:', error);
      }
    };
    loadDailyQuote();
  }, []);

  const [islandQuote, setIslandQuote] = useState("正在聆听岛屿的风声...");

  const [content, setContent] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [avatarType, setAvatarType] = useState('anonymous');
  const [qqNumber, setQqNumber] = useState('');
  const [selectedAnonAvatar, setSelectedAnonAvatar] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditError, setAuditError] = useState('');

  // 审核错误提示 5 秒后自动消失
  useEffect(() => {
    if (auditError) {
      const timer = setTimeout(() => setAuditError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [auditError]);

  // 歌曲切换时自动播放
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && isPlaying) {
      audio.src = playlist[currentSongIndex]?.url;
      audio.play().catch(() => {});
    }
  }, [currentSongIndex]);

  // 获取昼夜滤镜
  const getDynamicFilter = () => {
    if (currentHour >= 19 || currentHour < 5) return 'brightness(0.5) saturate(0.8) hue-rotate(20deg)'; // 深夜
    if (currentHour >= 5 && currentHour < 9) return 'brightness(0.8) sepia(0.2) hue-rotate(-10deg)'; // 清晨
    if (currentHour >= 16 && currentHour < 19) return 'brightness(0.7) sepia(0.5) hue-rotate(10deg)'; // 黄昏
    return 'none'; // 白天
  };

  // 每分钟更新当前小时，用于昼夜滤镜切换
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000); // 每分钟检查一次
    return () => clearInterval(interval);
  }, []);

  // 切换白噪音
  const toggleAmbient = (type) => {
    setAmbientSounds(prev => {
      const newState = { ...prev, [type]: !prev[type] };
      // 控制音频播放
      const audio = ambientRef.current[type];
      if (audio) {
        if (newState[type]) {
          audio.play().catch(() => {});
        } else {
          audio.pause();
        }
      }
      return newState;
    });
  };

  // 加载留言后分析岛屿情绪
  useEffect(() => {
    if (messages.length > 0) {
      const recentContext = messages.slice(0, 5).map(m => m.content).join(" ");
      analyzeIslandMood(recentContext);
    }
  }, [messages.length > 0]);

  // AI 分析岛屿情绪
  const analyzeIslandMood = async (context) => {
    try {
      const result = await messageApi.analyzeMood(context);
      if (result.code === 200 && result.data) {
        setIslandMood({
          color: result.data.color || 'rgba(5, 22, 42, 0.8)',
          weather: result.data.weather || '微风',
          intensity: result.data.intensity || 1
        });
        if (result.data.quote) {
          setIslandQuote(result.data.quote);
        }
      }
    } catch (error) {
      console.error('分析岛屿情绪失败:', error);
    }
  };

  // 岛屿之灵对话
  const handleSpiritTalk = async () => {
    if (!spiritInput.trim()) return;
    const msg = spiritInput;
    setSpiritChat(prev => [...prev, { role: 'user', text: msg }]);
    setSpiritInput('');
    setIsSpiritTyping(true);

    try {
      const result = await spiritApi.chat(msg);
      setIsSpiritTyping(false);
      if (result.code === 200 && result.data?.reply) {
        setSpiritChat(prev => [...prev, { role: 'spirit', text: result.data.reply }]);
      } else {
        setSpiritChat(prev => [...prev, { role: 'spirit', text: '岛屿之灵正在沉思...' }]);
      }
    } catch (error) {
      setIsSpiritTyping(false);
      setSpiritChat(prev => [...prev, { role: 'spirit', text: '岛屿之灵沉睡中...' }]);
    }
  };

  const loadMessages = async () => {
    try {
      const result = await messageApi.getMessages();
      if (result.code === 200) {
        setMessages(result.data.messages);
      }
    } catch (error) {
      console.error('加载留言失败:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchCode) {
      alert('请输入暗号');
      return;
    }
    try {
      const result = await messageApi.getMessagesBySecret(searchCode);
      if (result.code === 200) {
        setMessages(result.data.messages);
        setHasSearched(true);
      } else {
        alert('未找到匹配的留言');
        setMessages([]);
        setHasSearched(true);
      }
    } catch (error) {
      console.error('查询失败:', error);
      alert('查询失败，请重试');
    }
  };

  const handlePost = async () => {
    if (!content || !secretCode) {
      alert('请填写留言内容和暗号');
      return;
    }
    setIsSubmitting(true);
    setIsAuditing(true);
    setAuditError('');

    try {
      // 敏感词基础过滤
      const sensitiveWords = ['傻逼', '傻b', 'sb', '操', '草', '干你', 'fuck', 'shit', 'asshole', 'bitch', '黄片', '赌博', '诈骗', '裸', '色情', 'AV'];
      const lowerContent = content.toLowerCase();
      for (const word of sensitiveWords) {
        if (lowerContent.includes(word)) {
          setAuditError('内容包含违规信息，请修改后重试');
          setIsAuditing(false);
          setIsSubmitting(false);
          // 记录前端拦截
          aiModelApi.logFrontendBlocked({ content });
          return;
        }
      }

      // AI 审核（只有开启时才调用）
      if (autoAuditEnabled) {
        const auditResult = await aiModelApi.auditMessage({ content });
        if (auditResult.code === 200 && auditResult.data?.isViolated) {
          setAuditError(auditResult.data.reason || '内容包含违规信息，请修改后重试');
          setIsAuditing(false);
          setIsSubmitting(false);
          return;
        }
      }

      const avatarUrl = avatarType === 'qq' && qqNumber
        ? `https://q1.qlogo.cn/g?b=qq&nk=${qqNumber}&s=100`
        : anonAvatars[selectedAnonAvatar];

      await messageApi.createMessage({
        content,
        secretCode,
        avatarType,
        avatarId: avatarType === 'qq' ? qqNumber : selectedAnonAvatar.toString(),
        avatarUrl
      });

      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);

      setContent('');
      setSearchCode(secretCode);
      setSecretCode('');
      setAuditError('');
      setView('browse');
      setHasSearched(false);
    } catch (error) {
      console.error('发送留言失败:', error);
      alert('发送失败，请重试');
    } finally {
      setIsSubmitting(false);
      setIsAuditing(false);
    }
  };

  const Header = ({ subtitle }) => (
    <div className="flex flex-col items-center pt-12 pb-8 animate-in fade-in duration-700">
      <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-4 backdrop-blur-md shadow-inner border border-white/20 animate-pulse">
        <div className="text-5xl">🌙</div>
      </div>
      <h2 className="text-sm md:text-base text-blue-100/80 tracking-widest font-serif text-center px-4 italic">
        {subtitle}
      </h2>
    </div>
  );

  return (
    <div className="min-h-screen text-white font-sans selection:bg-blue-500/30 relative overflow-x-hidden transition-colors duration-500">
      {/* 岛屿动态背景 */}
      <IslandCanvas />

      <div className="relative z-10 container mx-auto px-6 max-w-lg">
        {view === 'home' && (
          <div className="flex flex-col items-center justify-center min-h-[85vh] space-y-12">
            <div className="flex flex-col items-center pt-12 animate-in fade-in duration-700">
              <div className="relative">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md shadow-inner border border-white/20 animate-pulse">
                  <div className="text-5xl">🌙</div>
                </div>
                {/* 天气小图标 */}
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-blue-500/40 rounded-full flex items-center justify-center backdrop-blur-xl border border-white/30">
                  {islandMood.weather === '细雨' ? <CloudRain size={16}/> : islandMood.weather === '星空' ? <Sparkles size={16}/> : islandMood.weather === '晚霞' ? <Flame size={16}/> : islandMood.weather === '海浪' ? <Waves size={16}/> : <Wind size={16}/>}
                </div>
              </div>
              <h2 className="mt-8 text-sm text-blue-100/90 tracking-widest font-serif text-center px-4 italic leading-relaxed">
                {islandQuote}
              </h2>
              <div className="mt-2 text-[9px] opacity-40 uppercase tracking-widest">
                岛屿当前：{islandMood.weather}
              </div>
            </div>
            <div className="w-full space-y-6">
              <button
                onClick={() => setView('send')}
                className="group relative w-full py-4 bg-blue-500/80 backdrop-blur-md rounded-2xl font-medium tracking-widest hover:bg-blue-400 transition-all shadow-lg border border-white/10 overflow-hidden"
              >
                <span className="relative z-10">发送留言</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </button>
              <button
                onClick={() => setView('browse')}
                className="w-full py-4 bg-blue-400/20 backdrop-blur-md rounded-2xl font-medium tracking-widest hover:bg-blue-400/40 transition-all shadow-lg border border-white/10"
              >
                查询留言
              </button>
              <button
                onClick={() => setIsSpiritOpen(true)}
                className="w-full py-4 bg-indigo-500/20 backdrop-blur-md rounded-2xl font-medium tracking-widest hover:bg-indigo-500/40 transition-all shadow-lg border border-white/10 flex items-center justify-center gap-3"
              >
                <Bot className="text-indigo-400" size={18} />
                <span>对话岛屿之灵</span>
              </button>
            </div>
            <div className="fixed bottom-10 opacity-30 text-[10px] tracking-widest font-serif italic">
              BlueIsland v2.0 • 思考与留白
            </div>
          </div>
        )}

        {view === 'send' && (
          <div className="pt-4 pb-24 animate-in slide-in-from-right-8 duration-500">
             <button onClick={() => setView('home')} className="mb-4 text-blue-200/40 flex items-center text-xs hover:text-white transition-all"><Home size={14} className="mr-2"/>返回岛屿</button>
             <Header subtitle="这一刻，你在想什么？" />

             <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-[10px] opacity-60 tracking-widest">MESSAGE CONTENT</label>
                  </div>
                  <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="提笔落墨，心事可寄于此..."
                    className="w-full h-40 bg-black/20 rounded-2xl p-4 text-sm focus:ring-1 focus:ring-blue-400 outline-none border border-white/5 resize-none placeholder:text-gray-600 transition-all"
                  />
                </div>

                {/* AI 审核错误提示 */}
                {auditError && (
                  <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-xl">
                    <div className="flex items-center gap-2 text-blue-300 text-xs">
                      <span className="text-lg">🌙</span>
                      <span>{auditError}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] opacity-60 block mb-2 tracking-widest">SECRET CODE <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={secretCode}
                      onChange={e => setSecretCode(e.target.value)}
                      placeholder="输入暗语(必填)"
                      required
                      className="w-full bg-black/20 rounded-xl p-3 text-xs outline-none border border-white/5 focus:ring-1 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] opacity-60 block mb-2 tracking-widest">IDENTITY</label>
                    <div className="flex bg-black/20 p-1 rounded-xl">
                      <button onClick={() => setAvatarType('anonymous')} className={`flex-1 py-1 text-[10px] rounded-lg transition-all ${avatarType === 'anonymous' ? 'bg-blue-500 shadow-md' : 'opacity-40'}`}>匿名</button>
                      <button onClick={() => setAvatarType('qq')} className={`flex-1 py-1 text-[10px] rounded-lg transition-all ${avatarType === 'qq' ? 'bg-blue-500 shadow-md' : 'opacity-40'}`}>QQ</button>
                    </div>
                  </div>
                </div>

                {avatarType === 'anonymous' ? (
                  <div className="flex justify-between px-2">
                    {anonAvatars.map((url, i) => (
                      <button key={i} onClick={() => setSelectedAnonAvatar(i)} className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all ${selectedAnonAvatar === i ? 'border-blue-400 scale-110 shadow-lg' : 'border-transparent opacity-30 hover:opacity-100'}`}>
                        <img src={url} alt="avatar" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={qqNumber}
                    onChange={e => setQqNumber(e.target.value)}
                    placeholder="输入QQ号获取头像"
                    className="w-full bg-black/20 rounded-xl p-3 text-xs border border-white/5 outline-none focus:ring-1 focus:ring-blue-400"
                  />
                )}

                <button
                  onClick={handlePost}
                  disabled={isSubmitting || !content || !secretCode}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl font-bold tracking-[0.2em] shadow-xl active:scale-95 transition-all disabled:opacity-30"
                >
                  {isAuditing ? 'AI审核中...' : isSubmitting ? '正在封存思绪...' : '投递心事'}
                </button>
             </div>
          </div>
        )}

        {view === 'browse' && (
          <div className="pt-4 pb-24 animate-in fade-in duration-500">
            <Header subtitle="通过暗语查询你的秘密留言" />

            <div className="sticky top-6 z-30 mb-8 px-4">
              <div className="relative group">
                <input
                  type="text"
                  value={searchCode}
                  onChange={e => setSearchCode(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleSearch()}
                  placeholder="寻找那句暗语..."
                  className="w-full pl-6 pr-14 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full outline-none focus:ring-2 focus:ring-blue-400 transition-all shadow-xl placeholder:text-blue-100/20"
                />
                <button
                  onClick={handleSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-400/40 hover:bg-blue-400/60 rounded-full flex items-center justify-center transition-all cursor-pointer"
                >
                  <Search size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-10 pl-6 relative">
              <div className="absolute left-2 top-0 bottom-0 w-px bg-gradient-to-b from-blue-400/50 via-blue-400/10 to-transparent"></div>

              {!hasSearched ? (
                <div className="text-center py-24 opacity-40">
                  <Lock size={48} className="mx-auto mb-4" />
                  <div className="text-sm font-serif italic">输入暗号，解锁你的秘密留言...</div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-24 opacity-20">
                  <Ghost size={48} className="mx-auto mb-4" />
                  <div className="text-xs font-serif italic">未找到匹配的留言...</div>
                </div>
              ) : (
                messages.map((msg, i) => (
                <div key={msg.id} className="relative animate-in slide-in-from-left-4" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="absolute -left-[21px] top-6 w-3 h-3 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)] border-2 border-[#05162a]"></div>

                  <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-lg group hover:bg-white/15 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <img src={msg.avatarUrl} alt="" className="w-10 h-10 rounded-xl border border-white/20 object-cover shadow-sm" />
                      <div>
                        <div className="text-sm font-bold text-blue-100">{msg.avatarType === 'qq' ? `QQ用户(${msg.avatarId})` : '匿名岛民'}</div>
                        <div className="text-[10px] opacity-30">
                          {msg.createTime ? new Date(msg.createTime).toLocaleString() : '刚刚'}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-blue-50/90 whitespace-pre-wrap font-serif italic mb-4">{msg.content}</p>

                    {/* AI 回响模块 */}
                    {msg.aiEcho && (
                      <div className="mt-4 p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 flex gap-2 items-start animate-in fade-in duration-1000">
                        <MessageCircleHeart className="text-indigo-400 shrink-0 mt-0.5" size={12} />
                        <div className="text-[10px] text-indigo-200/80 italic font-serif leading-relaxed">
                          {msg.aiEcho}
                        </div>
                      </div>
                    )}

                    {/* 显示暗号 */}
                    {msg.secretCode && (
                      <div className="mt-3 inline-flex items-center px-2 py-0.5 rounded-full bg-blue-500/20 text-[9px] text-blue-300 border border-blue-400/20">
                        <Lock size={9} className="mr-1"/> 暗号: {searchCode}
                      </div>
                    )}
                  </div>
                </div>
              ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* 成功提示 Toast */}
      {showSuccessToast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none animate-in fade-in duration-300">
          <div className="bg-gradient-to-br from-blue-500/90 to-indigo-600/90 backdrop-blur-xl rounded-3xl px-8 py-6 shadow-2xl border border-white/20 pointer-events-auto animate-in zoom-in-95 duration-500">
            <div className="flex flex-col items-center gap-3">
              <div className="text-4xl animate-bounce">✨</div>
              <div className="text-center">
                <div className="text-lg font-bold text-white mb-1">你的心事已被月光封存</div>
                <div className="text-xs text-blue-100/80 font-serif italic">暗号将是解锁它的唯一钥匙</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-40 px-6 py-8 bg-gradient-to-t from-[#05162a] to-transparent pointer-events-none">
        <div className="max-w-lg mx-auto flex justify-between items-center pointer-events-auto">
          <button onClick={() => setView('home')} className={`p-4 rounded-2xl transition-all ${view === 'home' ? 'bg-blue-500/50 shadow-lg scale-110' : 'opacity-30 hover:opacity-100'}`}>
            <Home size={22}/>
          </button>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 px-8 py-2.5 rounded-full text-[10px] tracking-widest font-serif text-blue-100/40 shadow-inner">
             BLUE ISLAND • {view === 'home' ? 'HOME' : view === 'send' ? 'WRITE' : 'BROWSE'}
          </div>

          <button onClick={() => setView('browse')} className={`p-4 rounded-2xl transition-all ${view === 'browse' ? 'bg-blue-500/50 shadow-lg scale-110' : 'opacity-30 hover:opacity-100'}`}>
            <Search size={22}/>
          </button>
        </div>
      </div>

      {/* 隐藏的音频播放器 */}
      <audio
        ref={audioRef}
        src={playlist[currentSongIndex]?.url}
        onEnded={() => setCurrentSongIndex((currentSongIndex + 1) % playlist.length)}
      />

      {/* 白噪音音频 */}
      <audio ref={el => ambientRef.current.waves = el} src={`${AMBIENT_BASE_URL}/waves.mp3`} loop />
      <audio ref={el => ambientRef.current.rain = el} src={`${AMBIENT_BASE_URL}/rain.mp3`} loop />
      <audio ref={el => ambientRef.current.fire = el} src={`${AMBIENT_BASE_URL}/fire.mp3`} loop />

      {/* 音乐播放面板 */}
      <div className={`fixed bottom-28 right-6 z-50 transition-all duration-500 ${isMusicOpen ? 'w-72 opacity-100 translate-y-0 scale-100' : 'w-0 h-0 opacity-0 pointer-events-none overflow-hidden'}`}>
        <div className="bg-[#1a2b3c]/90 backdrop-blur-3xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden w-72">
          <div className="p-4 flex items-center gap-3 bg-white/5 border-b border-white/5">
             <div className={`w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-lg ${isPlaying ? 'animate-spin-slow' : ''}`}>
                <Music size={18}/>
             </div>
             <div className="overflow-hidden flex-1">
                <div className="text-xs font-bold truncate text-blue-100">{playlist[currentSongIndex]?.title}</div>
                <div className="text-[10px] opacity-40 truncate">{playlist[currentSongIndex]?.artist}</div>
             </div>
          </div>

          <div className="p-4 space-y-4">
            {/* 播放控制 */}
            <div className="flex items-center justify-center gap-6">
              <button onClick={() => setCurrentSongIndex((currentSongIndex - 1 + playlist.length) % playlist.length)} className="opacity-40 hover:opacity-100 transition-opacity"><SkipBack size={18}/></button>
              <button onClick={() => {
                const audio = audioRef.current;
                if (audio) {
                  if (isPlaying) {
                    audio.pause();
                  } else {
                    audio.play();
                  }
                  setIsPlaying(!isPlaying);
                }
              }} className="w-10 h-10 bg-white text-[#05162a] rounded-full flex items-center justify-center transition-transform active:scale-90">
                {isPlaying ? <Pause size={20}/> : <Play size={20} className="ml-1"/>}
              </button>
              <button onClick={() => setCurrentSongIndex((currentSongIndex + 1) % playlist.length)} className="opacity-40 hover:opacity-100 transition-opacity"><SkipForward size={18}/></button>
            </div>

            {/* 白噪音 ASMR 叠播 */}
            <div className="space-y-2 border-t border-white/5 pt-3">
               <div className="text-[9px] opacity-20 uppercase tracking-widest font-bold">ASMR 环境叠播</div>
               <div className="flex justify-between gap-2">
                  <button onClick={() => toggleAmbient('waves')} className={`flex-1 py-2 rounded-xl border border-white/5 flex flex-col items-center gap-1 transition-all ${ambientSounds.waves ? 'bg-blue-600/40 text-blue-300' : 'bg-white/5 opacity-40 hover:opacity-100'}`}>
                    <Waves size={14}/> <span className="text-[8px]">海浪</span>
                  </button>
                  <button onClick={() => toggleAmbient('rain')} className={`flex-1 py-2 rounded-xl border border-white/5 flex flex-col items-center gap-1 transition-all ${ambientSounds.rain ? 'bg-blue-600/40 text-blue-300' : 'bg-white/5 opacity-40 hover:opacity-100'}`}>
                    <CloudRain size={14}/> <span className="text-[8px]">细雨</span>
                  </button>
                  <button onClick={() => toggleAmbient('fire')} className={`flex-1 py-2 rounded-xl border border-white/5 flex flex-col items-center gap-1 transition-all ${ambientSounds.fire ? 'bg-blue-600/40 text-blue-300' : 'bg-white/5 opacity-40 hover:opacity-100'}`}>
                    <Flame size={14}/> <span className="text-[8px]">篝火</span>
                  </button>
               </div>
            </div>

            <div className="space-y-1 max-h-28 overflow-y-auto pr-2 custom-scrollbar">
               {playlist.map((song, i) => (
                 <div key={i} onClick={() => {
                   setCurrentSongIndex(i);
                   setIsPlaying(true);
                   setTimeout(() => audioRef.current?.play(), 100);
                 }} className={`text-[9px] p-2 rounded-xl cursor-pointer transition-colors ${currentSongIndex === i ? 'bg-blue-500/30 text-blue-200' : 'hover:bg-white/5 opacity-40 hover:opacity-100'}`}>
                   <div className="flex justify-between">
                     <span>{song.title}</span>
                     <span>...</span>
                   </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => setIsMusicOpen(!isMusicOpen)}
        className="fixed bottom-28 right-6 w-12 h-12 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-center z-50 hover:bg-blue-500/20 transition-all shadow-xl group"
      >
        <Music size={20} className={`transition-all ${isPlaying || Object.values(ambientSounds).some(v => v) ? 'animate-bounce text-blue-400' : 'opacity-40'}`} />
        {(isPlaying || Object.values(ambientSounds).some(v => v)) && !isMusicOpen && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-ping"></div>
        )}
      </button>

      {/* 岛屿之灵 对话浮层 */}
      <div className={`fixed inset-0 z-[100] transition-all duration-700 ${isSpiritOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-3xl flex flex-col">
          <div className="p-6 flex justify-between items-center border-b border-white/5">
            <div className="flex items-center gap-3">
              <Sparkles className="text-indigo-400 animate-pulse" />
              <span className="text-sm tracking-widest font-bold font-serif">岛屿之灵</span>
            </div>
            <button onClick={() => setIsSpiritOpen(false)} className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-all">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {spiritChat.length === 0 ? (
              <div className="text-center py-12 opacity-40">
                <Bot size={48} className="mx-auto mb-4 text-indigo-400" />
                <div className="text-xs font-serif italic">岛屿之灵正在聆听你的心声...</div>
              </div>
            ) : (
              spiritChat.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-3xl text-xs leading-loose font-serif ${msg.role === 'user' ? 'bg-indigo-600 shadow-xl' : 'bg-white/5 border border-white/10 italic'}`}>
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            {isSpiritTyping && (
              <div className="text-xs opacity-40 animate-pulse font-serif italic">岛屿正在编织回响...</div>
            )}
          </div>

          <div className="p-6 pb-8">
            <div className="flex gap-4">
              <input
                value={spiritInput}
                onChange={e => setSpiritInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSpiritTalk()}
                placeholder="对岛屿说点什么..."
                className="flex-1 bg-white/5 rounded-2xl px-5 py-3 text-xs outline-none border border-white/10 focus:border-indigo-500/50 transition-all"
              />
              <button
                onClick={handleSpiritTalk}
                className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all hover:bg-indigo-500"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@200;400&display=swap');
        .font-serif { font-family: 'Noto Serif SC', serif; }
        .animate-spin-slow { animation: spin 8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
      `}</style>
    </div>
  );
}
