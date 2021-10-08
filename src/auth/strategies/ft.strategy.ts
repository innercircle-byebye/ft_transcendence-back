import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-oauth2';
import { lastValueFrom, map } from 'rxjs';

@Injectable()
export class FtStrategy extends PassportStrategy(Strategy, 'ft') {
  constructor(private httpService: HttpService) {
    super({
      authorizationURL: process.env.FT_AUTHORIZATION_URL,
      tokenURL: process.env.FT_TOKEN_URL,
      clientID: process.env.FT_CLIENT_ID,
      clientSecret: process.env.FT_CLIENT_SECRET,
      callbackURL: process.env.FT_CALLBACK_URL,
      scope: 'public',
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    cb: VerifyCallback,
  ): Promise<any> {
    // https://stackoverflow.com/questions/69139950/how-to-use-axios-httpservice-from-nest-js-to-make-a-post-request
    const data = await lastValueFrom(
      this.httpService
        .get('https://api.intra.42.fr/v2/me', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        .pipe(map((response) => response.data)),
    );

    const user = {
      id: data.id,
      email: data.email,
      intraId: data.login,
      imageUrl: data.image_url,
    };
    cb(null, user);
  }
}
