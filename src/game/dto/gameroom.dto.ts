// import { ApiProperty, OmitType } from '@nestjs/swagger';
import { GameRoom } from 'src/entities/GameRoom';

export class GameRoomDto extends GameRoom {
  // @ApiProperty({
  //   type: 'object',
  //   properties: {
  //     imagePath: {
  //       type: 'string',
  //       example: 'https://picsum.photos/id/10/500/500',
  //     },
  //     nickname: {
  //       type: 'string',
  //       example: 'temp1',
  //     },
  //   },
  // })
  // user: Map<string, string>;
}
