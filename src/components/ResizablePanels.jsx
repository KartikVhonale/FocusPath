import React from 'react';
import { Group, Panel as BasePanel, Separator } from 'react-resizable-panels';

/**
 * High-End Apple/Xcode Style Resizable Panels Adapter
 * Bridges standard PanelGroup/Panel/PanelResizeHandle API to react-resizable-panels Group/Separator
 */
export function PanelGroup({
  direction = 'horizontal',
  orientation,
  children,
  className = '',
  ...props
}) {
  const resolvedOrientation =
    orientation || (direction === 'horizontal' ? 'horizontal' : 'vertical');

  return (
    <Group
      orientation={resolvedOrientation}
      className={`w-full flex ${resolvedOrientation === 'horizontal' ? 'flex-row' : 'flex-col'} ${className}`}
      {...props}
    >
      {children}
    </Group>
  );
}

export function Panel({ children, defaultSize, minSize, maxSize, className = '', ...props }) {
  // Convert numeric percentages like defaultSize={35} to "35%" strings for react-resizable-panels v4
  const formatSize = (s) => (typeof s === 'number' ? `${s}%` : s);

  return (
    <BasePanel
      defaultSize={formatSize(defaultSize)}
      minSize={formatSize(minSize)}
      maxSize={formatSize(maxSize)}
      className={`min-w-0 ${className}`}
      {...props}
    >
      {children}
    </BasePanel>
  );
}

export function PanelResizeHandle({ children, className = '', ...props }) {
  return (
    <Separator
      className={`cursor-col-resize select-none flex items-center justify-center shrink-0 ${className}`}
      {...props}
    >
      {children}
    </Separator>
  );
}

export default {
  PanelGroup,
  Panel,
  PanelResizeHandle,
};
