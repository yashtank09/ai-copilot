import { Module } from '@nestjs/common';
import { AudioGateway } from './audio.gateway';
import { GeminiService } from './gemini.service';

@Module({
  providers: [AudioGateway, GeminiService],
})
export class AudioModule {}
