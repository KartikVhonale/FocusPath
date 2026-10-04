import React, { memo } from 'react';
import EditableTree from './EditableTree';

/**
 * 4-Level Recursive SyllabusTree
 *
 * Features:
 * - 4-level deep hierarchy: Subject -> Chapter -> Topic -> Subtopic
 * - Framer Motion smooth spring accordions
 * - Radix UI Context Menu: Right click any subtopic to Start Focus Timer, Mark Complete, Rename, or Delete
 * - @dnd-kit drag-and-drop reordering
 * - Leaf node tiny "Play" icon triggering global Zustand timer
 */
export const SyllabusTree = memo(function SyllabusTree({
  readOnly = false,
  isLocked = false,
  ...props
}) {
  return <EditableTree isLocked={isLocked || readOnly} {...props} />;
});

export default SyllabusTree;
export { EditableTree };
