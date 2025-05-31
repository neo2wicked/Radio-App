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
  const [hasNotifiedJoin, setHasNotifiedJoin] = useState(false);
  const [listenerCount, setListenerCount] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const { isConnected, sendMessage, connectionStatus } = useWebsocket();

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

  // create automatic forum post when someone joins (like omegle agent)
  const createJoinPost = useCallback(async () => {
    console.log('🎯 auto-creating join forum post via server route (whop-map pattern)!');
    console.log('📍 experienceId:', experienceId);
    
    try {
      console.log('📤 making server api call...');
      
      const response = await fetch('/api/whop-forum', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          experienceId,
          title: 'New Listener Joined',
          content: 'Someone just joined the radio station! 🎧 Welcome to the vibe! What music are you feeling today?'
        }),
      });
      
      console.log('📬 server response:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ server route failed:', result);
        throw new Error(`server error: ${result.error} - ${result.details}`);
      }
      
      console.log('✅ forum post created via server route:', result);
      
    } catch (error) {
      console.error('💥 server route forum post failed:', error);
      console.error('💥 error name:', error instanceof Error ? error.name : 'unknown');
      console.error('💥 error message:', error instanceof Error ? error.message : String(error));
      console.error('💥 error stack:', error instanceof Error ? error.stack : 'no stack');
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
          message: '🎵 someone joined the radio station',
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

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
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
      <div className="absolute top-4 left-4 text-xs text-white/40">
        ws: {connectionStatus} | listeners: {listenerCount}
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
        {/* volume control */}
        <div 
          className="relative flex items-center space-x-3"
          onMouseEnter={() => setShowVolumeSlider(true)}
          onMouseLeave={() => setShowVolumeSlider(false)}
        >
          <button
            onClick={toggleMute}
            className="p-3 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-5 h-5 text-white" />
            ) : (
              <Volume2 className="w-5 h-5 text-white" />
            )}
          </button>
          
          {/* volume slider */}
          <div className={`
            transition-all duration-300 ease-out origin-left
            ${showVolumeSlider ? 'opacity-100 scale-x-100 w-24' : 'opacity-0 scale-x-0 w-0'}
          `}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
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