import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Block } from 'src/entities/Block';
import { Friend } from 'src/entities/Friend';
import { User } from 'src/entities/User';
import { RelationService } from './relation.service';

const mockUserRepository = () => ({
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  softDelete: jest.fn(),
});

const mockBlockRepository = () => ({
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  softDelete: jest.fn(),
});

const mockFriendRepository = () => ({
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  softDelete: jest.fn(),
});

describe('RelationService', () => {
  let service: RelationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RelationService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository(),
        },
        {
          provide: getRepositoryToken(Block),
          useValue: mockBlockRepository(),
        },
        {
          provide: getRepositoryToken(Friend),
          useValue: mockFriendRepository(),
        },
      ],
    }).compile();

    service = module.get<RelationService>(RelationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
