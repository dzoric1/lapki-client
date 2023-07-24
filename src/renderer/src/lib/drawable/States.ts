import { State } from './State';
import { Elements } from '@renderer/types/diagram';
import { EventEmitter } from '../common/EventEmitter';
import { Point } from '@renderer/types/graphics';
import { Container } from '../basic/Container';
import { stateStyle } from '../styles';
import { Transition } from './Transition';

type CreateStateCallback = (state) => void;

/**
 * Хранилище {@link State|состояний}.
 * Предоставляет подписку на события, связанные с состояниями,
 * а также метод для создания новых состояний.
 * Реализует отрисовку и обработку выделения состояний.
 */
export class States extends EventEmitter {
  container!: Container;
  items: Map<string, State> = new Map();
  itemsTransition: Map<string, Transition> = new Map();

  constructor(container: Container) {
    super();
    this.container = container;
  }

  createCallback?: CreateStateCallback;

  initEvents() {
    this.container.app.mouse.on('mouseup', this.handleMouseUp);
  }

  initItems(items: Elements['states'], initialState: string) {
    for (const id in items) {
      const parent = this.items.get(items[id].parent ?? '');
      const state = new State({
        container: this.container,
        id: id,
        data: items[id],
        parent,
        initial: id === initialState,
      });

      state.parent?.children.set(id, state);
      this.watchState(state);
      this.items.set(id, state);
    }
  }

  onStateCreate = (callback: CreateStateCallback) => {
    this.createCallback = callback;
  };

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    this.items.forEach((state) => {
      state.draw(ctx, canvas);
    });
  }

  handleMouseUp = () => {
    this.removeSelection();
  };

  handleStartNewTransition = (state: State) => {
    this.emit('startNewTransition', state);
  };

  handleMouseUpOnState = (e: { target: State; event: any }) => {
    this.emit('mouseUpOnState', e);
  };

  private removeSelection() {
    this.itemsTransition.forEach((value) => {
      value.condition.setIsSelected(false, '');
      value.condition.setIsSelectedMenu(false);
    });
    this.items.forEach((state) => {
      state.setIsSelected(false, '');
      state.setIsSelected(false, '');
    });

    this.container.isDirty = true;
  }

  handleStateClick = ({ target, event }: { target: State; event: any }) => {
    event.stopPropagation();
    this.removeSelection();

    target.setIsSelected(true, JSON.stringify(target));
  };

  handleStateDoubleClick = (e: { target: State; event: any }) => {
    e.event.stopPropagation();

    this.createCallback?.(e);
  };

  handleContextMenu = ({ target, event }: { target: State; event: any }) => {
    event.stopPropagation();
    this.removeSelection();

    target.setIsSelectedMenu(true);
  };

  createState(name: string, events: string, component: string, method: string) {
    const { width, height } = stateStyle;
    const x = 200 - width / 2;
    const y = 200 - height / 2;

    var startEvents = {};
    startEvents[events] = { component, method };

    const state = new State({
      container: this.container,
      id: name,
      data: {
        bounds: { x, y, width, height },
        events: startEvents,
      },
    });

    this.watchState(state);
    
    this.items.set(name, state);

    this.container.isDirty = true;
  }

  createNewState(name: string, position: Point) {
    const { width, height } = stateStyle;
    const x = position.x - width / 2;
    const y = position.y - height / 2;

    const state = new State({
      container: this.container,
      id: name,
      data: {
        bounds: { x, y, width, height },
        events: {},
      },
    });

    this.watchState(state);
    this.items.set(name, state);

    this.container.isDirty = true;
  }

  watchState (state: State) {
    state.on('mouseup', this.handleMouseUpOnState as any);
    state.on('click', this.handleStateClick as any);
    state.on('dblclick', this.handleStateDoubleClick as any);
    state.on('contextmenu', this.handleContextMenu as any);

    state.edgeHandlers.onStartNewTransition = this.handleStartNewTransition;
  }
}
