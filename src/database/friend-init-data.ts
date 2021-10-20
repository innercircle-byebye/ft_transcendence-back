import { FriendStatus } from 'src/entities/Friend';

const friendInitData = [
  {
    requesterId: 3,
    respondentId: 1,
    status: FriendStatus.WAIT,
  },
  {
    requesterId: 4,
    respondentId: 1,
    status: FriendStatus.WAIT,
  },
  {
    requesterId: 1,
    respondentId: 5,
    status: FriendStatus.APPROVE,
  },
  {
    requesterId: 1,
    respondentId: 6,
    status: FriendStatus.REJECT,
  },
  {
    requesterId: 7,
    respondentId: 1,
    status: FriendStatus.REJECT,
  },
  {
    requesterId: 8,
    respondentId: 1,
    status: FriendStatus.REJECT,
  },
];

export { friendInitData };
