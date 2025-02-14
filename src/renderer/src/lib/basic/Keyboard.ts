import { EventEmitter } from '../common/EventEmitter';

/**
 * Обработчик событий, связанных со взаимодействием мыши и {@link Canvas}.
 * Оборачивает браузерные события, происходящие на холсте, и фильтрует из них
 * связанные с необходимыми для работы клавишами.
 */
export class Keyboard extends EventEmitter<KeyboardEvent> {
  spacePressed = false;
  ctrlPressed = false;

  constructor() {
    super();

    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
  }

  cleanUp() {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
  }

  handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space' && !this.spacePressed) {
      this.spacePressed = true;
      this.emit('spacedown', e);
      return;
    }
  };

  handleKeyUp = (e: KeyboardEvent) => {
    // console.log(e.code, e);
    if (e.code === 'Space') {
      this.spacePressed = false;
      this.emit('spaceup', e);
      return;
    }
    if (e.code === 'Delete') {
      this.emit('delete', e);
      return;
    }
    if (e.ctrlKey) {
      if (e.code === 'KeyZ') {
        this.emit('ctrlz', e);
        return;
      }
    }
  };
}
