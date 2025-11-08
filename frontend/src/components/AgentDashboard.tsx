import React, { useState, useEffect, useRef } from 'react';
import { SiteConfig } from '../types';
import { Plus, Trash2, Play, Square, Loader, Bot, CheckCircle, CircleDollarSign, Globe, Shield } from 'lucide-react';
import { GoogleGenAI, FunctionDeclaration, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// --- Gemini Function Declarations ---
const findTaskFunction: FunctionDeclaration = {
    name: 'find_available_task',
    description: "Kullanıcının platformunda tamamlanabilecek yeni bir görev bulur. Farklı görev türleri ve potansiyel ödülleri vardır.",
    parameters: {
        type: Type.OBJECT,
        properties: {},
        required: []
    }
};

const completeTaskFunction: FunctionDeclaration = {
    name: 'complete_task',
    description: "Bulunan bir görevi tamamlar. Görevin başarılı olup olmayacağı ve kazanılan kesin puan miktarı bu fonksiyonun sonucunda belirlenir.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            task_type: { type: Type.STRING, description: "Tamamlanacak görevin türü (örn: 'Anket', 'Reklam İzleme', 'Teklif')." },
            potential_points: { type: Type.NUMBER, description: "Görevin tahmini puan değeri." }
        },
        required: ['task_type', 'potential_points']
    }
};

const takeBreakFunction: FunctionDeclaration = {
    name: 'take_a_break',
    description: "Anti-bot sistemleri tarafından tespit edilme riskini azaltmak için rastgele bir süre mola verir.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            duration_seconds: { type: Type.NUMBER, description: "Mola süresi (saniye cinsinden)." }
        },
        required: ['duration_seconds']
    }
};

const tools = [{ functionDeclarations: [findTaskFunction, completeTaskFunction, takeBreakFunction] }];

const AgentDashboard: React.FC = () => {
    const [sites, setSites] = useState<SiteConfig[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newSiteName, setNewSiteName] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const agentStateRefs = useRef<Record<string, { isRunning: boolean; currentTask: any | null }>>({});

    useEffect(() => {
        return () => {
            Object.keys(agentStateRefs.current).forEach(id => {
                if (agentStateRefs.current[id]) {
                   agentStateRefs.current[id].isRunning = false;
                }
            });
        };
    }, []);

    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 99)]);
    };
    
    const handleLoginAndAdd = () => {
        if (!newSiteName.trim() || !newUsername.trim() || !newPassword.trim()) return;
        setIsLoggingIn(true);
        
        const siteAdapter = newSiteName.replace(/^(https?:\/\/)?(www\.)?/, '').split('.')[0];

        addLog(`[Güvenlik Uzmanı] '${siteAdapter}' için güvenli bağlantı kuruluyor...`);
        
        setTimeout(() => {
            addLog(`[Güvenlik Uzmanı] Giriş denemesi yapılıyor: Kullanıcı '${newUsername}'`);
            setTimeout(() => {
                addLog(`[Güvenlik Uzmanı] Giriş BAŞARILI! Oturum token'ı alındı. Asistan oluşturuluyor.`);

                const countries = ['Turkey', 'Germany', 'USA', 'Brazil', 'United Kingdom'];
                const country = countries[Math.floor(Math.random() * countries.length)];

                const newSite: SiteConfig = {
                    id: new Date().toISOString(),
                    adapter: siteAdapter,
                    username: newUsername,
                    persona: 'Güvenlik Uzmanı',
                    country,
                    status: 'stopped',
                    tasksCompleted: 0,
                    pointsEarned: 0,
                };
                
                setSites(prev => [...prev, newSite]);
                agentStateRefs.current[newSite.id] = { isRunning: false, currentTask: null };
                addLog(`Yeni asistan eklendi: '${siteAdapter}' sitesi için.`);
                closeModal();
            }, 2000);
        }, 1500);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setNewSiteName('');
        setNewUsername('');
        setNewPassword('');
        setIsLoggingIn(false);
    };

    const toggleAgentStatus = (id: string) => {
        const agentState = agentStateRefs.current[id];
        const site = sites.find(s => s.id === id);
        if (!agentState || !site) return;

        if (agentState.isRunning) {
            addLog(`[${site.persona} - ${site.adapter}] Asistan durduruluyor.`);
            agentState.isRunning = false;
            setSites(sites.map(s => s.id === id ? { ...s, status: 'stopped', currentAction: 'Durduruldu' } : s));
        } else {
            addLog(`[${site.persona} - ${site.adapter}] Asistan başlatılıyor...`);
            agentState.isRunning = true;
            agentState.currentTask = null;
            setSites(sites.map(s => s.id === id ? { ...s, status: 'running', currentAction: 'Başlatılıyor...' } : s));
            runAgentSimulation(id);
        }
    };
    
    const removeSite = (id: string, adapter: string) => {
        if (agentStateRefs.current[id]) {
            agentStateRefs.current[id].isRunning = false;
        }
        delete agentStateRefs.current[id];
        setSites(sites.filter(site => site.id !== id));
        addLog(`'${adapter}' asistanı kaldırıldı.`);
    };

    const runAgentSimulation = async (id: string) => {
        const agentState = agentStateRefs.current[id];
        const site = sites.find(s => s.id === id);

        if (!agentState || !agentState.isRunning || !site) {
            if (agentState) agentState.isRunning = false;
             setSites(prev => prev.map(s => s.id === id && s.status === 'running' ? { ...s, status: 'stopped', currentAction: 'Durduruldu' } : s));
            return;
        }

        const personaPrefix = `[${site.persona} - ${site.adapter}]`;

        try {
            const prompt = agentState.currentTask 
                ? `Bot bir '${site.persona}'. Bir görev buldu: ${JSON.stringify(agentState.currentTask)}. Şimdi bu görevi tamamlamalı.` 
                : `Bot bir '${site.persona}', 'Coinpayu' benzeri bir görev platformunda. Bir sonraki eylemine karar ver: Yeni bir görev mi bulmalı, yoksa tespit edilmemek için mola mı vermeli?`;
            
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: { tools },
            });
            
            const functionCall = response.functionCalls?.[0];

            if (functionCall) {
                switch (functionCall.name) {
                    case 'find_available_task': {
                        const taskTypes = [
                            { type: 'Yüksek Değerli Anket', points: 450 },
                            { type: 'Uygulama İndirme Teklifi', points: 800 },
                            { type: 'Kısa Reklam İzleme', points: 15 },
                            { type: 'Web Sitesi Gezinme', points: 25 },
                        ];
                        const task = taskTypes[Math.floor(Math.random() * taskTypes.length)];
                        agentState.currentTask = task;
                        const actionText = `Yeni fırsatlar için ağ trafiği taranıyor... Bulundu: '${task.type}' (Tahmini Bakiye: ${task.points}).`;
                        setSites(prev => prev.map(s => s.id === id ? { ...s, currentAction: actionText } : s));
                        addLog(`${personaPrefix} ${actionText}`);
                        break;
                    }
                    case 'complete_task': {
                        const { task_type, potential_points } = functionCall.args;
                        const actionText = `Görevi tamamlama protokolü başlatılıyor: '${task_type}'...`;
                        setSites(prev => prev.map(s => s.id === id ? { ...s, currentAction: actionText } : s));
                        addLog(`${personaPrefix} ${actionText}`);
                        
                        await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
                        
                        const success = Math.random() > 0.1;
                        if (success) {
                            const earnedPoints = Math.round(potential_points * (0.8 + Math.random() * 0.4));
                            setSites(prev => prev.map(s => s.id === id ? { 
                                ...s, 
                                tasksCompleted: s.tasksCompleted + 1,
                                pointsEarned: s.pointsEarned + earnedPoints,
                             } : s));
                            addLog(`${personaPrefix} Görev BAŞARILI! Profil güncellendi: +${earnedPoints} Bakiye.`);
                        } else {
                            addLog(`${personaPrefix} Görev BAŞARISIZ! (Simülasyon: Captcha çözülemedi veya görev zaman aşımına uğradı).`);
                        }
                        agentState.currentTask = null;
                        break;
                    }
                    case 'take_a_break': {
                        const { duration_seconds } = functionCall.args;
                        const duration = Math.min(Math.round(duration_seconds), 15) || 5;
                        const actionText = `Tespit edilmemek için kullanıcı davranışı taklit ediliyor (${duration} saniye mola).`;
                         setSites(prev => prev.map(s => s.id === id ? { ...s, currentAction: actionText } : s));
                        addLog(`${personaPrefix} ${actionText}`);
                        await new Promise(resolve => setTimeout(resolve, duration * 1000));
                        break;
                    }
                }
            } else {
                 addLog(`${personaPrefix} Gemini bir eylem belirleyemedi, tekrar deneniyor.`);
            }

        } catch (error) {
            console.error("Simulation error:", error);
            addLog(`${personaPrefix} Bir hata oluştu. Simülasyon duraklatılıyor.`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
        setTimeout(() => runAgentSimulation(id), 2000 + Math.random() * 3000);
    };

    const renderSiteStatus = (site: SiteConfig) => {
        if (site.status === 'running') {
            return <div className="flex items-center text-green-400"><Loader className="animate-spin h-4 w-4 mr-2" />Çalışıyor</div>;
        }
        return <div className="text-yellow-400">Durduruldu</div>;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Asistan Kontrol Paneli</h2>
                    <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center">
                        <Plus className="h-5 w-5 mr-2" /> Asistan Ekle
                    </button>
                </div>
                <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                    <div className="p-4 space-y-4">
                        {sites.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <Bot size={48} className="mx-auto mb-4" />
                                <p>Henüz asistan eklenmedi.</p>
                                <p>"Asistan Ekle" butonuna tıklayarak başlayın.</p>
                            </div>
                        ) : (
                            sites.map(site => (
                                <div key={site.id} className="bg-gray-700/50 p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex-grow">
                                        <h3 className="text-lg font-bold capitalize">{site.adapter}</h3>
                                        <p className="text-sm text-gray-400">{site.username}</p>
                                        <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                                            <div className="flex items-center">
                                                <Globe size={14} className="mr-1.5" />
                                                <span>{site.country}</span>
                                            </div>
                                            <div className="flex items-center text-cyan-400">
                                                <Shield size={14} className="mr-1.5" />
                                                <span>{site.persona}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 mt-2 text-sm">
                                            <div className="flex items-center text-gray-300" title="Tamamlanan Görevler">
                                                <CheckCircle size={14} className="mr-1.5 text-green-400" />
                                                <span>{site.tasksCompleted} Görev</span>
                                            </div>
                                            <div className="flex items-center text-gray-300" title="Bakiye">
                                                <CircleDollarSign size={14} className="mr-1.5 text-yellow-400" />
                                                <span>{site.pointsEarned} Bakiye</span>
                                            </div>
                                        </div>
                                        <div className="mt-2 text-sm">{renderSiteStatus(site)}</div>
                                        {site.status === 'running' && <p className="text-xs text-gray-300 mt-1 truncate"><strong>Son Eylem:</strong> {site.currentAction}</p>}
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                                        <button onClick={() => toggleAgentStatus(site.id)} className={`w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 ${site.status === 'running' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'}`}>
                                            {site.status === 'running' ? <><Square size={16}/>Durdur</> : <><Play size={16}/>Başlat</>}
                                        </button>
                                        <button onClick={() => removeSite(site.id, site.adapter)} className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-bold mb-6">Aktivite Günlüğü</h2>
                <div className="bg-gray-800 rounded-lg shadow-lg p-4 h-96 overflow-y-auto flex flex-col-reverse">
                    <div className="space-y-2 text-sm font-mono">
                        {logs.map((log, i) => (
                            <p key={i} className="text-gray-300 animate-fade-in">{log}</p>
                        ))}
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-8 shadow-2xl w-full max-w-md">
                        <h3 className="text-xl font-bold mb-6">Güvenlik Uzmanı Asistanı Ekle</h3>
                        <div className="space-y-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Site Adı</label>
                                <input
                                    type="text"
                                    placeholder="coinpayu.com"
                                    value={newSiteName}
                                    onChange={(e) => setNewSiteName(e.target.value)}
                                    className="w-full bg-gray-700 p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Kullanıcı Adı</label>
                                <input
                                    type="text"
                                    placeholder="Kullanıcı adınız veya e-postanız"
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    className="w-full bg-gray-700 p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Şifre</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-gray-700 p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-4">
                            <button onClick={closeModal} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">İptal</button>
                            <button 
                                onClick={handleLoginAndAdd} 
                                disabled={isLoggingIn || !newSiteName || !newUsername || !newPassword} 
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg w-48 flex items-center justify-center"
                            >
                                {isLoggingIn ? <Loader className="animate-spin" /> : 'Giriş Yap ve Ekle'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgentDashboard;