import type { LayoutOptions } from "cytoscape";

export const DEFAULT_LAYOUT_OPTIONS: LayoutOptions = {
  name: "cose-bilkent",
  animate: true,
  animationDuration: 500,
  nodeRepulsion: 4500,
  idealEdgeLength: 120,
  edgeElasticity: 0.45,
  nestingFactor: 0.1,
  gravity: 0.25,
  numIter: 2500,
  tile: true,
  fit: true,
  padding: 50,
} as LayoutOptions;

export const COMPACT_LAYOUT_OPTIONS: LayoutOptions = {
  ...DEFAULT_LAYOUT_OPTIONS,
  nodeRepulsion: 3000,
  idealEdgeLength: 80,
  gravity: 0.4,
} as LayoutOptions;

export const SPREAD_LAYOUT_OPTIONS: LayoutOptions = {
  ...DEFAULT_LAYOUT_OPTIONS,
  nodeRepulsion: 6000,
  idealEdgeLength: 160,
  gravity: 0.15,
} as LayoutOptions;
