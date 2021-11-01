import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DM } from 'src/entities/DM';
import { User } from 'src/entities/User';
import { MainEventsGateway } from 'src/events/main-events.gateway';
import { DmService } from './dm.service';

const mockUserRepository = () => ({
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  softDelete: jest.fn(),
});

const mockDMRepository = () => ({
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  softDelete: jest.fn(),
});

describe('DmService', () => {
  let service: DmService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DmService,
        MainEventsGateway,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository(),
        },
        {
          provide: getRepositoryToken(DM),
          useValue: mockDMRepository(),
        },
      ],
    }).compile();

    service = module.get<DmService>(DmService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
