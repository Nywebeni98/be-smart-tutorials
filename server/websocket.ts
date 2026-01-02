import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { dbStorage } from './dbStorage';
import type { InsertChatMessage } from '@shared/schema';

interface ConnectedClient {
  ws: WebSocket;
  email: string;
  userType: 'student' | 'tutor';
  tutorId?: string;
}

const clients: Map<string, ConnectedClient> = new Map();

export function setupWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws/chat' });

  wss.on('connection', (ws, req) => {
    console.log('[WebSocket] New connection attempt');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'auth':
            handleAuth(ws, message);
            break;
          case 'message':
            await handleMessage(ws, message);
            break;
          case 'typing':
            handleTyping(ws, message);
            break;
          case 'read':
            await handleReadReceipt(ws, message);
            break;
          default:
            console.log('[WebSocket] Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('[WebSocket] Error processing message:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      const entries = Array.from(clients.entries());
      for (const [key, client] of entries) {
        if (client.ws === ws) {
          console.log('[WebSocket] Client disconnected:', key);
          clients.delete(key);
          break;
        }
      }
    });

    ws.on('error', (error) => {
      console.error('[WebSocket] Connection error:', error);
    });
  });

  console.log('[WebSocket] Chat server initialized on /ws/chat');
  return wss;
}

function handleAuth(ws: WebSocket, message: { email: string; userType: 'student' | 'tutor'; tutorId?: string }) {
  const clientKey = `${message.email}-${message.userType}`;
  
  clients.set(clientKey, {
    ws,
    email: message.email,
    userType: message.userType,
    tutorId: message.tutorId,
  });

  console.log('[WebSocket] Client authenticated:', clientKey);
  ws.send(JSON.stringify({ type: 'auth_success', email: message.email }));
}

async function handleMessage(ws: WebSocket, message: {
  conversationId: string;
  senderType: 'student' | 'tutor';
  senderEmail: string;
  senderName: string;
  receiverEmail: string;
  content: string;
}) {
  try {
    const chatMessage: InsertChatMessage = {
      conversationId: message.conversationId,
      senderType: message.senderType,
      senderEmail: message.senderEmail,
      senderName: message.senderName,
      receiverEmail: message.receiverEmail,
      message: message.content,
    };

    const savedMessage = await dbStorage.createChatMessage(chatMessage);
    console.log('[WebSocket] Message saved:', savedMessage.id);

    const outgoingMessage = {
      type: 'new_message',
      message: savedMessage,
    };

    ws.send(JSON.stringify(outgoingMessage));

    const entries = Array.from(clients.entries());
    for (const [key, client] of entries) {
      if (client.email === message.receiverEmail && client.ws !== ws && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(outgoingMessage));
        console.log('[WebSocket] Message forwarded to:', key);
      }
    }
  } catch (error) {
    console.error('[WebSocket] Error saving message:', error);
    ws.send(JSON.stringify({ type: 'error', message: 'Failed to send message' }));
  }
}

function handleTyping(ws: WebSocket, message: { conversationId: string; senderEmail: string; receiverEmail: string }) {
  const entries = Array.from(clients.entries());
  for (const [, client] of entries) {
    if (client.email === message.receiverEmail && client.ws !== ws && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify({
        type: 'typing',
        conversationId: message.conversationId,
        senderEmail: message.senderEmail,
      }));
    }
  }
}

async function handleReadReceipt(ws: WebSocket, message: { conversationId: string; receiverEmail: string }) {
  try {
    await dbStorage.markMessagesAsRead(message.conversationId, message.receiverEmail);
    
    const entries = Array.from(clients.entries());
    for (const [, client] of entries) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify({
          type: 'messages_read',
          conversationId: message.conversationId,
        }));
      }
    }
  } catch (error) {
    console.error('[WebSocket] Error marking messages as read:', error);
  }
}
