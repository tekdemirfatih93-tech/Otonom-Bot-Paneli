import React, { useState } from 'react';
import AgentDashboard from './components/AgentDashboard';
import ChatBot from './components/ChatBot';
import GeminiToolkit from './components/GeminiToolkit';
import GroundedSearch from './components/GroundedSearch';
import LiveConversation from './components/LiveConversation';
import { BrainCircuit, LayoutDashboard, MessageSquare, Wrench, Search, Mic } from 'lucide-react';

type Tab = 'dashboard' | 'chat' | 'toolkit' | 'search' | 'live';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const tabs: { id: Tab; label: string; icon: React.ReactNode; component: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, component: <AgentDashboard /> },
    { id: 'chat', label: 'Chat', icon: <MessageSquare size={20} />, component: <ChatBot /> },
    { id: 'toolkit', label: 'Toolkit', icon: <Wrench size={20} />, component: <GeminiToolkit /> },
    { id: 'search', label: 'Search', icon: <Search size={20} />, component: <GroundedSearch /> },
    { id: 'live', label: 'Live', icon: <Mic size={20} />, component: <LiveConversation /> },
  ];

  const renderContent = () => {
    const activeTabData = tabs.find(tab => tab.id === activeTab);
    return activeTabData ? activeTabData.component : null;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <header className="bg-gray-800 shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <BrainCircuit className="h-8 w-8 text-blue-400" />
              <h1 className="text-xl font-bold ml-3 hidden sm:block">Otonom Bot Paneli</h1>
            </div>
            <nav className="flex items-center space-x-1 sm:space-x-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                >
                  {tab.icon}
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
