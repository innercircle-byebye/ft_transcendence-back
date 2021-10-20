import {
  koreanTempOne,
  koreanTempThree,
  koreanTempTwo,
  loremIpsumOne,
  loremIpsumThree,
  loremIpsumTwo,
} from './announcement-temp';

const announcementInitData = [
  {
    adminId: 1,
    title: '공지사항 제목 1',
    content: loremIpsumOne,
  },
  {
    adminId: 1,
    title: '공지사항 제목 2 공지사항 제목 2',
    content: loremIpsumTwo,
  },
  {
    adminId: 2,
    title: '공지사항 제목 3 공지사항 제목 3 공지사항 제목 3',
    content: loremIpsumThree,
  },
  {
    adminId: 3,
    title: '공지사항 제목 4 공지사항 제목 4 공지사항 제목 4 공지사항 제목 4',
    content: koreanTempOne,
  },
  {
    adminId: 2,
    title:
      '공지사항 제목 5 공지사항 제목 5 공지사항 제목 5 공지사항 제목 5 공지사항 제목 5',
    content: koreanTempTwo,
  },
  {
    adminId: 2,
    title:
      '공지사항 제목 6 공지사항 제목 6 공지사항 제목 6 공지사항 제목 6 공지사항 제목 6 공지사항 제목 6',
    content: koreanTempThree,
  },
];

export { announcementInitData };
