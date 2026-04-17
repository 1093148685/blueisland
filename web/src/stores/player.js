import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePlayerStore = defineStore('player', () => {
  // 播放列表
  const musicList = ref([
    { title: '青花瓷', artist: '周杰伦', src: '/assets/music/青花瓷-周杰伦.mp3' },
    { title: '晴天', artist: '周杰伦', src: '/assets/music/晴天-周杰伦.mp3' },
    { title: '兰亭序', artist: '周杰伦', src: '/assets/music/兰亭序-周杰伦.mp3' },
    { title: '消愁', artist: '薛之谦&毛不易', src: '/assets/music/消愁-薛之谦&毛不易.mp3' },
    { title: '玫瑰花的葬礼', artist: '许嵩', src: '/assets/music/玫瑰花的葬礼-许嵩.mp3' },
    { title: '有何不可', artist: '许嵩', src: '/assets/music/有何不可-许嵩.mp3' }
  ])

  // 播放状态
  const currentSongIndex = ref(0)
  const isPlaying = ref(false)
  const playMode = ref('sequence') // 'sequence' | 'loop' | 'random'
  const volume = ref(0.7)
  const currentTime = ref(0)
  const duration = ref(0)
  const isPlaylistVisible = ref(false)
  const isExpanded = ref(false)

  // 当前歌曲
  const currentSong = computed(() => musicList.value[currentSongIndex.value])

  // 播放模式切换
  const togglePlayMode = () => {
    const modes = ['sequence', 'loop', 'random']
    const currentIndex = modes.indexOf(playMode.value)
    playMode.value = modes[(currentIndex + 1) % modes.length]
    localStorage.setItem('playMode', playMode.value)
  }

  // 播放上一首
  const playPrev = () => {
    currentSongIndex.value = (currentSongIndex.value - 1 + musicList.value.length) % musicList.value.length
  }

  // 播放下一首
  const playNext = () => {
    if (playMode.value === 'random') {
      currentSongIndex.value = getRandomIndex()
    } else {
      currentSongIndex.value = (currentSongIndex.value + 1) % musicList.value.length
    }
  }

  // 获取随机索引
  const getRandomIndex = () => {
    if (musicList.value.length <= 1) return 0
    let newIndex
    do {
      newIndex = Math.floor(Math.random() * musicList.value.length)
    } while (newIndex === currentSongIndex.value)
    return newIndex
  }

  // 播放指定歌曲
  const playSong = (index) => {
    currentSongIndex.value = index
    isPlaying.value = true
  }

  // 初始化音量
  const initVolume = () => {
    const savedVolume = localStorage.getItem('musicVolume')
    if (savedVolume) {
      volume.value = parseFloat(savedVolume)
    }
    const savedPlayMode = localStorage.getItem('playMode')
    if (savedPlayMode) {
      playMode.value = savedPlayMode
    }
  }

  return {
    musicList,
    currentSongIndex,
    isPlaying,
    playMode,
    volume,
    currentTime,
    duration,
    isPlaylistVisible,
    isExpanded,
    currentSong,
    togglePlayMode,
    playPrev,
    playNext,
    playSong,
    initVolume
  }
})
