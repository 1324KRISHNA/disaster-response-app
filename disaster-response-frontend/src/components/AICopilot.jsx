import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Command, Loader2 } from 'lucide-react';
import { useIncidents } from '../context/IncidentContext';

export default function AICopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Command AI online. How can I assist you with the current disaster data?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { incidents } = useIncidents();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const generateAIResponse = (userText) => {
    const text = userText.toLowerCase();
    const criticalCount = incidents.filter(i => i.severity === 'CRITICAL').length;
    const warningCount = incidents.filter(i => i.severity === 'WARNING').length;

    // Advanced dynamic parsing
    if (text.includes('closest') || text.includes('nearest')) {
      const type = text.includes('fire') ? 'wildfire' : text.includes('flood') ? 'flood' : 'incident';
      const targets = incidents.filter(i => i.type.toLowerCase().includes(type));
      if (targets.length > 0) {
        return `Based on live geospatial data, the nearest ${type} is located at coordinates (${targets[0].lat.toFixed(4)}, ${targets[0].lng.toFixed(4)}). I recommend dispatching resources immediately using the map interface.`;
      }
      return `I don't see any active ${type}s in the current telemetry data.`;
    } 
    
    if (text.includes('summary') || text.includes('status') || text.includes('overview')) {
      return `Command Center Status: We are currently tracking ${incidents.length} active anomalies. ${criticalCount} are marked CRITICAL, requiring immediate attention, and ${warningCount} are WARNING level. Multi-agency dispatch is available.`;
    } 
    
    if (text.includes('evacuate') || text.includes('evacuation')) {
      return `To initialize an evacuation sequence, select the incident on the live map and click "Generate Evacuation Route". The routing engine will automatically chart a path to the nearest safe shelter avoiding known hazards.`;
    }
    
    if (text.includes('forecast') || text.includes('predict')) {
      return `Our LSTM predictive models are online. Use the timeline slider at the bottom of the dashboard to visualize the projected spread of wildfires and floods up to +24 hours into the future.`;
    }

    if (text.includes('weather') || text.includes('wind') || text.includes('rain')) {
       return `I am actively pulling data from Open-Meteo. Click on any incident marker on the map to see localized wind speeds, direction, and precipitation data which are crucial for predictive spread.`;
    }

    return `I am processing your query against ${incidents.length} active data points. My simulated NLP is optimized for tactical queries: try asking about "closest floods", "evacuation", "status summary", or "predictive forecast".`;
  };

  const streamResponse = async (text) => {
    setIsTyping(true);
    // Simulate network delay
    await new Promise(r => setTimeout(r, 600));
    setIsTyping(false);
    
    const words = text.split(' ');
    setMessages(prev => [...prev, { role: 'ai', text: '' }]);
    
    for (let i = 0; i < words.length; i++) {
      await new Promise(r => setTimeout(r, 40)); // typing speed
      setMessages(prev => {
        const newMsg = [...prev];
        const lastMsg = newMsg[newMsg.length - 1];
        lastMsg.text += (i === 0 ? '' : ' ') + words[i];
        return newMsg;
      });
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    const aiReplyText = generateAIResponse(userMessage.text);
    streamResponse(aiReplyText);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="glass-button"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '28px',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          background: 'linear-gradient(135deg, var(--accent-blue), #1e3a8a)',
          border: 'none'
        }}
      >
        <Command size={24} color="white" />
      </button>
    );
  }

  return (
    <div className="glass-panel" style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      width: '350px',
      height: '500px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 10px 40px rgba(0,0,0,0.7)',
      animation: 'slideUp 0.3s ease-out'
    }}>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bot size={20} color="var(--accent-blue)" />
          <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)' }}>Command Copilot</h3>
        </div>
        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <X size={20} />
        </button>
      </div>
      
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            background: m.role === 'user' ? 'var(--accent-blue)' : 'rgba(255,255,255,0.1)',
            padding: '10px 14px',
            borderRadius: '12px',
            borderBottomRightRadius: m.role === 'user' ? '4px' : '12px',
            borderBottomLeftRadius: m.role === 'ai' ? '4px' : '12px',
            maxWidth: '85%',
            fontSize: '13px',
            color: '#fff',
            lineHeight: 1.4
          }}>
            {m.text}
          </div>
        ))}
        {isTyping && (
          <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.1)', padding: '10px 14px', borderRadius: '12px', borderBottomLeftRadius: '4px' }}>
            <Loader2 size={16} className="spin" color="var(--accent-blue)" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} style={{ padding: '12px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '8px' }}>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Copilot..."
          className="glass-input"
          style={{ flex: 1, padding: '10px 12px', fontSize: '13px', margin: 0 }}
        />
        <button type="submit" disabled={!input.trim() || isTyping} className="glass-button" style={{ padding: '10px', width: 'auto' }}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
