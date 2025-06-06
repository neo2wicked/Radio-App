"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { WebsocketProvider, useWebsocket } from "./websocket-provider";

interface RadioClientProps {
  experienceId: string;
}

function RadioAppContent({ experienceId }: RadioClientProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPressed, setIsPressed] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [hasNotifiedJoin, setHasNotifiedJoin] = useState(false);
  const [listenerCount, setListenerCount] = useState(1);
  const [isInIframe, setIsInIframe] = useState(false);
  const [audioContext, setAudioContext] = useState<string>('unknown');
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const { isConnected, sendMessage, connectionStatus } = useWebsocket();

  // detect iframe and audio context
  useEffect(() => {
    // multiple methods to detect embedded context
    const traditionalIframe = window.self !== window.top;
    
    // mobile app webview detection
    const isMobileApp = (
      // check for mobile app user agents
      /WhopApp|WhopMobile/i.test(navigator.userAgent) ||
      // check for react native webview
      /ReactNative/i.test(navigator.userAgent) ||
      // check for common mobile webview indicators
      'standalone' in navigator && (navigator as { standalone?: boolean }).standalone === false ||
      // check if certain web APIs are restricted (common in webviews)
      !window.open ||
      // check for mobile webview specific properties
      'ontouchstart' in window && window.innerWidth < 1024
    );
    
    // whop-specific detection
    const isWhopContext = (
      window.location.hostname.includes('whop.com') ||
      document.referrer.includes('whop.com') ||
      window.location.search.includes('whop') ||
      // check for whop-specific globals that might be injected
      'whop' in window
    );
    
    const inEmbeddedContext = traditionalIframe || isMobileApp || isWhopContext;
    setIsInIframe(inEmbeddedContext);
    
    console.log('🎵 enhanced environment check:', { 
      traditionalIframe,
      isMobileApp,
      isWhopContext,
      finalResult: inEmbeddedContext,
      userAgent: navigator.userAgent,
      hostname: window.location.hostname,
      referrer: document.referrer,
      standalone: 'standalone' in navigator ? (navigator as { standalone?: boolean }).standalone : undefined
    });
    
    // check audio context capabilities
    const checkAudioContext = () => {
      if (!audioRef.current) return 'no-audio-element';
      
      try {
        // test if we can control volume
        const originalVolume = audioRef.current.volume;
        const testVolume = 0.5;
        
        console.log('🔬 testing volume control:', { originalVolume });
        
        // try to change volume
        audioRef.current.volume = testVolume;
        const afterChange = audioRef.current.volume;
        
        // restore original volume
        audioRef.current.volume = originalVolume;
        const afterRestore = audioRef.current.volume;
        
        console.log('🔬 volume test results:', {
          original: originalVolume,
          testValue: testVolume,
          afterChange: afterChange,
          afterRestore: afterRestore,
          changeWorked: afterChange === testVolume,
          restoreWorked: afterRestore === originalVolume,
          volumePropertyWritable: Object.getOwnPropertyDescriptor(audioRef.current, 'volume')?.writable !== false
        });
        
        if (afterChange !== testVolume) {
          return 'volume-readonly';
        }
        
        return inEmbeddedContext ? 'embedded-context-ok' : 'browser-context-ok';
      } catch (error) {
        return `volume-control-blocked: ${error}`;
      }
    };
    
    setAudioContext(checkAudioContext());
  }, []);

  // detect mobile view for volume slider UX
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth <= 768;
      console.log('🔍 mobile detection:', { width: window.innerWidth, isMobile });
      setIsMobileView(isMobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // handle websocket messages
  const handleWebsocketMessage = useCallback((message: unknown) => {
    console.log("received websocket message:", message);
    
    // handle different message types
    if (message && typeof message === 'object' && 'json' in message) {
      try {
        const data = JSON.parse((message as { json: string }).json);
        if (data.type === 'user_joined') {
          setListenerCount(prev => prev + 1);
        }
      } catch (error) {
        console.log("failed to parse message json:", error);
      }
    }
  }, []);

  // create automatic forum post when someone joins (agent user handles everything)
  const createJoinPost = useCallback(async () => {
    console.log('🎯 attempting to create join forum post...');
    console.log('📍 experienceId:', experienceId);
    
    try {
      console.log('📤 making api call for forum post...');
      
      const response = await fetch('/api/whop-forum', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          experienceId,
          // title and content are now handled by the server with proper radio messaging
        }),
      });
      
      console.log('📬 server response:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });
      
      if (!response.ok) {
        const result = await response.json();
        console.warn('⚠️ forum post creation failed (radio still works):', result);
        console.warn('⚠️ error details:', result.details);
        // don't throw error - just log it and continue
        return { error: true, reason: result.details || 'forum post failed' };
      }
      
      const result = await response.json();
      console.log('✅ forum post created successfully:', result);
      return result;
      
    } catch (error) {
      console.warn('⚠️ forum post request failed (radio still works):', error);
      // don't throw error - just log it and continue
      return { error: true, reason: 'network error' };
    }
  }, [experienceId]);

  // send notification when user actually starts playing
  const sendJoinNotification = useCallback(() => {
    if (hasNotifiedJoin) return; // only send once per session
    
    // send websocket message if connected (optional)
    if (isConnected) {
      sendMessage({
        type: 'user_joined',
        data: { 
          message: 'someone just tuned into the radio 📻',
          timestamp: Date.now()
        }
      });
    }
    
    // automatically create forum post when someone joins (always do this)
    createJoinPost();
    
    setHasNotifiedJoin(true);
    console.log('join notification sent - forum post created');
    // trigger the message handler for testing
    handleWebsocketMessage({ json: JSON.stringify({ type: 'user_joined' }) });
  }, [hasNotifiedJoin, isConnected, sendMessage, handleWebsocketMessage, createJoinPost]);

  // set audio volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = async () => {
    if (!audioRef.current) return;
    
    try {
      if (isPlaying) {
        await audioRef.current.pause();
        setIsPlaying(false);
      } else {
        setError(null);
        await audioRef.current.play();
        setIsPlaying(true);
        // send join notification when user actually starts playing
        sendJoinNotification();
      }
    } catch (err) {
      console.log("audio failed:", err);
      setError("failed to connect to radio stream");
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const handleVolumeTouch = () => {
    // ensure slider stays visible during touch interaction
    setShowVolumeSlider(true);
    
    // auto-hide slider after 3 seconds on mobile
    if (isMobileView) {
      setTimeout(() => {
        setShowVolumeSlider(false);
      }, 3000);
    }
  };

  const toggleMute = () => {
    console.log('🔇 toggleMute called:', { 
      currentMuted: isMuted, 
      volume, 
      isInIframe,
      audioElement: !!audioRef.current 
    });
    
    if (audioRef.current) {
      try {
        if (isMuted) {
          audioRef.current.volume = volume;
          setIsMuted(false);
          console.log('🔇 unmuted, volume restored to:', volume);
        } else {
          audioRef.current.volume = 0;
          setIsMuted(true);
          console.log('🔇 muted, volume set to 0');
        }
        
        // verify the change in iframe context
        if (isInIframe) {
          const actualVolume = audioRef.current.volume;
          console.log('🔇 iframe mute result:', { 
            intended: isMuted ? 0 : volume, 
            actual: actualVolume 
          });
        }
        
      } catch (error) {
        console.error('❌ mute toggle failed:', error);
      }
    }
  };

  const handleAudioPlay = () => {
    setIsPlaying(true);
    setError(null);
  };

  const handleAudioPause = () => {
    setIsPlaying(false);
  };

  const handleAudioError = () => {
    setError("radio stream unavailable");
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
      </div>
      
      {/* websocket status indicator */}
      <div className="absolute top-4 left-4 text-xs text-white/40 space-y-1">
        <div>ws: {connectionStatus} | listeners: {listenerCount}</div>
        <div>mobile: {isMobileView ? 'yes' : 'no'} | iframe: {isInIframe ? 'yes' : 'no'}</div>
        <div>audio: {audioContext}</div>
      </div>
      
      {/* audio element with working stream */}
      <audio 
        ref={audioRef}
        src="https://usa9.fastcast4u.com/proxy/jamz?mp=/1"
        preload="none"
        crossOrigin="anonymous"
        onPlay={handleAudioPlay}
        onPause={handleAudioPause}
        onError={handleAudioError}
        onLoadStart={() => setError(null)}
      />
      
      {/* error display */}
      {error && (
        <div className="absolute top-8 right-8 text-red-400 text-sm font-light">
          {error}
        </div>
      )}
      
      {/* main content container */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* ultra premium radio button */}
        <div className="relative">
          {/* outer glow rings */}
          <div className={`absolute inset-0 rounded-full transition-all duration-1000 ${
            isPlaying 
              ? 'bg-gradient-to-r from-red-500/30 via-rose-400/20 to-red-600/30 blur-3xl scale-150 animate-pulse' 
              : 'bg-gradient-to-r from-red-600/20 via-rose-500/10 to-red-700/20 blur-2xl scale-125'
          }`} />
          
          {/* middle glow */}
          <div className={`absolute inset-0 rounded-full transition-all duration-700 ${
            isPlaying 
              ? 'bg-gradient-to-r from-red-400/40 to-rose-500/40 blur-xl scale-110' 
              : 'bg-gradient-to-r from-red-500/30 to-rose-600/30 blur-lg scale-105'
          }`} />
          
          {/* button container with premium frame */}
          <div className="relative">
            {/* outer chrome ring */}
            <div className="absolute -inset-2 rounded-full bg-gradient-to-b from-white/20 via-white/5 to-transparent p-[2px]">
              <div className="w-full h-full rounded-full bg-gradient-to-b from-gray-900 to-black"></div>
            </div>
            
            {/* main button */}
            <button
              onClick={togglePlay}
              onMouseDown={() => setIsPressed(true)}
              onMouseUp={() => setIsPressed(false)}
              onMouseLeave={() => setIsPressed(false)}
              disabled={!!error}
              className={`
                relative w-80 h-80 rounded-full 
                bg-gradient-to-b from-red-400 via-red-500 to-red-700
                transition-all duration-300 ease-out
                transform ${isPressed ? 'scale-95 translate-y-2' : 'scale-100 translate-y-0'}
                hover:from-red-350 hover:via-red-450 hover:to-red-650
                focus:outline-none focus:ring-4 focus:ring-red-500/30
                disabled:opacity-50 disabled:cursor-not-allowed
                shadow-2xl
                flex items-center justify-center
                overflow-hidden
                border-2 border-red-300/20
              `}
            >
              {/* inner chrome highlight */}
              <div className="absolute inset-3 rounded-full bg-gradient-to-b from-white/30 via-white/10 to-transparent"></div>
              
              {/* animated ripples when playing */}
              {isPlaying && (
                <div className="absolute inset-0 rounded-full animate-ping">
                  <div className="absolute inset-12 rounded-full bg-white/10"></div>
                </div>
              )}
              
              {/* play/pause icon */}
              <div className="relative z-10 text-white drop-shadow-lg">
                {isPlaying ? (
                  <Pause className="w-20 h-20" />
                ) : (
                  <Play className="w-20 h-20 ml-2" />
                )}
              </div>
              
              {/* inner shadow depth */}
              <div className="absolute inset-6 rounded-full shadow-inner bg-gradient-to-t from-black/20 to-transparent"></div>
            </button>
          </div>
        </div>
        
        {/* station info */}
        <div className="mt-12 text-center">
          <h1 className="text-4xl font-light text-white mb-2 tracking-wide">
            whop radio
          </h1>
          <p className="text-white/60 text-lg font-light">
            {isPlaying ? 'now playing' : 'tap to play'}
          </p>
        </div>
      </div>
      
      {/* bottom controls */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center px-8">
        {/* volume control - different UI for mobile vs desktop */}
        {isMobileView ? (
          /* mobile - no audio controls, device only */
          <div className="flex flex-col items-center space-y-2">
            <div className="text-xs text-white/60 text-center">
              Use device volume and mute buttons
            </div>
          </div>
        ) : (
          /* desktop volume controls - original slider */
          <div className="relative flex items-center space-x-3">
            <div 
              className="flex items-center space-x-3"
              onTouchStart={handleVolumeTouch}
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <button
                onClick={toggleMute}
                className="p-4 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 active:bg-white/30 transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-6 h-6 text-white" />
                ) : (
                  <Volume2 className="w-6 h-6 text-white" />
                )}
              </button>
              
              {/* volume slider - desktop only */}
              <div className={`
                transition-all duration-300 ease-out origin-left
                ${showVolumeSlider ? 'opacity-100 scale-x-100 w-24' : 'opacity-0 scale-x-0 w-0'}
              `}>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #ff4444 0%, #ff4444 ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) 100%)`
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ff4444;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ff4444;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}

export default function RadioApp({ experienceId }: RadioClientProps) {
  const handleWebsocketMessage = useCallback((message: unknown) => {
    console.log("websocket message received:", message);
  }, []);

  return (
    <WebsocketProvider experienceId={experienceId} onMessage={handleWebsocketMessage}>
      <RadioAppContent experienceId={experienceId} />
    </WebsocketProvider>
  );
}