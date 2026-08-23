import { ValidationPipe } from '@nestjs/common';

export const VALIDATION_PIPE = new ValidationPipe({
  whitelist: true,
  transform: true,
  forbidUnknownValues: true,
  forbidNonWhitelisted: true,
});
