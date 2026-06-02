type SoundType = 'shuffle' | 'deal' | 'bet' | 'call' | 'raise' | 'fold' | 'all_in' | 'win' | 'lose' | 'click';

const SOUNDS: Record<SoundType, string> = {
  shuffle: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  deal: 'https://assets.mixkit.co/active_storage/sfx/1112/1112-preview.mp3',
  bet: 'https://assets.mixkit.co/active_storage/sfx/272/272-preview.mp3',
  call: 'https://assets.mixkit.co/active_storage/sfx/272/272-preview.mp3',
  raise: 'https://assets.mixkit.co/active_storage/sfx/271/271-preview.mp3',
  fold: 'https://assets.mixkit.co/active_storage/sfx/1110/1110-preview.mp3',
  all_in: 'https://assets.mixkit.co/active_storage/sfx/271/271-preview.mp3',
  win: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  lose: 'https://assets.mixkit.co/active_storage/sfx/1110/1110-preview.mp3',
  click: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'
};

class SoundManager {
  private audioElements: Record<SoundType, HTMLAudioElement> = {} as Record<SoundType, HTMLAudioElement>;
  private isMuted = false;
  private initialized = false;

  init() {
    if (this.initialized) return;
    
    Object.keys(SOUNDS).forEach(key => {
      const audio = new Audio(SOUNDS[key as SoundType]);
      audio.volume = 0.3;
      audio.preload = 'auto';
      this.audioElements[key as SoundType] = audio;
    });
    
    this.initialized = true;
  }

  play(type: SoundType) {
    if (!this.initialized) {
      this.init();
    }
    
    if (this.isMuted) return;
    
    const audio = this.audioElements[type];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  getMuted() {
    return this.isMuted;
  }
}

export const soundManager = new SoundManager();
