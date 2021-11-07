import { SETTINGS } from '../SETTINGS';
import { Player } from './player.class';

export enum CollusionType {
  NO_COLLUSION = -1,
  VERTICAL = 1,
  HORIZONTAL = 2,
}

export class Ball {
  private x: number;

  private y: number;

  private width: number;

  private height: number;

  private players: Player[];

  private dx: number;

  private dy: number;

  private speed: number;

  constructor(player1: Player, player2: Player) {
    this.x = (SETTINGS.WIDTH - SETTINGS.BALL.WIDTH) / 2;
    this.y = (SETTINGS.HEIGHT - SETTINGS.BALL.HEIGHT) / 2;
    this.width = SETTINGS.BALL.WIDTH;
    this.height = SETTINGS.BALL.HEIGHT;
    this.players = [player1, player2];
    this.dx = 1;
    this.dy = 1;
    this.speed = 2;
  }

  getStatus() {
    return {
      type: 'ball',
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  update() {
    this.x += this.dx * this.speed;
    this.y += this.dy * this.speed;

    if (this.x <= -this.width * 2) {
      // TODO : 점수 올리기
      this.dx = Math.abs(this.dx);
      this.initialize();
    }

    if (this.x >= SETTINGS.WIDTH + this.width) {
      // TODO : 점수 올리기
      this.dx = -Math.abs(this.dx);
      this.initialize();
    }

    if (this.y <= 0) {
      this.dy = Math.abs(this.dy);
    }
    if (this.y + this.height >= SETTINGS.HEIGHT) {
      this.dy = -Math.abs(this.dy);
    }

    this.players.forEach((player) => {
      const playerStatus = player.getStatus();
      const collusionType = this.ballCollusionCheck(
        playerStatus,
        this.dx * this.speed,
      );
      switch (collusionType) {
        case CollusionType.VERTICAL:
          this.dy = this.bounce(
            this.y + this.height / 2,
            playerStatus.y + playerStatus.height / 2,
            this.dy,
          );
          break;
        case CollusionType.HORIZONTAL:
          this.dx = this.bounce(
            this.x + this.width / 2,
            playerStatus.x + playerStatus.width / 2,
            this.dx,
          );
          break;
        default:
          break;
      }
    });
  }

  private initialize() {
    this.x = (SETTINGS.WIDTH - SETTINGS.BALL.WIDTH) / 2;
    this.y = (SETTINGS.HEIGHT - SETTINGS.BALL.HEIGHT) / 2;
  }

  private bounce(x: number, y: number, v: number) {
    return x < y ? -Math.abs(v) : Math.abs(v);
  }

  private pointSquareCollusionCheck(x: number, y: number, playerStatus: any) {
    if (
      x >= playerStatus.x &&
      x <= playerStatus.x + playerStatus.width &&
      y >= playerStatus.y &&
      y <= playerStatus.y + playerStatus.height
    ) {
      return true;
    }
    return false;
  }

  private ballCollusionCheck(playerStatus: any, dx: number) {
    if (this.pointSquareCollusionCheck(this.x, this.y, playerStatus)) {
      return this.pointSquareCollusionCheck(this.x - dx, this.y, playerStatus)
        ? CollusionType.VERTICAL
        : CollusionType.HORIZONTAL;
    }
    if (
      this.pointSquareCollusionCheck(this.x + this.width, this.y, playerStatus)
    ) {
      return this.pointSquareCollusionCheck(
        this.x - dx + this.width,
        this.y,
        playerStatus,
      )
        ? CollusionType.VERTICAL
        : CollusionType.HORIZONTAL;
    }
    if (
      this.pointSquareCollusionCheck(this.x, this.y + this.height, playerStatus)
    ) {
      return this.pointSquareCollusionCheck(
        this.x - dx,
        this.y + this.height,
        playerStatus,
      )
        ? CollusionType.VERTICAL
        : CollusionType.HORIZONTAL;
    }
    if (
      this.pointSquareCollusionCheck(
        this.x + this.width,
        this.y + this.height,
        playerStatus,
      )
    ) {
      return this.pointSquareCollusionCheck(
        this.x - dx + this.width,
        this.y + this.height,
        playerStatus,
      )
        ? CollusionType.VERTICAL
        : CollusionType.HORIZONTAL;
    }
    return CollusionType.NO_COLLUSION;
  }
}
