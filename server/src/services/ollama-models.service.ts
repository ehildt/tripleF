import { CacheReturnValue } from '@ehildt/nestjs-config-factory/cache-return-value';
import { OllamaService } from '@ehildt/nestjs-ollama';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OllamaModelsService {
  constructor(private readonly ollamaService: OllamaService) {}

  @CacheReturnValue({ ttl: 1 })
  async getModels() {
    return this.ollamaService.list();
  }
}
