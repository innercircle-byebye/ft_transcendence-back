import { GameMemberStatus } from 'src/entities/GameMember';
import { BallSpeed } from 'src/entities/GameResult';

const GameRoomInitData = [
  {
    gameRoomId: 1,
    title: '게임방 1--player1만 있음 (관전 수용인원 0)',
    password: null,
    maxParticipantNum: 2,
  },
  {
    gameRoomId: 2,
    title: '게임방 2--player 1, 2만 있음 (관전 수용인원 0)',
    password: null,
    maxParticipantNum: 2,
  },
  {
    gameRoomId: 3,
    title: '게임방 3--player 1, 2만 있음 (관전 수용인원 2)',
    password: null,
    maxParticipantNum: 4,
  },
  {
    gameRoomId: 4,
    title: '게임방 4 -- 수용인원 꽉참 (player1, player2, 관전 수용인원 2)',
    password: null,
    maxParticipantNum: 4,
  },
  {
    gameRoomId: 5,
    title: '게임방 5--비밀번호 테스트',
    password: '$2a$12$tzssFSe5ixvQ/2/nggDsRefJHpJk/QkQLwS8o5NFM9jJ676CmCjmy',
    maxParticipantNum: 8,
  },
  {
    gameRoomId: 6,
    title: '게임방 6--playable 테스트',
    password: null,
    maxParticipantNum: 8,
  },
  {
    gameRoomId: 7,
    title: '게임방 7--playable 테스트 ',
    password: null,
    maxParticipantNum: 10,
  },
];

const GameMemberInitData = [
  {
    gameRoomId: 1,
    userId: 1,
    status: GameMemberStatus.PLAYER_ONE,
  },
  {
    gameRoomId: 2,
    userId: 2,
    status: GameMemberStatus.PLAYER_ONE,
  },
  {
    gameRoomId: 2,
    userId: 3,
    status: GameMemberStatus.PLAYER_TWO,
  },
  {
    gameRoomId: 3,
    userId: 4,
    status: GameMemberStatus.PLAYER_ONE,
  },
  {
    gameRoomId: 3,
    userId: 5,
    status: GameMemberStatus.PLAYER_TWO,
  },
  {
    gameRoomId: 4,
    userId: 6,
    status: GameMemberStatus.PLAYER_ONE,
  },
  {
    gameRoomId: 4,
    userId: 7,
    status: GameMemberStatus.PLAYER_TWO,
  },
  {
    gameRoomId: 4,
    userId: 8,
    status: GameMemberStatus.OBSERVER,
  },
  {
    gameRoomId: 4,
    userId: 9,
    status: GameMemberStatus.OBSERVER,
  },
  {
    gameRoomId: 6,
    userId: 12,
    status: GameMemberStatus.PLAYER_ONE,
  },
  {
    gameRoomId: 7,
    userId: 13,
    status: GameMemberStatus.PLAYER_ONE,
  },
];

const GameResultInitData = [
  {
    gameRoomId: 1,
    playerOneId: 1,
    playerTwoId: null,
    playerOneScore: null,
    playerTwoScore: null,
    winPoint: 10,
    ballSpeed: BallSpeed.MEDIUM,
    startAt: null,
    endAt: null,
  },
  {
    gameRoomId: 2,
    playerOneId: 2,
    playerTwoId: 3,
    playerOneScore: 10,
    playerTwoScore: 8,
    winPoint: 10,
    ballSpeed: BallSpeed.MEDIUM,
    startAt: new Date('2021-11-04T00:00:00.000+09:00').toLocaleString('en-US', {
      timeZone: 'Asia/Seoul',
    }),
    endAt: new Date('2021-11-04T00:10:00.000+09:00').toLocaleString('en-US', {
      timeZone: 'Asia/Seoul',
    }),
  },
  {
    gameRoomId: 2,
    playerOneId: 2,
    playerTwoId: 3,
    playerOneScore: 10,
    playerTwoScore: 7,
    winPoint: 10,
    ballSpeed: BallSpeed.MEDIUM,
    startAt: new Date('2021-11-04 00:50:00.000'),
    endAt: new Date('2021-11-04 00:55:00.000'),
  },
  {
    gameRoomId: 2,
    playerOneId: 2,
    playerTwoId: 3,
    playerOneScore: 4,
    playerTwoScore: 9,
    winPoint: 9,
    ballSpeed: BallSpeed.MEDIUM,
    startAt: new Date('2021-11-04 00:50:00.000'),
    endAt: new Date('2021-11-04 00:55:00.000'),
  },
  {
    gameRoomId: 2,
    playerOneId: 2,
    playerTwoId: 3,
    playerOneScore: 14,
    playerTwoScore: 10,
    winPoint: 15,
    ballSpeed: BallSpeed.MEDIUM,
    startAt: new Date('2021-11-04 01:00:00.000'),
    endAt: null,
  },
  {
    gameRoomId: 3,
    playerOneId: 4,
    playerTwoId: 5,
    playerOneScore: 7,
    playerTwoScore: 7,
    winPoint: 10,
    ballSpeed: BallSpeed.FAST,
    startAt: new Date('2021-11-04 01:00:00.000'),
    endAt: null,
  },
  {
    gameRoomId: 4,
    playerOneId: 6,
    playerTwoId: 7,
    playerOneScore: null,
    playerTwoScore: null,
    winPoint: 8,
    ballSpeed: BallSpeed.SLOW,
    startAt: null,
    endAt: null,
  },
  {
    gameRoomId: 6,
    playerOneId: 12,
    playerTwoId: null,
    playerOneScore: null,
    playerTwoScore: null,
    winPoint: 8,
    ballSpeed: BallSpeed.SLOW,
    startAt: null,
    endAt: null,
  },
  {
    gameRoomId: 7,
    playerOneId: 13,
    playerTwoId: null,
    playerOneScore: null,
    playerTwoScore: null,
    winPoint: 8,
    ballSpeed: BallSpeed.SLOW,
    startAt: null,
    endAt: null,
  },
];

export { GameRoomInitData, GameMemberInitData, GameResultInitData };
