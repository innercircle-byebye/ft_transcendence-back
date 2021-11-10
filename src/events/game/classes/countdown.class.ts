import { SETTINGS } from '../SETTINGS';

export class Countdown {
  private defaultCount: number;

  private defaultSize: number;

  private count: number;

  private size: number;

  private createdAt: number;

  constructor() {
    this.defaultCount = SETTINGS.COUNTDOWN_SEC;
    this.defaultSize = SETTINGS.COUNTDOWN_SIZE;
    this.count = this.defaultCount;
    this.size = this.defaultSize;
    this.createdAt = Date.now();
  }

  update() {
    const newCount =
      this.defaultCount - Math.floor((Date.now() - this.createdAt) / 1000);

    if (this.count !== newCount) {
      this.size = this.defaultSize;
      this.count = newCount;
    } else {
      this.size *= 0.997;
    }
  }

  isEnd() {
    return this.count < 0;
  }

  getStatus() {
    return {
      type: 'countdown',
      count: this.count,
      size: this.size,
    };
  }
}
