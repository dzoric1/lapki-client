import React, { useMemo } from 'react';

import {
  Explorer,
  Menu,
  Compiler,
  Loader,
  MenuProps,
  CompilerProps,
  FlasherProps,
  ExplorerCallbacks,
} from '../../components';

import { ReactComponent as MenuIcon } from '@renderer/assets/icons/menu.svg';
import { ReactComponent as ComponentsIcon } from '@renderer/assets/icons/components.svg';
import { ReactComponent as CompilerIcon } from '@renderer/assets/icons/compiler.svg';
import { ReactComponent as DriveIcon } from '@renderer/assets/icons/drive.svg';
//import { ReactComponent as ChipIcon } from '@renderer/assets/icons/chip.svg';
import { ReactComponent as SettingsIcon } from '@renderer/assets/icons/settings.svg';
import { Setting } from '../Setting';
import { EditorRef } from '@renderer/hooks/useEditorManager';

import { Labels } from './Labels';
import { Menus } from './Menus';
import { Badge } from '../UI';

export interface SidebarCallbacks {
  onRequestNewFile: () => void;
  onRequestOpenFile: () => void;
  onRequestSaveFile: () => void;
  onRequestSaveAsFile: () => void;
  onRequestAddComponent: () => void;
  onRequestEditComponent: (idx: string) => void;
  onRequestImport: (platform: string) => void;
  onRequestDeleteComponent: (name: string) => void;
}

interface SidebarProps {
  editorRef: EditorRef;
  callbacks: SidebarCallbacks;
  compilerProps: CompilerProps;
  flasherProps: FlasherProps;
}

export const Sidebar: React.FC<SidebarProps> = ({
  flasherProps,
  compilerProps,
  editorRef,
  callbacks: {
    onRequestNewFile,
    onRequestOpenFile,
    onRequestSaveFile,
    onRequestSaveAsFile,
    onRequestAddComponent,
    onRequestEditComponent,
    onRequestDeleteComponent,
    onRequestImport,
  },
}) => {
  const tabLabels = useMemo(
    () => [
      {
        Icon: (
          <Badge show={editorRef.editorData.modified}>
            <MenuIcon />
          </Badge>
        ),
      },
      {
        Icon: <ComponentsIcon />,
      },
      {
        Icon: <CompilerIcon />,
      },
      {
        Icon: <DriveIcon />,
      },
      // {
      //   Icon: <ChipIcon />,
      // },
      {
        Icon: <SettingsIcon />,
        bottom: true,
      },
    ],
    [editorRef.editorData]
  );

  const menuProps: MenuProps = {
    onRequestNewFile,
    onRequestOpenFile,
    onRequestSaveFile,
    onRequestSaveAsFile,
    onRequestImport,
    compilerStatus: compilerProps.compilerStatus,
  };

  const explorerCallbacks: ExplorerCallbacks = {
    onRequestAddComponent,
    onRequestEditComponent,
    onRequestDeleteComponent,
  };

  const menus = useMemo(
    () => [
      <Menu {...menuProps} />,
      <Explorer editorRef={editorRef} callbacks={explorerCallbacks} />,
      <Compiler {...compilerProps} />,
      <Loader {...flasherProps} />,
      <Setting />,
    ],
    [editorRef.editorData, compilerProps, flasherProps]
  );

  return (
    <div className="flex">
      <Labels items={tabLabels} />
      <Menus items={menus} />
    </div>
  );
};
