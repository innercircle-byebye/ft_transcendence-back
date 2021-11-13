import { Test, TestingModule } from '@nestjs/testing';
import { GameEventsGateway } from './game-events.gateway';
import { GameEventsService } from './game-events.service';
import { RoomManagerService } from './game/services/room-manager.service';

class MockService {}

describe('GameEventsGateway', () => {
  let gateway: GameEventsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameEventsGateway,
        { provide: RoomManagerService, useClass: MockService },
        { provide: GameEventsService, useClass: MockService },
      ],
    }).compile();

    gateway = module.get<GameEventsGateway>(GameEventsGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
