import { SETTINGS } from '../SETTINGS';

export enum KeyCode {
  UP = 38,
  DOWN = 40,
}

const UNIT = 2;

export class Player {
  private socketId: string; // 소켓아이디

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

  constructor(socketId: string, role: string) {
    this.socketId = socketId;
    this.role = role;
    this.ready = false;

    if (role === 'player1') {
      this.x = SETTINGS.PLAYER.GAP;
    } else {
      this.x = SETTINGS.WIDTH - SETTINGS.PLAYER.GAP;
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
      this.x = SETTINGS.WIDTH - SETTINGS.PLAYER.GAP;
    }
    this.y = SETTINGS.HEIGHT / 2;
  }

  getSocketId() {
    return this.socketId;
  }

  getRole() {
    return this.role;
  }

  setKeyPress(keyCode: number, isDown: boolean) {
    if (keyCode === KeyCode.UP || keyCode === KeyCode.DOWN) {
      this.keypress[keyCode] = isDown;
    }
  }

  initScore() {
    this.score = 0;
  }

  increaseScore() {
    this.score += 1;
  }

  setReady(value: boolean) {
    this.ready = value;
  }

  getReady() {
    return this.ready;
  }

  private moveup(): void {
    if (this.y - this.height / 2 - UNIT >= 0) {
      this.y -= UNIT;
    }
  }

  private moveDown(): void {
    if (this.y + this.height / 2 + UNIT <= SETTINGS.HEIGHT) {
      this.y += UNIT;
    }
  }
}
