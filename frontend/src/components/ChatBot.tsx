
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { User, Bot, Send } from 'lucide-react';
import { ChatMessage } from '../types';

const geminiService = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const ChatBot: React.FC = () => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const newChat = geminiService.chats.create({
            model: 'gemini-2.5-flash',
        });
        setChat(newChat);
        setMessages([{ role: 'model', content: "Hello! How can I help you today?" }]);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = useCallback(async () => {
        if (!input.trim() || !chat || loading) return;

        const userMessage: ChatMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const result = await chat.sendMessageStream({ message: input });
            let text = '';
            setMessages(prev => [...prev, { role: 'model', content: '' }]);

            for await (const chunk of result) {
                text += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].content = text;
                    return newMessages;
                });
            }
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { role: 'model', content: "Sorry, I encountered an error. Please try again." }]);
        } finally {
            setLoading(false);
        }
    }, [input, chat, loading]);

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };
    
    return (
        <div className="flex flex-col h-[75vh] max-w-3xl mx-auto bg-gray-800 rounded-lg shadow-xl">
            <div className="flex-grow p-4 overflow-y-auto">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 my-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center"><Bot className="h-5 w-5 text-white" /></div>}
                        <div className={`px-4 py-2 rounded-lg max-w-xs md:max-w-md break-words ${msg.role === 'user' ? 'bg-gray-700 text-white' : 'bg-gray-900 text-gray-300'}`}>
                            {msg.content || <span className="animate-pulse">...</span>}
                        </div>
                        {msg.role === 'user' && <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center"><User className="h-5 w-5 text-white" /></div>}
                    </div>
                ))}
                 <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-gray-700">
                <div className="flex items-center bg-gray-700 rounded-lg">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        className="flex-grow bg-transparent p-3 focus:outline-none"
                        disabled={loading}
                    />
                    <button onClick={sendMessage} disabled={loading || !input.trim()} className="p-3 text-white disabled:text-gray-500">
                        <Send className="h-6 w-6" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatBot;
