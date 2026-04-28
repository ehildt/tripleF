import { MultipartValue } from '@fastify/multipart';
import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  Optional,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class MultipartFieldPipe implements PipeTransform<
  unknown,
  MultipartValue | undefined
> {
  constructor(@Optional() private required = true) {}

  transform(v: MultipartValue, metadata: ArgumentMetadata) {
    if (v == null) {
      if (!this.required) return undefined;
      throw new BadRequestException(`Invalid multipart field ${metadata.data}`);
    }
    return v;
  }
}
