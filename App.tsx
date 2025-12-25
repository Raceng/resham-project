
import React, { useState, useEffect, useRef } from 'react';
import InteractiveMap from './components/InteractiveMap';
import ChatBubble from './components/ChatBubble';
import { Message, Location, MapPlace } from './types';
import { sendMessageToGemini } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'route'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [visiblePlaces, setVisiblePlaces] = useState<MapPlace[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  
  // Route specific state
  const [startPoint, setStartPoint] = useState('');
  const [destPoint, setDestPoint] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setUserLocation(loc);
          setStartPoint('Current Location');
        },
        (error) => console.warn("Location permission denied", error)
      );
    }
    
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: "Welcome to MapGenie! 🧞‍♂️ I can help you find places or plan your next journey. Need directions? Switch to the 'Route' tab or just ask me here!",
        timestamp: Date.now(),
      }
    ]);

    // Respect system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (e?: React.FormEvent, customPrompt?: string) => {
    e?.preventDefault();
    const text = customPrompt || inputValue;
    if (!text.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      isRoute: !!customPrompt
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await sendMessageToGemini(text, messages, userLocation);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content || "I couldn't find a route for that request.",
        timestamp: Date.now(),
        groundingLinks: response.groundingLinks,
        places: response.places,
      };

      setMessages(prev => [...prev, assistantMessage]);
      if (response.places && response.places.length > 0) {
        setVisiblePlaces(response.places);
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "Sorry, I encountered an error while calculating your route. Please try again.",
          timestamp: Date.now(),
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const onGetDirections = () => {
    if (!startPoint || !destPoint) return;
    const prompt = `Plan a route and give me turn-by-turn directions from "${startPoint}" to "${destPoint}". Include estimated travel time and major roads used.`;
    handleSendMessage(undefined, prompt);
    setActiveTab('chat'); // Switch back to see the results
  };

  return (
    <div className={`${darkMode ? 'dark' : ''} h-screen w-screen overflow-hidden`}>
      <div className="flex flex-col md:flex-row h-full w-full bg-gray-100 dark:bg-slate-900 overflow-hidden font-sans transition-colors duration-200">
        
        {/* Sidebar UI */}
        <div className="w-full md:w-[420px] lg:w-[480px] flex flex-col border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl z-20">
          
          {/* Header with Navigation */}
          <div className="bg-blue-600 dark:bg-blue-800 text-white shadow-lg">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20">
                  <span className="text-xl">🧞‍♂️</span>
                </div>
                <div>
                  <h1 className="font-extrabold text-xl leading-tight">MapGenie</h1>
                  <div className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="text-[10px] uppercase tracking-widest font-semibold text-blue-100">Live Navigation AI</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title="Toggle Dark Mode"
              >
                {darkMode ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-yellow-300">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-t border-blue-500/30">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-3 text-sm font-semibold transition-all relative ${
                  activeTab === 'chat' ? 'text-white' : 'text-blue-200 hover:text-white'
                }`}
              >
                Chat
                {activeTab === 'chat' && <div className="absolute bottom-0 left-0 w-full h-1 bg-white"></div>}
              </button>
              <button
                onClick={() => setActiveTab('route')}
                className={`flex-1 py-3 text-sm font-semibold transition-all relative ${
                  activeTab === 'route' ? 'text-white' : 'text-blue-200 hover:text-white'
                }`}
              >
                Route Planner
                {activeTab === 'route' && <div className="absolute bottom-0 left-0 w-full h-1 bg-white"></div>}
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {activeTab === 'chat' ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide dark:bg-slate-950">
                  {messages.map((msg) => (
                    <ChatBubble key={msg.id} message={msg} />
                  ))}
                  {isTyping && (
                    <div className="flex justify-start mb-4">
                      <div className="bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 p-4 rounded-2xl rounded-tl-none flex items-center space-x-2 shadow-sm">
                        <div className="flex space-x-1">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium italic">Calculating your journey...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-4 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800">
                  <form onSubmit={handleSendMessage} className="relative">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Where to next?"
                      className="w-full pl-5 pr-14 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm shadow-inner dark:text-white dark:placeholder-gray-500"
                      disabled={isTyping}
                    />
                    <button
                      type="submit"
                      disabled={!inputValue.trim() || isTyping}
                      className="absolute right-2.5 top-2.5 p-2.5 bg-blue-600 dark:bg-blue-700 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                      </svg>
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="flex-1 p-6 space-y-6 overflow-y-auto dark:bg-slate-950 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
                    <span className="mr-2 text-blue-600 dark:text-blue-400">🛣️</span> Plan a Route
                  </h2>
                  <div className="relative space-y-3">
                    <div className="absolute left-4 top-10 bottom-10 w-0.5 bg-gray-200 dark:bg-slate-800 dashed"></div>
                    
                    <div className="relative z-10">
                      <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter mb-1 block">Starting Point</label>
                      <div className="flex items-center space-x-3 bg-gray-50 dark:bg-slate-900 p-3 rounded-xl border border-gray-200 dark:border-slate-800 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30 transition-all">
                        <div className="w-3 h-3 rounded-full bg-green-500 ring-4 ring-green-100 dark:ring-green-900/30"></div>
                        <input 
                          className="bg-transparent border-none focus:ring-0 text-sm w-full font-medium dark:text-white" 
                          placeholder="Enter start location..."
                          value={startPoint}
                          onChange={(e) => setStartPoint(e.target.value)}
                        />
                        <button 
                          onClick={() => setStartPoint('Current Location')}
                          className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 px-2 py-1 rounded whitespace-nowrap"
                        >
                          MY LOC
                        </button>
                      </div>
                    </div>

                    <div className="relative z-10">
                      <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter mb-1 block">Destination</label>
                      <div className="flex items-center space-x-3 bg-gray-50 dark:bg-slate-900 p-3 rounded-xl border border-gray-200 dark:border-slate-800 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30 transition-all">
                        <div className="w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-100 dark:ring-red-900/30"></div>
                        <input 
                          className="bg-transparent border-none focus:ring-0 text-sm w-full font-medium dark:text-white" 
                          placeholder="Where are you going?"
                          value={destPoint}
                          onChange={(e) => setDestPoint(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={onGetDirections}
                    disabled={!startPoint || !destPoint ||