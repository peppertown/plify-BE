import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO에 정의되지 않은 값 제거
      forbidNonWhitelisted: true, // DTO에 없는 값이 들어오면 에러
      transform: true, // 자동 타입 변환
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter(configService));

  const config = new DocumentBuilder()
    .setTitle('Plify API')
    .setDescription('Plify 프로젝트 API 문서입니다.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = configService.get<number>('port');
  await app.listen(port);
}
bootstrap();
