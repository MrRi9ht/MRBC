import { useCallback, useEffect, useRef, useState } from 'react';

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
  lose: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  click: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'
};

export const useSoundEffects = () => {
  const [isMuted, setIsMuted] = useState(false);
  const audioRefs = useRef<Record<SoundType, HTMLAudioElement | null>>({} as Record<SoundType, HTMLAudioElement>);

  useEffect(() => {
    Object.keys(SOUNDS).forEach(key => {
      const audio = new Audio(SOUNDS[key as SoundType]);
      audio.volume = 0.3;
      audioRefs.current[key as SoundType] = audio;
    });

    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.pause();
        }
      });
    };
  }, []);

  const playSound = useCallback((type: SoundType) => {
    if (isMuted) return;
    
    const audio = audioRefs.current[type];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  return { playSound, isMuted, toggleMute };
};
