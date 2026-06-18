import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import "./App.css";

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    // Connect to NestJS backend
    const newSocket = io("http://localhost:3000");
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to backend");
    });

    newSocket.on("ai_insight", (data: any) => {
      console.log("Received insight:", data);
      setMessages((prev) => [...prev, data.content]);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const toggleListening = async () => {
    if (isListening) {
      setIsListening(false);
      setMessages((prev) => [...prev, "System: Stopped listening."]);
    } else {
      setIsListening(true);
      setMessages((prev) => [...prev, "System: Started listening to meeting audio..."]);
      // Here we would invoke Rust audio capture if Rust was installed
      // await invoke("start_audio_capture");
      
      // Mock sending audio chunk to trigger backend response for now
      if (socket) {
        socket.emit("audio_chunk", { payload: "mock_base64_audio_data" });
      }
    }
  };

  return (
    <main className="container">
      <header className="header">
        <h1>🎙️ AI Meeting Copilot</h1>
        <button 
          className={`listen-btn ${isListening ? 'active' : ''}`}
          onClick={toggleListening}
        >
          {isListening ? 'Stop Copilot' : 'Start Copilot'}
        </button>
      </header>

      <div className="insights-container">
        <h2>Live Insights</h2>
        {messages.length === 0 ? (
          <p className="empty-state">Waiting for conversation...</p>
        ) : (
          <ul className="messages-list">
            {messages.map((msg, idx) => (
              <li key={idx} className="message-item">
                <span className="ai-icon">{msg.startsWith("System:") ? '⚙️' : '🤖'}</span>
                <p>{msg.replace("System: ", "")}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

export default App;
