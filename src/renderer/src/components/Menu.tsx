import React from 'react';

interface MenuProps {
  onRequestOpenFile: () => void;
  onRequestNewFile: () => void;
}

const handleSaveFile = async () => {
  window.electron.ipcRenderer.invoke('dialog:saveFile', localStorage.getItem('Data'));
  localStorage.clear();
};

const handleSaveAsFile = async () => {
  window.electron.ipcRenderer.invoke('dialog:saveAsFile', localStorage.getItem('Data'));
  localStorage.clear();
};

export const Menu: React.FC<MenuProps> = ({ onRequestOpenFile, onRequestNewFile }) => {
  const items = [
    {
      text: 'Новый файл',
      onClick: onRequestNewFile,
    },
    {
      text: 'Открыть файл',
      onClick: onRequestOpenFile,
    },
    {
      text: 'Сохранить файл',
      onClick: handleSaveFile,
    },
    {
      text: 'Сохранить файл как...',
      onClick: handleSaveAsFile,
    },
    {
      text: 'Примеры',
    },
  ];

  return (
    <section
      key="SectionMenu"
      className="flex h-full w-full flex-col items-stretch bg-[#4391BF] bg-opacity-50 font-Fira"
    >
      <div className="w-full px-4 pt-2 text-center">
        <p className="mb-3 border-b border-white pb-2 text-lg">Меню</p>
      </div>
      {items.map(({ text, onClick }) => (
        <button
          key={text}
          className="bg-opacity-50 py-2 text-center text-base hover:bg-[#4391BF]"
          onClick={onClick}
        >
          {text}
        </button>
      ))}
    </section>
  );
};
