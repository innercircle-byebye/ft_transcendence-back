import { Test, TestingModule } from '@nestjs/testing';
import { GameEventsGateway } from './game-events.gateway';
import { RoomManagerService } from './game/services/room-manager.service';

class MockRoomManagerService {}

describe('GameEventsGateway', () => {
  let gateway: GameEventsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameEventsGateway,
        { provide: RoomManagerService, useClass: MockRoomManagerService },
      ],
    }).compile();

    gateway = module.get<GameEventsGateway>(GameEventsGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
