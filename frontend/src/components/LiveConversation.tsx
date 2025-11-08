
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob as GenaiBlob } from "@google/genai";
import { Mic, MicOff, AlertTriangle } from 'lucide-react';

// --- Audio Helper Functions (as per guidelines) ---
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function createBlob(data: Float32Array): GenaiBlob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const LiveConversation: React.FC = () => {
    const [isConversing, setIsConversing] = useState<boolean>(false);
    const [transcripts, setTranscripts] = useState<{ user: string, model: string }[]>([]);
    const [currentTranscription, setCurrentTranscription] = useState({ user: '', model: '' });
    const [error, setError] = useState<string>('');
    
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    
    const stopConversation = useCallback(() => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }

        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close();
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close();
        }
        
        sourcesRef.current.forEach(source => source.stop());
        sourcesRef.current.clear();
        nextStartTimeRef.current = 0;

        setIsConversing(false);
    }, []);
    
    const startConversation = useCallback(async () => {
        setError('');
        try {
            if (isConversing) return;
            
            setIsConversing(true);
            setTranscripts([]);
            setCurrentTranscription({ user: '', model: '' });

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            let currentInput = '';
            let currentOutput = '';
            
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                },
                callbacks: {
                    onopen: () => {
                        if (!streamRef.current || !inputAudioContextRef.current) return;
                        mediaStreamSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
                        scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                        
                        scriptProcessorRef.current.onaudioprocess = (event) => {
                            const inputData = event.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            if (sessionPromiseRef.current) {
                                sessionPromiseRef.current.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                            }
                        };
                        
                        mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            currentInput += message.serverContent.inputTranscription.text;
                            setCurrentTranscription(prev => ({ ...prev, user: currentInput }));
                        }
                        if (message.serverContent?.outputTranscription) {
                            currentOutput += message.serverContent.outputTranscription.text;
                            setCurrentTranscription(prev => ({ ...prev, model: currentOutput }));
                        }
                        if (message.serverContent?.turnComplete) {
                            setTranscripts(prev => [...prev, {user: currentInput, model: currentOutput}]);
                            currentInput = '';
                            currentOutput = '';
                            setCurrentTranscription({user: '', model: ''});
                        }

                        const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                        if (audioData && outputAudioContextRef.current) {
                            const ctx = outputAudioContextRef.current;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
                            const source = ctx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(ctx.destination);
                            source.addEventListener('ended', () => sourcesRef.current.delete(source));
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }
                    },
                    onerror: (e) => {
                        console.error('Live session error:', e);
                        setError('An error occurred during the conversation.');
                        stopConversation();
                    },
                    onclose: () => {
                        stopConversation();
                    },
                }
            });

        } catch (e) {
            console.error('Failed to start conversation:', e);
            setError('Could not access microphone. Please grant permission and try again.');
            setIsConversing(false);
        }
    }, [isConversing, stopConversation]);
    
    useEffect(() => {
        return () => {
            stopConversation();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Live Conversation</h2>
            <p className="text-gray-400 mb-8">Speak directly with Gemini and get real-time audio responses.</p>
            
            <button
                onClick={isConversing ? stopConversation : startConversation}
                className={`px-8 py-4 rounded-full font-bold text-lg transition-all flex items-center justify-center mx-auto ${isConversing ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
                {isConversing ? <MicOff className="mr-2"/> : <Mic className="mr-2"/>}
                {isConversing ? 'Stop Conversation' : 'Start Conversation'}
            </button>
            
            {error && <div className="mt-4 p-3 bg-red-500/20 text-red-300 rounded-lg flex items-center justify-center gap-2"><AlertTriangle/>{error}</div>}

            <div className="mt-8 text-left bg-gray-800 rounded-lg p-6 min-h-[300px]">
                <h3 className="font-semibold text-lg mb-4">Transcript</h3>
                <div className="space-y-4">
                    {transcripts.map((t, i) => (
                        <div key={i}>
                            <p><strong className="text-blue-400">You:</strong> {t.user}</p>
                            <p><strong className="text-green-400">Gemini:</strong> {t.model}</p>
                        </div>
                    ))}
                    {isConversing && (
                         <div>
                            <p><strong className="text-blue-400">You:</strong> {currentTranscription.user}<span className="animate-pulse">_</span></p>
                            <p><strong className="text-green-400">Gemini:</strong> {currentTranscription.model}<span className="animate-pulse">_</span></p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LiveConversation;
