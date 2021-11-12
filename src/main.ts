import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import * as cookieParser from 'cookie-parser';
import * as helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './http-exception.filter';

declare const module: any;
// somewhere in your initialization file

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors();
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      // ref: https://darrengwon.tistory.com/848
      whitelist: true, // decorator(@)가 없는 속성이 들어오면 해당 속성은 제거하고 받아들입니다.
      forbidNonWhitelisted: true, // DTO에 정의되지 않은 값이 넘어오면 request 자체를 막습니다.
      transform: true, // 클라이언트에서 값을 받자마자 타입을 정의한대로 자동 형변환을 합니다.
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  app.useStaticAssets(join(__dirname, '..', 'image'));

  const config = new DocumentBuilder()
    .setTitle('Pong Game API')
    .setDescription('Pong Game 개발을 위한 API 문서입니다.')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.use(cookieParser());

  // admin 로그인용 module
  // app.use(
  //   session({
  //     resave: false,
  //     saveUninitialized: false,
  //     secret: 'abcd',
  //     cookie: {
  //       httpOnly: true,
  //     },
  //   }),
  // );
  // app.use(passport.initialize());
  // app.use(passport.session());

  await app.listen(process.env.BACK_PORT);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
