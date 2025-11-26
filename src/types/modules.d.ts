declare module "react-cytoscapejs" {
  import cytoscape, { Core, ElementDefinition, Stylesheet } from "cytoscape";
  import { Component, CSSProperties } from "react";

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

declare module "cytoscape-cose-bilkent" {
  import cytoscape from "cytoscape";
  const coseBilkent: cytoscape.Ext;
  export default coseBilkent;
}
