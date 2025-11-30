import React, { useState, useEffect, useRef } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  Wind, 
  Droplets, 
  Thermometer, 
  Activity, 
  ShieldCheck, 
  Cpu, 
  Menu,
  X,
  Share2,
  MapPin,
  FileText,
  HelpCircle,
  Server
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';

// --- UTILS & SIMULATION (Inlined for Preview) ---
const initialSimState = {
  aqi: 42,
  sensorData: {
    temperature: 24,
    humidity: 45,
    pm25: 12,
    gas: 400,
    trend: 'stable'
  },
  blockchain: {
    blockHeight: 845210,
    lastHash: "8f4a...92b1",
    status: "synced"
  }
};

const simulateStep = (prevState) => {
  // Random walk physics
  const r = () => (Math.random() - 0.5) * 2;
  
  let newPm25 = Math.max(5, Math.min(150, prevState.sensorData.pm25 + r() * 2));
  let newTemp = Math.max(15, Math.min(35, prevState.sensorData.temperature + r() * 0.1));
  let newHum = Math.max(30, Math.min(90, prevState.sensorData.humidity + r() * 0.5));
  
  // Calculate AQI roughly from PM2.5
  let newAqi = Math.round(newPm25 * 3.5); 

  return {
    aqi: newAqi,
    sensorData: {
      temperature: Number(newTemp.toFixed(1)),
      humidity: Number(newHum.toFixed(1)),
      pm25: Number(newPm25.toFixed(1)),
      gas: Math.max(100, prevState.sensorData.gas + r() * 5),
      trend: r() > 0 ? 'rising' : 'falling'
    },
    blockchain: {
      blockHeight: prevState.blockchain.blockHeight + (Math.random() > 0.8 ? 1 : 0),
      lastHash: prevState.blockchain.lastHash,
      status: "synced"
    }
  };
};

const initialChartData = Array.from({ length: 20 }, (_, i) => ({
  time: `${10 + Math.floor(i/4)}:${(i%4)*15}`,
  actual: 30 + Math.random() * 20,
  predicted: 30 + Math.random() * 20
}));

const initialAlerts = [
    { title: "High PM2.5 detected in Zone B", time: "10 min ago" },
    { title: "Sensor #4 calibration required", time: "2 hours ago" }
];

// --- COMPONENTS (Inlined for Preview) ---

const Header = ({ isConnected, currentView, onNavigate }) => (
  <header className="fixed top-0 left-0 right-0 h-20 z-40 bg-slate-950/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 lg:px-12">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
        <Wind className="text-white w-6 h-6" />
      </div>
      <span className="text-xl font-bold tracking-tight text-white">AIRLUME</span>
    </div>
    
    <nav className="hidden lg:flex items-center gap-8">
      {['live', 'map', 'nodes', 'whitepaper'].map((view) => (
        <button 
          key={view}
          onClick={() => onNavigate(view)}
          className={`text-sm font-medium transition-colors uppercase tracking-wider ${
            currentView === view ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          {view}
        </button>
      ))}
    </nav>

    <div className="flex items-center gap-4">
      <div className={`px-3 py-1 rounded-full text-xs font-mono border flex items-center gap-2 ${
        isConnected ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
      }`}>
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
        {isConnected ? 'LIVE STREAM' : 'OFFLINE'}
      </div>
    </div>
  </header>
);

const AQIGauge = ({ value, prediction }) => (
  <div className="relative p-6 rounded-2xl bg-slate-900/50 border border-white/10 overflow-hidden group hover:border-emerald-500/30 transition-all duration-500">
    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    
    <div className="flex justify-between items-start mb-4">
      <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">Air Quality Index</h3>
      <Activity className="w-5 h-5 text-emerald-500" />
    </div>
    
    <div className="flex items-baseline gap-4 mt-2">
      <span className="text-6xl font-light text-white tracking-tighter">{value}</span>
      <div className="flex flex-col">
        <span className="text-emerald-400 font-medium">Good</span>
        <span className="text-xs text-slate-500">Trend: {prediction}</span>
      </div>
    </div>

    {/* Progress Bar */}
    <div className="w-full h-2 bg-slate-800 rounded-full mt-6 overflow-hidden">
      <div 
        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-1000 ease-out"
        style={{ width: `${Math.min(100, (value / 300) * 100)}%` }}
      />
    </div>
  </div>
);

const SensorCard = ({ label, value, unit, icon: Icon, color }) => (
  <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 hover:bg-slate-800/60 transition-colors">
    <div className="flex items-start justify-between mb-2">
      <span className="text-slate-400 text-xs uppercase">{label}</span>
      <Icon className={`w-4 h-4 ${color}`} />
    </div>
    <div className="text-2xl font-semibold text-slate-200">
      {value} <span className="text-sm font-normal text-slate-500">{unit}</span>
    </div>
  </div>
);

const SensorGrid = ({ data }) => (
  <div className="grid grid-cols-2 gap-4">
    <SensorCard label="Temperature" value={data.temperature} unit="°C" icon={Thermometer} color="text-amber-400" />
    <SensorCard label="Humidity" value={data.humidity} unit="%" icon={Droplets} color="text-blue-400" />
    <SensorCard label="PM 2.5" value={data.pm25} unit="µg/m³" icon={Wind} color="text-purple-400" />
    <SensorCard label="VOC Gas" value={data.gas} unit="ppb" icon={Cpu} color="text-emerald-400" />
  </div>
);

const PredictionChart = ({ data }) => (
  <div className="h-64 w-full bg-slate-900/50 border border-white/10 rounded-2xl p-4 mt-6">
    <h3 className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-4">24h Forecast</h3>
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis dataKey="time" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
          itemStyle={{ color: '#e2e8f0' }}
        />
        <Area type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorAqi)" />
        <Line type="monotone" dataKey="predicted" stroke="#38bdf8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

const AlertsPanel = ({ alerts }) => (
  <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 h-full">
    <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-4 flex items-center justify-between">
      Active Alerts 
      <span className="bg-rose-500/20 text-rose-400 text-xs px-2 py-0.5 rounded-full">{alerts.length}</span>
    </h3>
    <div className="space-y-3">
      {alerts.map((alert, i) => (
        <div key={i} className="flex gap-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
           <ShieldCheck className="w-5 h-5 text-rose-400 shrink-0" />
           <div>
             <div className="text-sm font-medium text-rose-200">{alert.title}</div>
             <div className="text-xs text-rose-300/70">{alert.time}</div>
           </div>
        </div>
      ))}
    </div>
  </div>
);

const BlockchainStatus = ({ state }) => (
    <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Server className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-white font-medium">Node Status</h3>
        </div>
        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="text-slate-400">Block Height</span>
                <span className="font-mono text-emerald-400">#{state?.blockHeight?.toLocaleString() || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-slate-400">Sync Status</span>
                <span className="text-emerald-400 uppercase">{state?.status || 'unknown'}</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-slate-400">Hash</span>
                <span className="font-mono text-slate-500 truncate w-32">{state?.lastHash || 'N/A'}</span>
            </div>
        </div>
    </div>
);

const AmbientBackground = () => (
  <div className="fixed inset-0 z-0 pointer-events-none bg-slate-950">
    <div className="absolute w-1/2 h-1/2 bg-emerald-500/10 rounded-full animate-pulse" style={{ top: '-20%', left: '-10%', filter: 'blur(120px)' }} />
    <div className="absolute w-1/2 h-1/2 bg-cyan-500/10 rounded-full" style={{ bottom: '-20%', right: '-10%', filter: 'blur(120px)' }} />
  </div>
);

const MasumiAI = ({ isOpen, onClose, aqi, sensorData }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hello! I'm monitoring your air quality sensors. Current AQI is ${aqi}. How can I assist you?` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      // Call Masumi Agent Backend
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          aqi: aqi,
          temperature: sensorData.temperature,
          humidity: sensorData.humidity,
          pm25: sensorData.pm25,
          gas: sensorData.gas,
          trend: sensorData.trend
        })
      });

      const data = await response.json();
      const assistantMessage = {
        role: 'assistant',
        content: data.response
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error connecting to Masumi AI. Please ensure the agent is running on port 8000.'
      }]);
    }

    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-slate-900 border-l border-white/10 shadow-2xl z-50 p-6 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <BrainCircuit className="text-emerald-400" /> Masumi AI
        </h2>
        <button onClick={onClose} className="hover:bg-slate-800 p-2 rounded-lg transition-colors">
          <X className="text-slate-400 hover:text-white" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-xl border ${
              msg.role === 'user'
                ? 'bg-emerald-500/10 border-emerald-500/20 ml-8'
                : 'bg-slate-800/50 border-white/5 mr-8'
            }`}
          >
            <p className="text-slate-300 text-sm whitespace-pre-wrap">{msg.content}</p>
          </div>
        ))}
        {isLoading && (
          <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5 mr-8">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask about air quality..."
          className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
        />
        <button
          onClick={handleSendMessage}
          disabled={isLoading || !input.trim()}
          className="bg-gradient-to-r from-emerald-500 to-teal-400 px-4 py-2 rounded-lg font-medium text-white hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  );
};

// --- CONFIGURATION ---
const API_URL = 'http://localhost:5000/api/live';
const PREDICTION_API_URL = 'http://localhost:5000/api/predict';
const POLL_INTERVAL = 2000; 

const App = () => {
  // --- STATE ---
  const [isConnected, setIsConnected] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [currentView, setCurrentView] = useState('live');
  
  // Data State
  const [aqi, setAqi] = useState(initialSimState.aqi);
  const [sensorData, setSensorData] = useState(initialSimState.sensorData);
  const [blockchainState, setBlockchainState] = useState(initialSimState.blockchain);
  const [chartData, setChartData] = useState(initialChartData);
  const [alerts] = useState(initialAlerts);
  const [predictionTrend, setPredictionTrend] = useState('stable');
  
  // NEW: State for the Python Backend Prediction
  const [aiPrediction, setAiPrediction] = useState(null);
  const [predictionError, setPredictionError] = useState(false);

  // Simulation State Ref (for fallback mode)
  const simStateRef = useRef(initialSimState);

  // --- NEW: PREDICTION FUNCTION ---
  const predictNextHourAQI = async (currentTemp, currentHum, currentPM25, currentGas, location = 'indoor') => {
    try {
      const response = await fetch(PREDICTION_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: location,
          temp_c: currentTemp,
          hum_pct: currentHum,
          pm25_ugm3: currentPM25,
          mq_raw: currentGas || 400,
          rolling_avg_pm25: currentPM25,
          pm25_change: 0
        })
      });

      if (!response.ok) {
        console.warn('Prediction API returned error:', response.status);
        setPredictionError(true);
        return null;
      }
      
      const result = await response.json();
      setPredictionError(false);
      return result.predicted_aqi;
    } catch (error) {
      console.warn("Prediction API unreachable:", error);
      setPredictionError(true);
      return null;
    }
  };

  // --- DATA FETCHING ENGINE ---
  const fetchData = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000); 

      const response = await fetch(API_URL, {
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' }
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();

      // Update State from Live API
      setIsConnected(true);
      setAqi(data.environment.aqi);
      setSensorData(data.environment);
      setBlockchainState(data.blockchain);
      setPredictionTrend(data.environment.trend);

      // --- CALL PREDICTION API ---
      const predictedVal = await predictNextHourAQI(
        data.environment.temperature,
        data.environment.humidity,
        data.environment.pm25,
        data.environment.gas,
        data.environment.location || 'indoor'
      );
      
      if (predictedVal !== null) {
        setAiPrediction(predictedVal);
      }

      // Sync simulation ref
      simStateRef.current = {
        aqi: data.environment.aqi,
        sensorData: { ...data.environment },
        blockchain: { ...data.blockchain }
      };

    } catch (error) {
      // --- FALLBACK MODE (CLIENT SIMULATION) ---
      setIsConnected(false);
      
      const nextSimState = simulateStep(simStateRef.current);
      simStateRef.current = nextSimState;

      setAqi(nextSimState.aqi);
      setSensorData(nextSimState.sensorData);
      setBlockchainState(nextSimState.blockchain);
      
      // Try prediction with simulated data
      const predictedVal = await predictNextHourAQI(
        nextSimState.sensorData.temperature,
        nextSimState.sensorData.humidity,
        nextSimState.sensorData.pm25,
        nextSimState.sensorData.gas
      );
      
      if (predictedVal !== null) {
        setAiPrediction(predictedVal);
      }
    }
  };

  // --- CHART UPDATE LOOP ---
  useEffect(() => {
    const chartInterval = setInterval(() => {
      setChartData(prev => {
        const newData = [...prev];
        const lastIdx = newData.length - 1;
        const lastItem = newData[lastIdx];
        
        if (lastItem && lastItem.predicted !== null) {
           const updatedItem = { ...lastItem };
           const target = aiPrediction || updatedItem.predicted; 
           const noise = (Math.random() - 0.5) * 2;
           
           updatedItem.predicted = Math.max(0, Number((target + noise).toFixed(1)));
           newData[lastIdx] = updatedItem;
        }
        return newData;
      });
    }, 1000);
    return () => clearInterval(chartInterval);
  }, [aiPrediction]);

  // --- MAIN DATA LOOP ---
  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="min-h-screen font-sans text-slate-200 selection:bg-emerald-500/30 selection:text-emerald-200 flex flex-col overflow-hidden relative">
      
      <AmbientBackground />

      <Header 
        isConnected={isConnected} 
        currentView={currentView}
        onNavigate={setCurrentView}
      />

      <main className="flex-1 flex flex-col relative z-10 w-full max-w-7xl mx-auto pt-24 pb-8 px-4 lg:px-8">
        
        {currentView === 'live' && (
            <div className="flex-1 flex flex-col lg:flex-row w-full h-full gap-8">
                {/* Left Column */}
                <div className="lg:w-5/12 flex flex-col justify-center space-y-8">
                  <div>
                    <h1 className="text-5xl lg:text-7xl font-light tracking-tight text-white mb-4 leading-tight">
                      Secure <br />
                      <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
                        Intelligent
                      </span> <br />
                      Monitoring
                    </h1>
                    <p className="text-lg text-slate-400 max-w-md font-light leading-relaxed">
                      AIRLUME is a decentralized protocol empowering sensors to stream validated environmental data via the Cardano blockchain.
                    </p>
                  </div>

                  <div className="w-full max-w-md">
                     <BlockchainStatus state={blockchainState} />
                  </div>
                </div>

                {/* Right Column (Dashboard) */}
                <div className="lg:w-7/12 space-y-6">
                   
                   {/* Gauge & Alerts */}
                   <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1 flex flex-col gap-4">
                        <AQIGauge value={aqi} prediction={predictionTrend} />
                        
                        {/* AI PREDICTION DISPLAY */}
                        {aiPrediction !== null && !predictionError && (
                          <div className="bg-slate-800/50 backdrop-blur-md border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between shadow-lg">
                              <div className="flex items-center gap-3">
                                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                                      <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
                                  </div>
                                  <div>
                                      <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">AI Forecast (1hr)</div>
                                      <div className="text-sm text-slate-300">ML Model Prediction</div>
                                  </div>
                              </div>
                              <div className="text-2xl font-bold text-white">
                                  {Math.round(aiPrediction)} 
                                  <span className="text-sm font-normal text-slate-400 ml-1">AQI</span>
                              </div>
                          </div>
                        )}

                        {/* Error State */}
                        {predictionError && (
                          <div className="bg-slate-800/50 backdrop-blur-md border border-amber-500/20 rounded-xl p-4">
                              <div className="text-xs text-amber-400 uppercase tracking-wider font-semibold">⚠️ Prediction Service Offline</div>
                              <div className="text-sm text-slate-400 mt-1">Check Flask server on port 5000</div>
                          </div>
                        )}

                      </div>
                      <div className="flex-1">
                         <AlertsPanel alerts={alerts} />
                      </div>
                   </div>

                   <SensorGrid data={sensorData} />
                   
                   <PredictionChart data={chartData} />
                </div>
            </div>
        )}

        {currentView !== 'live' && (
          <div className="flex items-center justify-center h-full text-slate-500">
             <div className="text-center">
                <MapPin className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>View "{currentView}" is under construction</p>
             </div>
          </div>
        )}

      </main>

      <button 
        onClick={() => setIsAiOpen(!isAiOpen)}
        className="fixed bottom-8 right-8 z-50 flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full border border-white/20 transition-all duration-300 hover:scale-110 active:scale-95 group"
        style={{ boxShadow: '0 0 30px rgba(16,185,129,0.4)' }}
      >
        <BrainCircuit className="w-8 h-8 text-white group-hover:animate-pulse" />
      </button>

      <MasumiAI 
        isOpen={isAiOpen} 
        onClose={() => setIsAiOpen(false)} 
        aqi={aqi}
        sensorData={sensorData}
      />
    </div>
  );
};

export default App;