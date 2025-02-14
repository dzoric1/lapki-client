import { Draggable } from './Draggable';
import { Transition } from './Transition';

import { Container } from '../basic/Container';
import { stateStyle, transitionStyle } from '../styles';
import { picto } from './Picto';

/**
 * Условие перехода (т.е. подпись ребра машины состояний).
 * Перемещаемый элемент схемы, выполняет отрисовку и
 * обработку событий мыши.
 */

export class Condition extends Draggable {
  transition!: Transition;

  //Проверка нажатия на левую кнопку мыши для выделения связи
  isSelected = false;

  constructor(container: Container, transition: Transition, id: string) {
    super(
      container,
      {
        x: transition.data.position.x,
        y: transition.data.position.y,
        width: 130,
        height: 70,
      },
      id
    );

    this.transition = transition;
    // this.contextmenu = new ContextMenu(container, this);
  }

  toJSON() {
    return this.transition.data;
  }

  draw(ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement) {
    const { x, y, width, height } = this.drawBounds;
    const eventMargin = picto.eventMargin;
    const p = 15 / this.container.scale;
    const fontSize = stateStyle.titleFontSize / this.container.scale;
    const opacity = this.isSelected ? 1.0 : 0.7;
    ctx.font = `${fontSize}px/${stateStyle.titleLineHeight} ${stateStyle.titleFontFamily}`;
    ctx.fillStyle = stateStyle.eventColor;
    ctx.textBaseline = stateStyle.eventBaseLine;

    ctx.fillStyle = 'rgb(23, 23, 23)';

    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 8);
    ctx.fill();
    ctx.closePath();

    ctx.fillStyle = transitionStyle.bgColor;

    const trigger = this.transition.data.trigger;
    const platform = this.container.machine.platform;
    ctx.beginPath();
    platform.drawEvent(ctx, trigger, x + p, y + p);
    ctx.closePath();

    //Здесь начинается прорисовка действий и условий для связей
    const eventRowLength = Math.max(
      3,
      Math.floor((width * this.container.scale - 30) / (picto.eventWidth + 5)) - 1
    );
    const px = x + p;
    const py = y + p;
    const yDx = picto.eventHeight + 10;

    //Условия
    //TODO: Требуется допиливание прорисовки условий
    ctx.beginPath();
    if (this.transition.data.condition) {
      const ax = 1;
      const ay = 0;
      const aX = px + (eventMargin + (picto.eventWidth + eventMargin) * ax) / this.container.scale;
      const aY = py + (ay * yDx) / this.container.scale;
      platform.drawCondition(ctx, this.transition.data.condition, aX, aY, opacity);
    }
    ctx.closePath();

    //Действия
    ctx.beginPath();
    this.transition.data.do?.forEach((data, actIdx) => {
      const ax = 1 + (actIdx % eventRowLength);
      const ay = 1 + Math.floor(actIdx / eventRowLength);
      const aX = px + (eventMargin + (picto.eventWidth + eventMargin) * ax) / this.container.scale;
      const aY = py + (ay * yDx) / this.container.scale;
      platform.drawAction(ctx, data, aX, aY, opacity);
    });
    ctx.closePath();

    /*
    ctx.fillText(trigger.component, x + p, y + p);
    ctx.fillText(trigger.method, x + p, y + fontSize + p);
    ctx.closePath();
    */

    if (this.isSelected) {
      this.drawSelection(ctx);
    }
  }

  private drawSelection(ctx: CanvasRenderingContext2D) {
    const { x, y, width, height, childrenHeight } = this.drawBounds;

    // NOTE: Для каждого нового объекта рисования требуется указывать их начало и конец,
    //       а перед ними прописывать стили!
    ctx.beginPath();
    ctx.strokeStyle = transitionStyle.bgColor;
    ctx.roundRect(x, y, width, height + childrenHeight, transitionStyle.startSize);
    ctx.stroke();
    ctx.closePath();
  }

  setIsSelected(value: boolean) {
    this.isSelected = value;
  }
}
