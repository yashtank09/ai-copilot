import React, { useState, useEffect, useRef } from "react";
import { Mic, Square } from "lucide-react";
import { Socket } from "socket.io-client";

interface MicInputButtonProps {
  socket: Socket | null;
  onTranscript: (text: string) => void;
  isListening: boolean;
  setIsListening: (listening: boolean) => void;
}

export const MicInputButton: React.FC<MicInputButtonProps> = ({
  socket,
  onTranscript,
  isListening,
  setIsListening
}) => {
  const [seconds, setSeconds] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          onTranscript(finalTranscript);
        }
      };

      rec.onerror = (e: any) => {
        console.error("Speech recognition error", e);
      };

      rec.onend = () => {
        // Automatically restart if it was intended to continue
        if (isListening && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (err) {
            console.error("Failed to restart speech recognition", err);
          }
        }
      };

      recognitionRef.current = rec;
    }
  }, [isListening, onTranscript]);

  // Handle timer & audio socket chunk emission during active state
  useEffect(() => {
    let socketInterval: any = null;

    if (isListening) {
      // Start timer
      setSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);

      // Start audio context visualization
      startAudioVisualization();

      // Start Speech Recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.error("Speech recognition start failed", e);
        }
      }

      // Emulate sending raw audio chunks to socket backend every 1.5s
      socketInterval = setInterval(() => {
        if (socket && socket.connected) {
          // Send mock raw PCM chunk
          socket.emit("audio_chunk", {
            payload: "mock_pcm_base64_data_stream_chunk",
            timestamp: Date.now()
          });
        }
      }, 1500);
    } else {
      // Clear timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      setSeconds(0);

      // Stop audio context visualization
      stopAudioVisualization();

      // Stop Speech Recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }

      if (socketInterval) {
        clearInterval(socketInterval);
      }
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (socketInterval) clearInterval(socketInterval);
      stopAudioVisualization();
    };
  }, [isListening, socket]);

  const startAudioVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64; // High density not needed for visualizer
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;
      source.connect(analyser);

      drawWaveform();
    } catch (err) {
      console.warn("Could not access microphone for visualization. Using simulated waveform.", err);
      // Fallback to animated simulated wave
      drawSimulatedWaveform();
    }
  };

  const stopAudioVisualization = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      if (!isListening) return;
      animationFrameRef.current = requestAnimationFrame(render);

      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 1.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const percent = dataArray[i] / 255;
        // height centered
        const barHeight = Math.max(3, percent * canvas.height * 0.95);
        const y = (canvas.height - barHeight) / 2;

        // Gradient color for bars
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, "#ef4444"); // Red
        gradient.addColorStop(1, "#f97316"); // Orange

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth - 1, barHeight, 2);
        ctx.fill();

        x += barWidth;
      }
    };

    render();
  };

  const drawSimulatedWaveform = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    const render = () => {
      if (!isListening) return;
      animationFrameRef.current = requestAnimationFrame(render);
      frame++;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const count = 15;
      const barWidth = canvas.width / count;

      for (let i = 0; i < count; i++) {
        // Synthesise some noise based on index and frame
        const noise = Math.sin(frame * 0.15 + i * 0.8) * Math.cos(frame * 0.05 + i * 0.3);
        const heightPercent = 0.25 + 0.65 * Math.abs(noise);
        const barHeight = heightPercent * canvas.height;
        const y = (canvas.height - barHeight) / 2;

        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, "#ef4444");
        gradient.addColorStop(1, "#ec4899"); // Pink

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(i * barWidth + 1, y, barWidth - 2, barHeight, 2);
        ctx.fill();
      }
    };

    render();
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  const handleToggle = () => {
    setIsListening(!isListening);
  };

  return (
    <div className="flex items-center gap-2">
      {isListening && (
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 animate-pulse">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
          </span>
          <span className="font-mono text-xs font-semibold">{formatTimer(seconds)}</span>
          <canvas
            ref={canvasRef}
            width={70}
            height={20}
            className="w-[70px] h-[20px] ml-1 bg-transparent"
          />
        </div>
      )}

      <button
        type="button"
        onClick={handleToggle}
        className={`relative p-2.5 rounded-full flex items-center justify-center transition-all ${
          isListening
            ? "bg-red-500 text-white shadow-lg shadow-red-500/35 hover:bg-red-600 animate-pulse-ring"
            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-100"
        }`}
        title={isListening ? "Stop listening" : "Start speaking"}
      >
        {isListening ? (
          <Square className="h-4 w-4 fill-white" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </button>
    </div>
  );
};
