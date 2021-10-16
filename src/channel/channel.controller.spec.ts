import { Test, TestingModule } from '@nestjs/testing';
import { ChannelController } from './channel.controller';
import { ChannelService } from './channel.service';

class MockChannelService {}
describe('ChannelController', () => {
  let controller: ChannelController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChannelController],
      providers: [{ provide: ChannelService, useClass: MockChannelService }],
    }).compile();

    controller = module.get<ChannelController>(ChannelController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
