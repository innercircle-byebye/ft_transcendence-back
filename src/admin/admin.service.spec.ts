import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Announcement } from 'src/entities/Announcement';
import { Connection } from 'typeorm';
import { AdminService } from './admin.service';

const mockAnnouncementRepository = () => ({
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  softDelete: jest.fn(),
});

const mockConnection = () => ({
  transaction: jest.fn(),
});

describe('AdminService', () => {
  let service: AdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: getRepositoryToken(Announcement),
          useValue: mockAnnouncementRepository(),
        },
        {
          provide: Connection,
          useFactory: mockConnection,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
