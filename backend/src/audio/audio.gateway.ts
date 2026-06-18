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

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AudioGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('audio_chunk')
  handleAudioChunk(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    // Basic mock handling of an audio chunk from Desktop App
    // We would buffer this or send to a transcription service
    console.log(`Received audio from ${client.id}`);
    
    // Echo back a mock AI response for now to test end-to-end
    client.emit('ai_insight', {
      type: 'ai_insight',
      insight_type: 'answer_suggestion',
      content: 'Mock AI: I am listening to the meeting! This is a test response.',
      confidence: 0.99,
    });
  }
}
