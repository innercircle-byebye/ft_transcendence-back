import { Test, TestingModule } from '@nestjs/testing';
import { MainEventsGateway } from './main-events.gateway';

describe('MainEventsGateway', () => {
  let gateway: MainEventsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MainEventsGateway],
    }).compile();

    gateway = module.get<MainEventsGateway>(MainEventsGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
