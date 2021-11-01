import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Channel } from 'src/entities/Channel';
import { ChannelChat } from 'src/entities/ChannelChat';
import { ChannelMember } from 'src/entities/ChannelMember';
import { User } from 'src/entities/User';
import { EventsGateway } from 'src/events/events.gateway';
import { Connection } from 'typeorm';
import { ChannelService } from './channel.service';

const mockUserRepository = () => ({
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  softDelete: jest.fn(),
});

const mockChannelRepository = () => ({
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  softDelete: jest.fn(),
});

const mockChannelChatRepository = () => ({
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  softDelete: jest.fn(),
});

const mockChannelMemberRepository = () => ({
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  softDelete: jest.fn(),
});

const mockConnection = () => ({
  transaction: jest.fn(),
});

const mockGateway = () => ({
  transaction: jest.fn(),
});

const mockEmitter = () => ({
  transaction: jest.fn(),
});

describe('ChannelService', () => {
  let service: ChannelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository(),
        },
        {
          provide: getRepositoryToken(Channel),
          useValue: mockChannelRepository(),
        },
        {
          provide: getRepositoryToken(ChannelChat),
          useValue: mockChannelChatRepository(),
        },
        {
          provide: getRepositoryToken(ChannelMember),
          useValue: mockChannelMemberRepository(),
        },
        {
          provide: Connection,
          useFactory: mockConnection,
        },
        {
          provide: EventsGateway,
          useFactory: mockGateway,
        },
        {
          provide: EventEmitter2,
          useFactory: mockEmitter,
        },
      ],
    }).compile();

    service = module.get<ChannelService>(ChannelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
