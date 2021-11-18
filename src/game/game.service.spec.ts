import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DmService } from 'src/dm/dm.service';
import { GameMember } from 'src/entities/GameMember';
import { GameResult } from 'src/entities/GameResult';
import { GameRoom } from 'src/entities/GameRoom';
import { User } from 'src/entities/User';
import { RoomManagerService } from 'src/events/game/services/room-manager.service';
import { Connection } from 'typeorm';
import { GameService } from './game.service';

const mockUserRepository = () => ({
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  softDelete: jest.fn(),
});

const mockGameRoomRepository = () => ({
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  softDelete: jest.fn(),
});

const mockGameMemberRepository = () => ({
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  softDelete: jest.fn(),
});

const mockGameResultRepository = () => ({
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  softDelete: jest.fn(),
});

const mockConnection = () => ({
  transaction: jest.fn(),
});

const mockDmService = () => ({
  transaction: jest.fn(),
});

const mockRoomManagerService = () => ({
  transaction: jest.fn(),
});

describe('GameService', () => {
  let service: GameService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository(),
        },
        {
          provide: getRepositoryToken(GameRoom),
          useValue: mockGameRoomRepository(),
        },
        {
          provide: getRepositoryToken(GameMember),
          useValue: mockGameMemberRepository(),
        },
        {
          provide: getRepositoryToken(GameResult),
          useValue: mockGameResultRepository(),
        },
        {
          provide: Connection,
          useFactory: mockConnection,
        },
        {
          provide: DmService,
          useFactory: mockDmService,
        },
        {
          provide: RoomManagerService,
          useFactory: mockRoomManagerService,
        },
      ],
    }).compile();

    service = module.get<GameService>(GameService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
