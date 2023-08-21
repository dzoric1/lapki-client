import React from 'react';

import { ReactComponent as Close } from '@renderer/assets/icons/close.svg';
import ReactModal, { Props } from 'react-modal';

import './style.css';

ReactModal.setAppElement('#root');

interface ModalProps extends Props {
  title: string;
  cancelLabel?: string;
  submitLabel?: string;
  extraLabel?: string;
  sideLabel?: string;
  children: React.ReactNode;
  onExtra?: React.FormEventHandler;
  onSide?: React.FormEventHandler;
  onSubmit?: React.FormEventHandler;
  submitDisabled?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  children,
  title,
  onSubmit,
  cancelLabel,
  submitLabel,
  extraLabel,
  sideLabel,
  onExtra,
  onSide,
  submitDisabled,
  ...props
}) => {
  return (
    <ReactModal
      {...props}
      className="absolute left-1/2 top-12 w-full max-w-2xl -translate-x-1/2 rounded-lg bg-bg-primary p-6 outline-none"
      overlayClassName="bg-[rgba(0,0,0,0.6)] fixed inset-0 backdrop-blur z-0"
      closeTimeoutMS={300}
    >
      <div className="relative mb-3 flex items-center justify-between border-b border-neutral-400 pb-1">
        <h1 className="text-2xl font-bold">{title}</h1>
        <button
          className="rounded-full border-none p-3 text-neutral-50 shadow-none outline-1 outline-neutral-100 transition-colors hover:bg-neutral-700"
          onClick={props.onRequestClose}
        >
          <Close width="1rem" height="1rem" />
        </button>
      </div>

      <form onSubmit={onSubmit}>
        <div className="mb-4">{children}</div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className="rounded px-4 py-2 text-red-400 transition-colors hover:text-red-200"
            onClick={onSide}
            hidden={!sideLabel}
          >
            {sideLabel}
          </button>
          <div className="flex-grow"></div>
          <button
            type="button"
            className="rounded px-4 py-2 text-neutral-400 transition-colors hover:text-neutral-50"
            onClick={props.onRequestClose}
          >
            {cancelLabel ?? 'Закрыть'}
          </button>
          <button
            type="button"
            className="rounded bg-neutral-700 px-4 py-2 transition-colors hover:bg-neutral-600"
            hidden={!extraLabel}
            onClick={onExtra}
          >
            {extraLabel ?? ''}
          </button>
          <button
            type="submit"
            className="rounded bg-neutral-700 px-4 py-2 transition-colors enabled:hover:bg-neutral-600 disabled:bg-neutral-900 disabled:text-neutral-500"
            hidden={!onSubmit}
            disabled={submitDisabled}
          >
            {submitLabel ?? 'Сохранить'}
          </button>
        </div>
      </form>
    </ReactModal>
  );
};
