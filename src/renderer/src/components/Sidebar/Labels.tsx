import { useSidebar } from '@renderer/store/useSidebar';
import React from 'react';
import { twMerge } from 'tailwind-merge';

interface LabelsProps {
  items: Array<{ Icon: JSX.Element; bottom?: boolean }>;
}

export const Labels: React.FC<LabelsProps> = ({ items }) => {
  const [activeTab, changeTab] = useSidebar((state) => [state.activeTab, state.changeTab]);

  return (
    <div className="flex flex-col border-r border-border-primary bg-bg-primary">
      {items.map(({ Icon, bottom = false }, i) => (
        <button
          key={i}
          className={twMerge(
            'w-12 border-l-2 border-transparent p-2 text-text-inactive transition-colors hover:text-text-primary',
            activeTab === i && 'border-primary text-text-primary',
            bottom && 'mt-auto'
          )}
          onClick={() => changeTab(i)}
        >
          {Icon}
        </button>
      ))}
    </div>
  );
};
