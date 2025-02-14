import { useEffect, useState } from 'react';

import { useTabs } from '@renderer/store/useTabs';

import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EditorManager } from '@renderer/lib/data/EditorManager';
import { Condition } from '@renderer/lib/drawable/Condition';
import { State } from '@renderer/lib/drawable/State';
import { Point } from '@renderer/types/graphics';

type DiagramContextMenuItem = { label: string; action: () => void };

export const useDiagramContextMenu = (editor: CanvasEditor | null, manager: EditorManager) => {
  const openTab = useTabs((state) => state.openTab);

  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<DiagramContextMenuItem[]>([]);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const onClose = () => setIsOpen(false);

  useEffect(() => {
    if (!editor) return;

    const handleEvent = (pos: Point, items: DiagramContextMenuItem[]) => {
      const offset = editor.mouse.getOffset();
      const position = { x: pos.x + offset.x, y: pos.y + offset.y };

      setIsOpen(true);
      setPosition(position);
      setItems(items);
    };

    // контекстное меню для пустого поля
    editor.container.onFieldContextMenu((pos) => {
      const canvasPos = editor.container.relativeMousePos(pos);

      handleEvent(pos, [
        {
          label: 'Вставить состояние',
          action: () => {
            editor?.container.machine.createNewState('Состояние', canvasPos);
          },
        },
        {
          label: 'Посмотреть код',
          action: () => {
            openTab({
              type: 'code',
              name: manager.state.shownName ?? 'Безымянная',
              code: manager.state.content!,
              language: 'json',
            });
          },
        },
        {
          label: 'Центрировать камеру',
          action: () => {
            editor?.container.viewCentering();
          },
        },
      ]);
    });

    // контекстное меню для состояния
    editor.container.states.onStateContextMenu((state: State, pos) => {
      const canvasPos = editor.container.relativeMousePos(pos);

      handleEvent(pos, [
        {
          label: 'Вставить состояние',
          action: () => {
            editor?.container.machine.createNewState('Состояние', canvasPos, state.id);
          },
        },
        {
          label: 'Назначить начальным',
          action: () => {
            editor?.container.machine.changeInitialState(state.id as string);
          },
        },
        {
          label: 'Посмотреть код',
          action: () => {
            openTab({
              type: 'state',
              name: state.data.name,
              code: JSON.stringify(state.data, null, 2),
              language: 'json',
            });
          },
        },
        {
          label: 'Центрировать камеру',
          action: () => {
            editor?.container.viewCentering();
          },
        },
        {
          label: 'Удалить',
          action: () => {
            editor?.container.machine.deleteState(state.id as string);
          },
        },
      ]);
    });

    // контекстное меню для события
    editor.container.states.onEventContextMenu((state, pos, event) => {
      handleEvent(pos, [
        {
          label: 'Удалить',
          action: () => {
            editor?.container.machine.deleteEvent(state.id as string, event);
          },
        },
      ]);
    });

    // контекстное меню для связи
    editor.container.transitions.onTransitionContextMenu((condition: Condition, pos: Point) => {
      handleEvent(pos, [
        {
          label: 'Посмотреть код',
          action: () => {
            openTab({
              type: 'transition',
              name: condition.transition.id,
              code: JSON.stringify(condition, null, 2),
              language: 'json',
            });
          },
        },
        {
          label: 'Центрировать камеру',
          action: () => {
            editor?.container.viewCentering();
          },
        },
        {
          label: 'Удалить',
          action: () => {
            editor?.container.machine.deleteTransition(condition.id as string);
          },
        },
      ]);
    });
  }, [editor]);

  return { isOpen, onClose, items, position };
};
