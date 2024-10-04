import './App.css';
import { useEffect, useRef, useState } from 'react';

function App() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [clientId, setClientId] = useState(''); // State to hold the clientId
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket('ws://54.204.175.124:6060');

    ws.current.onopen = () => {
      console.log('Conectado al servidor WebSocket');
    };

    ws.current.onerror = error => {
      console.error('Error de WebSocket:', error);
    };

    ws.current.onmessage = event => {
      const message = JSON.parse(event.data);

      // Check if the message contains the clientId
      if (message.clientId) {
        setClientId(message.clientId); // Store the clientId
        console.log(`Client ID received: ${message.clientId}`); // Log the clientId
      } else {
        // If it's not the clientId message, treat it as a regular message
        setMessages(prev => [...prev, message]);
      }
    };

    return () => {
      ws.current.close();
    };
  }, []);

  const sendMessage = () => {
    if (inputText && recipientId) {
      ws.current.send(JSON.stringify({ recipientId, text: inputText }));
      setInputText('');
    }
  };

  return (
    <div className="App">
      <h1>Chat-WebSocket</h1>
      <h2>Your Client ID: {clientId}</h2> {/* Display the client ID */}
      <input
        type="text"
        placeholder="ID del destinatario"
        value={recipientId}
        onChange={e => setRecipientId(e.target.value)}
      />
      <input
        type="text"
        placeholder="Mensaje"
        value={inputText}
        onChange={e => setInputText(e.target.value)}
      />
      <button onClick={sendMessage}>Enviar</button>
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>Cliente {msg.senderId}:</strong> {msg.text}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
