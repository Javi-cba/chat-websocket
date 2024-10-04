import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 8080;
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const clients = new Map();

// Middleware para parsear JSON
app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public'))); // Cambiado __dirname a process.cwd()

const sendClientList = () => {
  // Ahora accedemos correctamente al estado del cliente WebSocket
  const clientList = Array.from(clients).map(([clientId, client]) => ({
    clientId,
    readyState: client.readyState,
  }));
  const connectList = JSON.stringify({ clients: clientList });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(connectList);
    }
  });
};

app.get('/', (req, res) => {
  res.send('<h1>WebSocket Server Listo</h1>');
});

app.post('/send-message', (req, res) => {
  const { message, clientId } = req.body;
  if (!message || !clientId) {
    res.status(400).send({ status: 'Faltan datos' });
    return;
  }

  const client = clients.get(clientId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(message);
    res.send({ status: 'Mensaje enviado', message });
  } else {
    res.status(404).send({ status: 'Cliente no encontrado o no disponible' });
  }
});

wss.on('connection', ws => {
  const clientId = uuidv4(); // Generar un ID único para el cliente
  clients.set(clientId, ws);
  console.log(`Cliente conectado: ${clientId}`);

  // Enviar el ID del cliente al cliente conectado
  ws.send(JSON.stringify({ clientId }));
  sendClientList();

  ws.on('message', message => {
    const { recipientId, text } = JSON.parse(message);

    // Verifica que el mensaje tenga un destinatario y un texto
    if (recipientId && text) {
      const recipient = clients.get(recipientId);
      if (recipient && recipient.readyState === WebSocket.OPEN) {
        recipient.send(JSON.stringify({ senderId: clientId, text }));
      } else {
        console.log(
          `Destinatario ${recipientId} no encontrado o no disponible`
        );
      }
    } else {
      console.log('Mensaje recibido sin destinatario o texto.');
    }
  });

  ws.on('close', () => {
    clients.delete(clientId);
    sendClientList();
    console.log(`Cliente desconectado: ${clientId}`);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server WS en ws://localhost:${PORT}`);
});
