<template>
  <div class="music-player" :class="{ expanded: isExpanded }">
    <audio
      ref="audioRef"
      :src="currentSong.src"
      @ended="handleSongEnded"
      @timeupdate="updateProgress"
      @loadedmetadata="updateDuration"
    ></audio>

    <!-- 侧边切换按钮 -->
    <div class="player-toggle" @click="toggleExpanded">
      <i class="fas fa-music"></i>
    </div>

    <!-- 播放器内容 -->
    <div class="player-content">
      <div class="player-controls">
        <button class="control-btn" @click="playPrev" title="上一首">
          <i class="fas fa-step-backward"></i>
        </button>
        <button class="control-btn" @click="togglePlay" title="播放/暂停">
          <i :class="isPlaying ? 'fas fa-pause' : 'fas fa-play'"></i>
        </button>
        <button class="control-btn" @click="playNext" title="下一首">
          <i class="fas fa-step-forward"></i>
        </button>

        <div class="song-info">
          <div id="currentSong">{{ currentSong.title }} - {{ currentSong.artist }}</div>
          <div class="progress-container">
            <span id="currentTime">{{ formatTime(currentTime) }}</span>
            <input
              type="range"
              id="progressBar"
              :value="progress"
              @input="seekTo"
              min="0"
              max="100"
            />
            <span id="duration">{{ formatTime(duration) }}</span>
          </div>
        </div>

        <div class="volume-container" title="音量">
          <span id="volumeIcon">
            <i :class="volumeIconClass"></i>
          </span>
          <input
            type="range"
            id="volumeSlider"
            v-model="volume"
            @input="updateVolume"
            min="0"
            max="1"
            step="0.1"
          />
        </div>

        <button class="control-btn" @click="togglePlayMode" :title="playModeTitle">
          <i :class="playModeIcon"></i>
        </button>
        <button class="control-btn" @click="togglePlaylist" title="播放列表">
          <i class="fas fa-list"></i>
        </button>
      </div>

      <div class="playlist-container" :class="{ show: isPlaylistVisible }">
        <h3>播放列表 <span id="playlistCount">{{ currentSongIndex + 1 }}/{{ musicList.length }}</span></h3>
        <ul id="playlist">
          <li
            v-for="(song, index) in musicList"
            :key="index"
            :class="{ playing: index === currentSongIndex }"
            @click="playSong(index)"
          >
            {{ song.title }} - {{ song.artist }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { usePlayerStore } from '../stores/player'
import { storeToRefs } from 'pinia'

const playerStore = usePlayerStore()
const {
  musicList,
  currentSongIndex,
  isPlaying,
  playMode,
  volume,
  currentTime,
  duration,
  isPlaylistVisible,
  isExpanded,
  currentSong
} = storeToRefs(playerStore)

const audioRef = ref(null)

const progress = computed(() => {
  if (!duration.value) return 0
  return (currentTime.value / duration.value) * 100
})

const volumeIconClass = computed(() => {
  if (volume.value === 0) return 'fas fa-volume-mute'
  if (volume.value < 0.5) return 'fas fa-volume-down'
  return 'fas fa-volume-up'
})

const playModeIcon = computed(() => {
  const icons = {
    sequence: 'fas fa-redo',
    loop: 'fas fa-retweet',
    random: 'fas fa-random'
  }
  return icons[playMode.value]
})

const playModeTitle = computed(() => {
  const titles = {
    sequence: '顺序播放',
    loop: '单曲循环',
    random: '随机播放'
  }
  return titles[playMode.value]
})

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const togglePlay = () => {
  if (audioRef.value.paused) {
    audioRef.value.play()
    isPlaying.value = true
  } else {
    audioRef.value.pause()
    isPlaying.value = false
  }
}

const playPrev = () => {
  playerStore.playPrev()
}

const playNext = () => {
  playerStore.playNext()
}

const playSong = (index) => {
  playerStore.playSong(index)
}

const handleSongEnded = () => {
  if (playMode.value === 'loop') {
    audioRef.value.currentTime = 0
    audioRef.value.play()
  } else {
    playerStore.playNext()
  }
}

const updateProgress = () => {
  currentTime.value = audioRef.value.currentTime
}

const updateDuration = () => {
  duration.value = audioRef.value.duration
}

const seekTo = (e) => {
  const seekTime = (e.target.value / 100) * duration.value
  audioRef.value.currentTime = seekTime
}

const updateVolume = () => {
  audioRef.value.volume = volume.value
  localStorage.setItem('musicVolume', volume.value)
}

const togglePlayMode = () => {
  playerStore.togglePlayMode()
}

const togglePlaylist = () => {
  isPlaylistVisible.value = !isPlaylistVisible.value
}

const formatTime = (seconds) => {
  if (isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

// 监听歌曲变化
watch(currentSong, (newSong) => {
  if (audioRef.value) {
    audioRef.value.src = newSong.src
    if (isPlaying.value) {
      audioRef.value.play()
    }
  }
})

// 监听音量变化
watch(volume, (newVolume) => {
  if (audioRef.value) {
    audioRef.value.volume = newVolume
  }
})

onMounted(() => {
  playerStore.initVolume()
  if (audioRef.value) {
    audioRef.value.volume = volume.value
  }
})
</script>

<style scoped>
.music-player {
  position: fixed;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  background: rgb(25, 39, 50);
  color: white;
  z-index: 1000;
  font-family: Arial, sans-serif;
  border-radius: 5px 0 0 5px;
  overflow: hidden;
  transition: all 0.3s ease;
  width: 50px;
  height: 50px;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.3);
  display: flex;
}

.music-player.expanded {
  width: 350px;
  height: auto;
  min-height: 0px;
  max-height: 80vh;
}

.player-toggle {
  position: absolute;
  left: 0;
  top: 0;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s;
}

.player-toggle:hover {
  background: rgba(74, 111, 165, 0.5);
}

.player-content {
  padding: 40px 40px;
  flex-grow: 1;
  display: none;
  flex-direction: column;
  overflow: hidden;
}

.music-player.expanded .player-content {
  display: flex;
}

.player-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.control-btn {
  background: none;
  border: none;
  color: white;
  font-size: 16px;
  cursor: pointer;
  padding: 8px;
  transition: all 0.2s;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #4a6fa5;
}

.song-info {
  flex-grow: 1;
  min-width: 0;
  margin: 0 5px;
}

#currentSong {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 3px;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

#progressBar {
  flex-grow: 1;
  height: 4px;
  cursor: pointer;
  -webkit-appearance: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

#progressBar::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  background: #4a6fa5;
  border-radius: 50%;
  cursor: pointer;
}

#currentTime, #duration {
  font-size: 11px;
  opacity: 0.8;
  min-width: 35px;
}

.volume-container {
  display: flex;
  align-items: center;
  gap: 5px;
  width: 100px;
}

#volumeSlider {
  width: 70px;
  -webkit-appearance: none;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

#volumeSlider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  background: #4a6fa5;
  border-radius: 50%;
  cursor: pointer;
}

.playlist-container {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
  background: rgba(30, 30, 40, 0.9);
  border-radius: 5px;
}

.playlist-container.show {
  max-height: 250px;
  overflow-y: auto;
  padding: 10px;
}

.playlist-container h3 {
  margin: 0 0 10px 0;
  font-size: 14px;
  display: flex;
  justify-content: space-between;
  color: white;
}

#playlist {
  list-style: none;
  padding: 0;
  margin: 0;
}

#playlist li {
  padding: 8px 10px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: background 0.2s;
  color: white;
}

#playlist li:hover {
  background: rgba(74, 111, 165, 0.3);
}

#playlist li.playing {
  color: #4a6fa5;
  font-weight: bold;
}

@media (max-width: 768px) {
  .music-player.expanded {
    width: 280px;
    top: auto;
    bottom: 20px;
    transform: none;
  }

  .player-controls {
    flex-wrap: wrap;
  }

  .song-info {
    order: 1;
    width: 100%;
  }
}
</style>
