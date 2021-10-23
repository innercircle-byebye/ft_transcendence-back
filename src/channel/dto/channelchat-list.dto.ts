import { ApiProperty, OmitType } from '@nestjs/swagger';
import { ChannelChat } from 'src/entities/ChannelChat';
import { Column } from 'typeorm';

export class ChannelChatListDto extends OmitType(ChannelChat, ['user']) {
  // TODO: user 오브젝트 담고 있는 형태로 변경 필요
  @ApiProperty({
    description: '프로필 이미지 경로',
    required: true,
  })
  @Column('varchar', { name: 'image_path', length: 200, unique: true })
  imagePath: string;

  @ApiProperty({
    description: '사용자 닉네임',
    example: '퐁게임너무재미있네',
    required: true,
  })
  @Column('varchar', { name: 'nickname', length: 50 })
  nickname: string;
}
