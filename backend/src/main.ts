// main.ts — the entry point. This boots the NestJS app and starts the HTTP server.
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { mkdirSync } from 'fs';
import cookieParser = require('cookie-parser');
import helmet from 'helmet';
import { AppModule } from './app.module';
import { getUploadDir } from './modules/uploads/uploads.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Security headers (X-Content-Type-Options, X-Frame-Options, HSTS, etc.) on
  // every response. CSP is off by default here -- this API mostly returns
  // JSON, and the one HTML-adjacent surface (the /files/ static route below)
  // is just serving uploaded images, not pages that need a content policy.
  app.use(helmet({ contentSecurityPolicy: false,  crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.use(cookieParser());
  app.enableCors({ origin: process.env.FRONTEND_URL, credentials: true });

  // Serve uploaded images publicly at  http://<api>/files/<name>
  const uploadDir = getUploadDir();
  mkdirSync(uploadDir, { recursive: true });
  app.useStaticAssets(uploadDir, {
    prefix: '/files/',
    index: false,
    maxAge: '7d',
    setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
}
bootstrap();