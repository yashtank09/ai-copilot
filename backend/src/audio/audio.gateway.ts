import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GeminiService } from './gemini.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AudioGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly geminiService: GeminiService) {}

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('audio_chunk')
  async handleAudioChunk(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`Received request from ${client.id} - Provider: ${data.provider}`);
    
    // Process through the new GeminiService
    const insightResponse = await this.geminiService.generateDynamicContent({
      text: data.payload,
      mode: data.mode,
      apiKey: data.apiKey,
      model: data.model
    });
    
    client.emit('ai_insight', {
      type: 'ai_insight',
      insight_type: data.mode || 'general',
      content: insightResponse,
      confidence: 0.99,
    });
  }
}
