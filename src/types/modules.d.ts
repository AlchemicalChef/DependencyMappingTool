/**
 * @fileoverview TypeScript module declarations for third-party libraries.
 *
 * Provides type definitions for libraries that don't have built-in
 * TypeScript support or have incomplete type definitions.
 *
 * @module types/modules
 */

/**
 * Type declarations for react-cytoscapejs.
 *
 * A React wrapper component for Cytoscape.js that provides a declarative
 * way to create and manage Cytoscape graphs in React applications.
 */
declare module "react-cytoscapejs" {
  import cytoscape, { Core, ElementDefinition, Stylesheet } from "cytoscape";
  import { Component, CSSProperties } from "react";

  /**
   * Props for the CytoscapeComponent.
   *
   * @property elements - Array of node and edge definitions
   * @property stylesheet - Array of Cytoscape style rules
   * @property style - CSS styles for the container element
   * @property cy - Callback to receive the Cytoscape core instance
   * @property minZoom - Minimum zoom level (default: 0)
   * @property maxZoom - Maximum zoom level (default: unlimited)
   * @property boxSelectionEnabled - Enable box selection of elements
   * @property autounselectify - Prevent element unselection
   * @property wheelSensitivity - Mouse wheel zoom sensitivity
   * @property layout - Layout algorithm options
   * @property pan - Initial pan position
   * @property zoom - Initial zoom level
   */
  interface CytoscapeComponentProps {
    elements: ElementDefinition[];
    stylesheet?: Stylesheet[];
    style?: CSSProperties;
    cy?: (cy: Core) => void;
    minZoom?: number;
    maxZoom?: number;
    boxSelectionEnabled?: boolean;
    autounselectify?: boolean;
    wheelSensitivity?: number;
    layout?: cytoscape.LayoutOptions;
    pan?: cytoscape.Position;
    zoom?: number;
  }

  export default class CytoscapeComponent extends Component<CytoscapeComponentProps> {}
}

/**
 * Type declarations for cytoscape-cose-bilkent.
 *
 * A Cytoscape.js extension that provides the CoSE Bilkent layout algorithm,
 * a force-directed layout optimized for compound graphs.
 */
declare module "cytoscape-cose-bilkent" {
  import cytoscape from "cytoscape";
  const coseBilkent: cytoscape.Ext;
  export default coseBilkent;
}
