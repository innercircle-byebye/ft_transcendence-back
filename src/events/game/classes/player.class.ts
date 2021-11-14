import { SETTINGS } from '../SETTINGS';

export enum KeyCode {
  UP = 38,
  DOWN = 40,
}

const UNIT = 2;

export class Player {
  private userId: number;

  private role: string;

  private ready: boolean;

  private x: number;

  private y: number;

  private width: number;

  private height: number;

  private score: number;

  private keypress: {
    [KeyCode.UP]: boolean;
    [KeyCode.DOWN]: boolean;
  };

  constructor(userId: number, role: string) {
    this.userId = userId;
    this.role = role;
    this.ready = false;

    if (role === 'player1') {
      this.x = SETTINGS.PLAYER.GAP;
    } else {
      this.x = SETTINGS.WIDTH - SETTINGS.PLAYER.GAP - SETTINGS.PLAYER.WIDTH;
    }
    this.y = SETTINGS.HEIGHT / 2;

    this.width = SETTINGS.PLAYER.WIDTH;
    this.height = SETTINGS.PLAYER.HEIGHT;
    this.score = 0;

    this.keypress = {
      [KeyCode.UP]: false,
      [KeyCode.DOWN]: false,
    };
  }

  getStatus() {
    return {
      type: 'player',
      role: this.role,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      score: this.score,
    };
  }

  update(): void {
    if (this.keypress[KeyCode.UP]) {
      this.moveup();
    }
    if (this.keypress[KeyCode.DOWN]) {
      this.moveDown();
    }
  }

  changeRole(role: string) {
    if (role === 'player1') {
      this.x = SETTINGS.PLAYER.GAP;
    } else if (role === 'player2') {
      this.x = SETTINGS.WIDTH - SETTINGS.PLAYER.GAP - SETTINGS.PLAYER.WIDTH;
    }
    this.y = SETTINGS.HEIGHT / 2;
  }

  getUserId() {
    return this.userId;
  }

  getRole() {
    return this.role;
  }

  setKeyPress(keyCode: number, isDown: boolean) {
    if (keyCode === KeyCode.UP || keyCode === KeyCode.DOWN) {
      this.keypress[keyCode] = isDown;
    }
  }

  initPosition() {
    this.y = SETTINGS.HEIGHT / 2;
  }

  initScore() {
    this.score = 0;
  }

  increaseScore() {
    this.score += 1;
  }

  getScore() {
    return this.score;
  }

  setReady(value: boolean) {
    this.ready = value;
  }

  getReady() {
    return this.ready;
  }

  private moveup(): void {
    if (this.y - UNIT >= 0) {
      this.y -= UNIT;
    }
  }

  private moveDown(): void {
    if (this.y + this.height + UNIT <= SETTINGS.HEIGHT) {
      this.y += UNIT;
    }
  }
}
