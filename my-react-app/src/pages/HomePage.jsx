import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Home, Lock, Music, Play, Pause, SkipForward, SkipBack, MessageCircleHeart, Ghost, Waves, CloudRain, Flame, Sparkles, Wind, Bot, Send, X, Repeat, Repeat1, Shuffle } from 'lucide-react';
import { messageApi, aiModelApi, spiritApi, musicApi, accessApi } from '../api';

const AMBIENT_BASE_URL = '/assets/ambient';

// 格式化时间显示
const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const defaultPlaylist = [];

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [musicSearch, setMusicSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [playlist, setPlaylist] = useState(() => {
    // 从localStorage恢复播放列表
    try {
      const saved = localStorage.getItem('music_playlist');
      return saved ? JSON.parse(saved) : defaultPlaylist;
    } catch { return defaultPlaylist; }
  });
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentLyric, setCurrentLyric] = useState([]);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
  const [currentSongIndex, setCurrentSongIndex] = useState(() => {
    try { return parseInt(localStorage.getItem('music_current_index') || '0'); } catch { return 0; }
  });
  const [playbackMode, setPlaybackMode] = useState(() => {
    try { return localStorage.getItem('music_playback_mode') || 'loop'; } catch { return 'loop'; }
  });
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

  // 音乐配置（白噪音URL等）
  const [musicConfig, setMusicConfig] = useState({
    ambientWavesUrl: '',
    ambientRainUrl: '',
    ambientFireUrl: '',
    enabled: true,
    ambientEnabled: true,
    ambientVolume: 50
  });

  // 在线人数状态
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [homePageUsers, setHomePageUsers] = useState(0);

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

  // 加载音乐配置
  useEffect(() => {
    const loadMusicConfig = async () => {
      try {
        const result = await musicApi.getMusicConfig();
        if (result.code === 200) {
          setMusicConfig({
            ambientWavesUrl: result.data.ambientWavesUrl || '',
            ambientRainUrl: result.data.ambientRainUrl || '',
            ambientFireUrl: result.data.ambientFireUrl || '',
            enabled: result.data.enabled ?? true,
            ambientEnabled: result.data.ambientEnabled ?? true,
            ambientVolume: result.data.ambientVolume ?? 50
          });
        }
      } catch (error) {
        console.error('获取音乐配置失败:', error);
      }
    };
    loadMusicConfig();
  }, []);

  // 心跳 - 保持在线状态并获取在线人数
  useEffect(() => {
    // 获取或生成会话ID
    const getSessionId = () => {
      let sessionId = localStorage.getItem('visitorSessionId');
      if (!sessionId) {
        sessionId = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem('visitorSessionId', sessionId);
      }
      return sessionId;
    };

    const sendHeartbeat = async () => {
      try {
        const sessionId = getSessionId();
        await accessApi.heartbeat('home', sessionId);
        const result = await accessApi.getStats();
        if (result.code === 200) {
          setOnlineUsers(result.data.onlineUsers || 0);
          const pageUsers = result.data.pageOnlineUsers || {};
          setHomePageUsers(pageUsers['home'] || 0);
        }
      } catch (error) {
        console.error('心跳失败:', error);
      }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 60000); // 每分钟发送一次
    return () => clearInterval(interval);
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
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditError, setAuditError] = useState('');

  // 审核错误提示 5 秒后自动消失
  useEffect(() => {
    if (auditError) {
      const timer = setTimeout(() => setAuditError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [auditError]);

  // 保存播放列表到localStorage
  useEffect(() => {
    try {
      localStorage.setItem('music_playlist', JSON.stringify(playlist));
    } catch {}
  }, [playlist]);

  // 保存当前播放索引到localStorage
  useEffect(() => {
    try {
      localStorage.setItem('music_current_index', currentSongIndex.toString());
    } catch {}
  }, [currentSongIndex]);

  // 保存播放模式到localStorage
  useEffect(() => {
    try {
      localStorage.setItem('music_playback_mode', playbackMode);
    } catch {}
  }, [playbackMode]);

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

  // 监听滚动显示回到顶部按钮
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 带重试的API请求
  const fetchWithRetry = async (fn, maxRetries = 3, delay = 500) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const res = await fn();
        if (res && (Array.isArray(res) ? res.length > 0 : Object.keys(res).length > 0)) {
          return res;
        }
      } catch (err) {
        if (i === maxRetries - 1) throw err;
      }
      if (i < maxRetries - 1) await new Promise(r => setTimeout(r, delay * (i + 1)));
    }
    return null;
  };

  // 搜索音乐
  const handleMusicSearch = async () => {
    if (!musicSearch.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    try {
      const res = await fetchWithRetry(() => musicApi.search(musicSearch));
      let results = [];
      if (res) {
        if (Array.isArray(res)) {
          results = res;
        } else if (res.info && Array.isArray(res.info)) {
          results = res.info;
        }
      }
      if (results.length > 0) {
        setSearchResults(results.slice(0, 8));
      }
      // 记录搜索日志
      try {
        await musicApi.logMusicAction({
          action: 'search',
          songName: musicSearch,
          status: results.length > 0 ? 'success' : 'failed'
        });
      } catch (logErr) {
        console.error('记录搜索日志失败:', logErr);
      }
    } catch (err) {
      console.error('搜索失败:', err);
      try {
        await musicApi.logMusicAction({
          action: 'search',
          songName: musicSearch,
          status: 'failed',
          errorMessage: err.message
        });
      } catch (logErr) {
        console.error('记录搜索日志失败:', logErr);
      }
    } finally {
      setIsSearching(false);
    }
  };

  // 播放搜索到的歌曲
  const playSearchedSong = async (song) => {
    try {
      const res = await fetchWithRetry(() => musicApi.getUrl(song.id, song.source || 'netease', 320));
      let url = '';
      if (res) {
        if (res.url) {
          url = res.url;
        } else if (res.data && res.data.url) {
          url = res.data.url;
        }
      }
      const newSong = { title: song.name || song.title, artist: song.artist, url };
      setPlaylist(prev => [...prev, newSong]);
      const newIndex = playlist.length;
      setCurrentSongIndex(newIndex);
      setIsPlaying(true);
      setSearchResults([]);
      setMusicSearch('');
      setCurrentLyric([]);
      setCurrentLyricIndex(-1);
      setCurrentTime(0);
      setDuration(0);
      // 获取歌词
      try {
        const lyricRes = await musicApi.getLyric(song.id, song.source || 'netease');
        let lyricText = lyricRes.lyric || lyricRes.tlyric || '';
        if (lyricText) {
          // 解析LRC格式歌词
          const lines = lyricText.split('\n');
          const parsedLyrics = [];
          for (const line of lines) {
            const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
            if (match) {
              const mins = parseInt(match[1]);
              const secs = parseInt(match[2]);
              const ms = parseInt(match[3].padEnd(3, '0'));
              const time = mins * 60 + secs + ms / 1000;
              const text = match[4].trim();
              if (text) parsedLyrics.push({ time, text });
            }
          }
          setCurrentLyric(parsedLyrics);
        }
      } catch (lyricErr) {
        console.error('获取歌词失败:', lyricErr);
      }
      setTimeout(() => audioRef.current?.play(), 100);
      // 记录播放日志
      try {
        await musicApi.logMusicAction({
          action: 'play',
          songName: song.name || song.title,
          songId: song.id?.toString(),
          source: song.source || 'netease',
          status: url ? 'success' : 'failed'
        });
      } catch (logErr) {
        console.error('记录播放日志失败:', logErr);
      }
    } catch (err) {
      console.error('获取歌曲URL失败:', err);
      try {
        await musicApi.logMusicAction({
          action: 'play',
          songName: song.name || song.title,
          songId: song.id?.toString(),
          source: song.source || 'netease',
          status: 'failed',
          errorMessage: err.message
        });
      } catch (logErr) {
        console.error('记录播放日志失败:', logErr);
      }
    }
  };

  // 从播放列表删除歌曲
  const removeFromPlaylist = (index) => {
    setPlaylist(prev => prev.filter((_, i) => i !== index));
    if (index === currentSongIndex) {
      // 删除的是当前播放的，切到下一首或停止
      if (playlist.length > 1) {
        const nextIndex = index >= playlist.length - 1 ? 0 : index;
        setCurrentSongIndex(nextIndex);
      } else {
        setIsPlaying(false);
        setCurrentSongIndex(0);
      }
    } else if (index < currentSongIndex) {
      // 删除的是当前歌曲之前的，调整索引
      setCurrentSongIndex(currentSongIndex - 1);
    }
  };

  // 切换白噪音
  const toggleAmbient = (type) => {
    setAmbientSounds(prev => {
      const newState = { ...prev, [type]: !prev[type] };
      // 控制音频播放
      const audio = ambientRef.current[type];
      // 获取对应的URL
      const url = type === 'waves' ? musicConfig.ambientWavesUrl :
                   type === 'rain' ? musicConfig.ambientRainUrl :
                   musicConfig.ambientFireUrl;
      if (audio) {
        if (newState[type]) {
          if (url) {
            // 如果当前src不是目标url，需要重新加载
            if (audio.src !== url && url) {
              audio.src = url;
              audio.load();
            }
            audio.volume = (musicConfig.ambientVolume ?? 50) / 100;
            audio.play().catch(err => console.error('播放失败:', err));
          }
        } else {
          audio.pause();
        }
      }
      return newState;
    });
  };

  // 更新白噪音音量（当音量设置变化时）
  useEffect(() => {
    const volume = (musicConfig.ambientVolume ?? 50) / 100;
    ['waves', 'rain', 'fire'].forEach(type => {
      const audio = ambientRef.current[type];
      if (audio && ambientSounds[type]) {
        audio.volume = volume;
      }
    });
  }, [musicConfig.ambientVolume, ambientSounds]);

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
              <div className="mt-2 text-[9px] opacity-40 uppercase tracking-widest flex justify-center gap-4">
                <span>岛屿当前：{islandMood.weather}</span>
                <span>在线：{onlineUsers}</span>
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
                  className="w-full pl-6 pr-32 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full outline-none focus:ring-2 focus:ring-blue-400 transition-all shadow-xl placeholder:text-blue-100/20"
                />
                <div className="absolute right-20 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] opacity-40">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  {homePageUsers}
                </div>
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
        onEnded={() => {
          if (playbackMode === 'loop') {
            // 循环：当前歌曲重新播放
            audioRef.current.currentTime = 0;
            audioRef.current.play();
          } else if (playbackMode === 'sequential') {
            // 顺序：播完就停止
            if (currentSongIndex < playlist.length - 1) {
              setCurrentSongIndex(currentSongIndex + 1);
            } else {
              setIsPlaying(false);
            }
          } else if (playbackMode === 'random') {
            // 随机：随机选一首播放
            const randomIndex = Math.floor(Math.random() * playlist.length);
            setCurrentSongIndex(randomIndex);
          }
          setCurrentLyric('');
        }}
        onTimeUpdate={() => {
          if (audioRef.current) {
            const time = audioRef.current.currentTime;
            setCurrentTime(time);
            setDuration(audioRef.current.duration || 0);
            // 更新歌词索引
            const lyrics = currentLyric;
            let idx = -1;
            for (let i = 0; i < lyrics.length; i++) {
              if (lyrics[i].time <= time) {
                idx = i;
              } else {
                break;
              }
            }
            setCurrentLyricIndex(idx);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration);
          }
        }}
      />

      {/* 白噪音音频 - 使用配置的URL或本地文件 */}
      <audio ref={el => ambientRef.current.waves = el} src={musicConfig.ambientWavesUrl} loop />
      <audio ref={el => ambientRef.current.rain = el} src={musicConfig.ambientRainUrl} loop />
      <audio ref={el => ambientRef.current.fire = el} src={musicConfig.ambientFireUrl} loop />

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
            <div className="flex items-center justify-center gap-4">
              {/* 播放模式切换 */}
              <button onClick={() => {
                const modes = ['loop', 'sequential', 'random'];
                const currentIdx = modes.indexOf(playbackMode);
                setPlaybackMode(modes[(currentIdx + 1) % modes.length]);
              }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all">
                {playbackMode === 'loop' ? <Repeat size={18} className={playbackMode === 'loop' ? 'text-blue-400' : ''}/> : playbackMode === 'sequential' ? <Repeat1 size={18} className="text-blue-400" /> : <Shuffle size={18} className="text-blue-400" />}
              </button>
              <button onClick={() => {
                let prevIndex;
                if (playbackMode === 'random') {
                  prevIndex = Math.floor(Math.random() * playlist.length);
                } else {
                  prevIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
                }
                setCurrentSongIndex(prevIndex);
                setIsPlaying(true);
                setTimeout(() => audioRef.current?.play(), 100);
              }} className="w-8 h-8 flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity"><SkipBack size={18}/></button>
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
              <button onClick={() => {
                let nextIndex;
                if (playbackMode === 'random') {
                  nextIndex = Math.floor(Math.random() * playlist.length);
                } else {
                  nextIndex = (currentSongIndex + 1) % playlist.length;
                }
                setCurrentSongIndex(nextIndex);
                setIsPlaying(true);
                setTimeout(() => audioRef.current?.play(), 100);
              }} className="w-8 h-8 flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity"><SkipForward size={18}/></button>
            </div>

            {/* 进度条 */}
            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={(e) => {
                  const time = Number(e.target.value);
                  setCurrentTime(time);
                  if (audioRef.current) {
                    audioRef.current.currentTime = time;
                  }
                }}
                className="w-full h-1 rounded-full appearance-none cursor-pointer bg-white/10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg"
                style={{
                  background: duration ? `linear-gradient(to right, #60a5fa ${(currentTime / duration) * 100}%, rgba(255,255,255,0.1) ${(currentTime / duration) * 100}%)` : 'rgba(255,255,255,0.1)',
                }}
              />
              <div className="flex justify-between text-[9px] opacity-40">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* 歌词显示 */}
            <div className="min-h-[40px] text-center flex flex-col items-center justify-center gap-1">
              {currentLyric.length > 0 && currentLyricIndex >= 0 ? (
                <>
                  {currentLyricIndex > 0 && (
                    <div className="text-[10px] text-blue-200/30 font-serif italic truncate max-w-[280px]">
                      {currentLyric[currentLyricIndex - 1]?.text}
                    </div>
                  )}
                  <div className="text-xs text-blue-200 font-serif italic leading-relaxed animate-pulse">
                    {currentLyric[currentLyricIndex]?.text}
                  </div>
                  {currentLyricIndex < currentLyric.length - 1 && (
                    <div className="text-[10px] text-blue-200/30 font-serif italic truncate max-w-[280px]">
                      {currentLyric[currentLyricIndex + 1]?.text}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-[10px] opacity-30 italic">
                  {playlist[currentSongIndex]?.url ? '该歌曲暂无歌词' : '选择一个曲目播放'}
                </div>
              )}
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

            {/* 音乐搜索 */}
            <div className="p-3 border-t border-white/5">
               <div className="flex gap-2">
                 <input
                   type="text"
                   value={musicSearch}
                   onChange={(e) => setMusicSearch(e.target.value)}
                   onKeyDown={(e) => {
                     if (e.key === 'Enter' && musicSearch.trim()) {
                       handleMusicSearch();
                     }
                   }}
                   placeholder="搜索音乐..."
                   className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500/50"
                 />
                 <button
                   onClick={() => musicSearch.trim() && handleMusicSearch()}
                   className="px-3 py-2 bg-blue-500/30 hover:bg-blue-500/50 rounded-xl text-xs transition-colors"
                 >
                   搜索
                 </button>
               </div>
            </div>

            <div className="space-y-1 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
               {isSearching ? (
                 <div className="text-[10px] opacity-40 text-center py-4 italic">正在搜索...</div>
               ) : searchResults.length > 0 ? (
                 searchResults.map((song, i) => (
                   <div key={i} onClick={() => playSearchedSong(song)} className={`text-[9px] px-1 py-1.5 rounded-lg cursor-pointer transition-colors ${currentSongIndex === i && searchResults.length > 0 ? 'bg-blue-500/30 text-blue-200' : 'hover:bg-white/5 opacity-40 hover:opacity-100'}`}>
                     <div className="flex justify-between items-center gap-1">
                       <span className="truncate">{song.name || song.title}</span>
                       <span className="opacity-40 truncate text-[8px]">{song.artist || song.author || ''}</span>
                     </div>
                   </div>
                 ))
               ) : musicSearch.trim() && !isSearching ? (
                 <div className="text-[10px] opacity-40 text-center py-4 italic">未收录该歌曲，请尝试其他曲目</div>
               ) : (
                 playlist.length === 0 ? (
                   <div className="text-[10px] opacity-30 text-center py-4 italic">播放列表为空，搜索添加歌曲</div>
                 ) : (
                   playlist.map((song, i) => (
                     <div key={i} className={`group flex items-center gap-1 px-1 py-1.5 rounded-lg cursor-pointer transition-colors ${currentSongIndex === i ? 'bg-blue-500/30 text-blue-200' : 'hover:bg-white/5 opacity-40 hover:opacity-100'}`}>
                       <span onClick={() => {
                         setCurrentSongIndex(i);
                         setIsPlaying(true);
                         setTimeout(() => audioRef.current?.play(), 100);
                       }} className="flex-1 truncate text-[9px] leading-tight">{song.name || song.title}</span>
                       <span className="opacity-40 truncate text-[8px]">{song.artist || song.author || ''}</span>
                       <button onClick={(e) => {
                         e.stopPropagation();
                         removeFromPlaylist(i);
                       }} className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity ml-1 text-[8px] leading-tight">✕</button>
                     </div>
                   ))
                 )
               )}
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

      {/* 回到顶部按钮 */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-28 left-6 w-12 h-12 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-center z-50 transition-all duration-300 shadow-xl ${showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
      >
        <div className="text-blue-300">↑</div>
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
