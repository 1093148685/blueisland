document.addEventListener('DOMContentLoaded', function() {
    // 音乐播放器元素
    const audio = document.getElementById('bgMusic');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const progressBar = document.getElementById('progressBar');
    const currentTimeDisplay = document.getElementById('currentTime');
    const durationDisplay = document.getElementById('duration');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeIcon = document.getElementById('volumeIcon');
    const playModeBtn = document.getElementById('playModeBtn');
    const playlistToggle = document.getElementById('playlistToggle');
    const playlistContainer = document.querySelector('.playlist-container');
    const playlist = document.getElementById('playlist');
    const currentSongDisplay = document.getElementById('currentSong');
    const playlistCount = document.getElementById('playlistCount');
    const playerToggle = document.getElementById('playerToggle');

    // 播放列表数据
    const musicList = [
        { title: "青花瓷", artist: "周杰伦", src: "/web/assets/music/青花瓷-周杰伦.mp3" },
        { title: "晴天", artist: "周杰伦", src: "/web/assets/music/晴天-周杰伦.mp3" },
        { title: "兰亭序", artist: "周杰伦", src: "/web/assets/music/兰亭序-周杰伦.mp3" },
        { title: "消愁", artist: "薛之谦&毛不易", src: "/web/assets/music/消愁-薛之谦&毛不易.mp3" },
        { title: "晴天玫瑰花的葬礼", artist: "许嵩", src: "/web/assets/music/玫瑰花的葬礼-许嵩.mp3" },
        { title: "有何不可", artist: "许嵩", src: "/web/assets/music/有何不可-许嵩.mp3" }
    ];

    // 播放状态
    let playMode = 'sequence'; // 'sequence' | 'loop' | 'random'
    let currentSongIndex = 0;
    let isPlaying = false;
    let isPlaylistVisible = false;

    // 初始化播放器
    function initPlayer() {
        renderPlaylist();
        updatePlaylistCount();
        loadSong(currentSongIndex);
        
        // 从本地存储加载设置
        const savedVolume = localStorage.getItem('musicVolume');
        const savedPlayMode = localStorage.getItem('playMode');
        
        if (savedVolume) {
            audio.volume = parseFloat(savedVolume);
            volumeSlider.value = audio.volume;
            updateVolumeIcon();
        }
        
        if (savedPlayMode) {
            playMode = savedPlayMode;
            updatePlayModeButton();
        }

        // 添加事件监听器
        setupEventListeners();
    }

    // 设置事件监听器
    function setupEventListeners() {
        // 播放器切换按钮
        playerToggle.addEventListener('click', togglePlayer);
        
        // 播放/暂停按钮
        playPauseBtn.addEventListener('click', togglePlay);
        
        // 上一首/下一首按钮
        prevBtn.addEventListener('click', playPrevSong);
        nextBtn.addEventListener('click', playNextSong);
        
        // 进度条控制
        progressBar.addEventListener('input', updateSeekTime);
        
        // 音量控制
        volumeSlider.addEventListener('input', updateVolume);
        
        // 播放模式切换
        playModeBtn.addEventListener('click', togglePlayMode);
        
        // 播放列表显示/隐藏
        playlistToggle.addEventListener('click', togglePlaylist);
        
        // 歌曲结束事件
        audio.addEventListener('ended', handleSongEnded);
        
        // 时间更新事件
        audio.addEventListener('timeupdate', updateProgress);
        
        // 元数据加载事件
        audio.addEventListener('loadedmetadata', updateDuration);
    }

    // 渲染播放列表
    function renderPlaylist() {
        playlist.innerHTML = '';
        musicList.forEach((song, index) => {
            const li = document.createElement('li');
            li.textContent = `${song.title} - ${song.artist}`;
            li.addEventListener('click', () => playSelectedSong(index));
            playlist.appendChild(li);
        });
    }

    // 播放选中的歌曲
    function playSelectedSong(index) {
        currentSongIndex = index;
        loadSong(index);
        playAudio();
        updatePlaylistCount();
    }

    // 加载歌曲
    function loadSong(index) {
        const song = musicList[index];
        audio.src = song.src;
        currentSongDisplay.textContent = `${song.title} - ${song.artist}`;
        highlightCurrentSong();
    }

    // 播放音频
    function playAudio() {
        audio.play()
            .then(() => {
                isPlaying = true;
                updatePlayButton();
            })
            .catch(e => console.error("播放失败:", e));
    }

    // 高亮当前播放的歌曲
    function highlightCurrentSong() {
        const items = playlist.querySelectorAll('li');
        items.forEach((item, index) => {
            item.classList.toggle('playing', index === currentSongIndex);
        });
    }

    // 切换播放/暂停
    function togglePlay() {
        if (audio.paused) {
            playAudio();
        } else {
            audio.pause();
            isPlaying = false;
            updatePlayButton();
        }
    }

    // 更新播放按钮状态
    function updatePlayButton() {
        const icon = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
        playPauseBtn.innerHTML = icon;
    }

    // 播放上一首
    function playPrevSong() {
        currentSongIndex = (currentSongIndex - 1 + musicList.length) % musicList.length;
        loadAndPlayCurrentSong();
    }

    // 播放下一首
    function playNextSong() {
        if (playMode === 'random') {
            currentSongIndex = getRandomSongIndex();
        } else {
            currentSongIndex = (currentSongIndex + 1) % musicList.length;
        }
        loadAndPlayCurrentSong();
    }

    // 加载并播放当前歌曲
    function loadAndPlayCurrentSong() {
        loadSong(currentSongIndex);
        if (isPlaying) {
            playAudio();
        }
        updatePlaylistCount();
    }

    // 获取随机歌曲索引
    function getRandomSongIndex() {
        if (musicList.length <= 1) return 0;
        
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * musicList.length);
        } while (newIndex === currentSongIndex);
        return newIndex;
    }

    // 处理歌曲结束
    function handleSongEnded() {
        if (playMode === 'loop') {
            audio.currentTime = 0;
            audio.play();
        } else {
            playNextSong();
        }
    }

    // 更新进度条
    function updateProgress() {
        const progress = (audio.currentTime / audio.duration) * 100;
        progressBar.value = isNaN(progress) ? 0 : progress;
        currentTimeDisplay.textContent = formatTime(audio.currentTime);
    }

    // 更新时长显示
    function updateDuration() {
        durationDisplay.textContent = formatTime(audio.duration);
    }

    // 更新搜索时间
    function updateSeekTime() {
        const seekTime = (progressBar.value / 100) * audio.duration;
        audio.currentTime = seekTime;
    }

    // 格式化时间
    function formatTime(seconds) {
        if (isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    // 更新音量
    function updateVolume() {
        audio.volume = volumeSlider.value;
        localStorage.setItem('musicVolume', volumeSlider.value);
        updateVolumeIcon();
    }

    // 更新音量图标
    function updateVolumeIcon() {
        let icon;
        if (audio.volume === 0) {
            icon = '<i class="fas fa-volume-mute"></i>';
        } else if (audio.volume < 0.5) {
            icon = '<i class="fas fa-volume-down"></i>';
        } else {
            icon = '<i class="fas fa-volume-up"></i>';
        }
        volumeIcon.innerHTML = icon;
    }

    // 切换播放模式
    function togglePlayMode() {
        const modes = ['sequence', 'loop', 'random'];
        const currentIndex = modes.indexOf(playMode);
        playMode = modes[(currentIndex + 1) % modes.length];
        
        localStorage.setItem('playMode', playMode);
        updatePlayModeButton();
    }

    // 更新播放模式按钮
    function updatePlayModeButton() {
        const icons = {
            'sequence': '<i class="fas fa-redo"></i>',
            'loop': '<i class="fas fa-retweet"></i>',
            'random': '<i class="fas fa-random"></i>'
        };
        
        const titles = {
            'sequence': '顺序播放',
            'loop': '单曲循环',
            'random': '随机播放'
        };
        
        playModeBtn.innerHTML = icons[playMode];
        playModeBtn.title = titles[playMode];
    }

    // 切换播放列表显示
    function togglePlaylist() {
        isPlaylistVisible = !isPlaylistVisible;
        playlistContainer.classList.toggle('show');
    }

    // 切换播放器显示
    function togglePlayer() {
        const player = document.querySelector('.music-player');
        player.classList.toggle('expanded');
    }

    // 更新播放列表计数
    function updatePlaylistCount() {
        playlistCount.textContent = `${currentSongIndex + 1}/${musicList.length}`;
    }

    // 初始化播放器
    initPlayer();
});