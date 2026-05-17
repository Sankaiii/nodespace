import type { Node, Edge } from 'reactflow';

export interface NodeData {
  title: string;
  content: string;
  color: string;
  collapsed: boolean;
}

export interface FlowState {
  nodes: Node<NodeData>[];
  edges: Edge[];
}

export interface Profile {
  id: string;
  name: string;
  flow: FlowState;
}

export type Background = 'dots' | 'grid' | 'lines' | 'none';
export type Theme = 'dark' | 'light';

export const DEFAULT_COLORS: string[] = [
  '#7F77DD',
  '#1D9E75',
  '#D85A30',
  '#D4537E',
  '#378ADD',
  '#BA7517',
  '#E24B4A',
  '#888380',
];

export interface CtxMenu {
  type: 'node' | 'pane';
  x: number;
  y: number;
  nodeId?: string;
  flowPos?: { x: number; y: number };
}
