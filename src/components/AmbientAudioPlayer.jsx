import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Headphones,
  Volume2,
  VolumeX,
  Play,
  Pause,
  CloudRain,
  Waves,
  Brain,
  Check,
} from 'lucide-react';
import { hapticFeedback } from '../utils/haptics';

function createBrownNoiseBuffer(ctx) {
  const bufferSize = 2 * ctx.sampleRate;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    output[i] = (lastOut + 0.02 * white) / 1.02;
    lastOut = output[i];
    output[i] *= 3.5;
  }
  return noiseBuffer;
}

function createRainBuffer(ctx) {
  const bufferSize = 2 * ctx.sampleRate;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  let b0 = 0,
    b1 = 0,
    b2 = 0,
    b3 = 0,
    b4 = 0,
    b5 = 0,
    b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    output[i] *= 0.11;
    b6 = white * 0.115926;
  }
  return noiseBuffer;
}

export default function AmbientAudioPlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState('brown'); // 'brown' | 'binaural' | 'rain'
  const [volume, setVolume] = useState(0.5);

  const audioContextRef = useRef(null);
  const sourceNodesRef = useRef([]);
  const gainNodeRef = useRef(null);
  const menuRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update volume in gain node
  useEffect(() => {
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
    }
  }, [volume]);

  // Clean stop of all active audio synthesis nodes
  const stopAudio = () => {
    sourceNodesRef.current.forEach((node) => {
      try {
        node.stop();
        node.disconnect();
      } catch (e) {
        // Node might already be stopped
      }
    });
    sourceNodesRef.current = [];
  };

  // Start sound generation according to active track
  const startTrack = (trackId) => {
    stopAudio();

    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioCtx();
    }

    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume, ctx.currentTime);
    masterGain.connect(ctx.destination);
    gainNodeRef.current = masterGain;

    if (trackId === 'brown') {
      // 1. DEEP BROWN NOISE (Brownian noise via integrated white noise + 400Hz low-pass)
      const noiseBuffer = createBrownNoiseBuffer(ctx);

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(masterGain);
      whiteNoise.start();

      sourceNodesRef.current.push(whiteNoise);
    } else if (trackId === 'binaural') {
      // 2. BINAURAL BEATS (40Hz Gamma Focus State: 200Hz Left / 240Hz Right)
      const oscL = ctx.createOscillator();
      const oscR = ctx.createOscillator();
      oscL.type = 'sine';
      oscR.type = 'sine';
      oscL.frequency.setValueAtTime(200, ctx.currentTime);
      oscR.frequency.setValueAtTime(240, ctx.currentTime);

      const merger = ctx.createChannelMerger(2);
      oscL.connect(merger, 0, 0); // Left channel
      oscR.connect(merger, 0, 1); // Right channel

      merger.connect(masterGain);
      oscL.start();
      oscR.start();

      sourceNodesRef.current.push(oscL, oscR);
    } else if (trackId === 'rain') {
      // 3. LOFI RAIN (Multi-stage filtered pink noise with warm rain timbre)
      const noiseBuffer = createRainBuffer(ctx);

      const rainSource = ctx.createBufferSource();
      rainSource.buffer = noiseBuffer;
      rainSource.loop = true;

      const rainFilter = ctx.createBiquadFilter();
      rainFilter.type = 'bandpass';
      rainFilter.frequency.setValueAtTime(900, ctx.currentTime);
      rainFilter.Q.setValueAtTime(0.8, ctx.currentTime);

      rainSource.connect(rainFilter);
      rainFilter.connect(masterGain);
      rainSource.start();

      sourceNodesRef.current.push(rainSource);
    }

    setIsPlaying(true);
  };

  const togglePlay = () => {
    hapticFeedback.tap();
    if (isPlaying) {
      stopAudio();
      setIsPlaying(false);
    } else {
      startTrack(currentTrack);
    }
  };

  const selectTrack = (trackId) => {
    hapticFeedback.medium();
    setCurrentTrack(trackId);
    startTrack(trackId);
  };

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      stopAudio();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const tracks = [
    {
      id: 'brown',
      name: 'Deep Brown Noise',
      desc: 'Rumbling waterfall for deep calm',
      icon: Waves,
    },
    {
      id: 'binaural',
      name: 'Binaural Beats',
      desc: '40Hz Gamma tone for laser focus',
      icon: Brain,
    },
    { id: 'rain', name: 'Lofi Rain', desc: 'Gentle rainfall against window', icon: CloudRain },
  ];

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* Audio Pill Button */}
      <button
        type="button"
        onClick={() => {
          hapticFeedback.tap();
          setIsOpen((prev) => !prev);
        }}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs tracking-wide font-bold transition-all cursor-pointer ${
          isPlaying
            ? 'bg-primary/15 border-primary/30 text-primary shadow-sm'
            : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 text-text-muted hover:text-text-main'
        }`}
        title="Ambient Focus Audio"
      >
        <Headphones className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">
          {isPlaying ? tracks.find((t) => t.id === currentTrack)?.name.split(' ')[0] : 'Ambient'}
        </span>

        {/* Animated Sound Wave Bars when active */}
        {isPlaying && (
          <div className="flex items-center gap-0.5 ml-0.5">
            <span className="w-0.5 h-2.5 bg-primary rounded-full animate-bounce" />
            <span className="w-0.5 h-4 bg-primary rounded-full animate-bounce [animation-delay:0.15s]" />
            <span className="w-0.5 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.3s]" />
          </div>
        )}
      </button>

      {/* Tiny Glass Menu Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            className="absolute right-0 mt-2 w-72 rounded-3xl bg-background-elevated/95 backdrop-blur-2xl border-[0.5px] border-border shadow-sm p-4 z-50 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2">
                <Headphones className="w-4 h-4 text-primary" />
                <span className="text-xs tracking-wide font-black text-text-main dark:text-text-darkMain">
                  Ambient Focus Audio
                </span>
              </div>
              <button
                type="button"
                onClick={togglePlay}
                className="p-1.5 rounded-xl bg-primary text-white hover:bg-[#ff5252] transition-colors cursor-pointer"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-3.5 h-3.5 fill-white" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                )}
              </button>
            </div>

            {/* Track Selector List */}
            <div className="space-y-1.5">
              {tracks.map((track) => {
                const IconComponent = track.icon;
                const isSelected = currentTrack === track.id;

                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => selectTrack(track.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary/10 border border-primary/25 text-primary'
                        : 'bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 text-text-main dark:text-text-darkMain'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          isSelected
                            ? 'bg-primary text-white'
                            : 'bg-black/5 dark:bg-white/5 text-text-muted'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs tracking-wide font-bold block leading-tight">{track.name}</span>
                        <span className="text-[10px] text-text-muted dark:text-text-darkMuted block">
                          {track.desc}
                        </span>
                      </div>
                    </div>

                    {isSelected && isPlaying && (
                      <span className="w-2 h-2 rounded-full bg-primary animate-ping shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Volume Slider Row */}
            <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-text-muted uppercase tracking-wider">
                <span>Volume</span>
                <span>{Math.round(volume * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <VolumeX className="w-3.5 h-3.5 text-text-muted" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full accent-primary cursor-pointer h-1"
                />
                <Volume2 className="w-3.5 h-3.5 text-text-muted" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

