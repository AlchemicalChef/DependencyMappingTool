import type { ElementDefinition } from "cytoscape";
import type { Service } from "./service";
import type { Relationship } from "./relationship";

export interface GraphNodeData {
  id: string;
  label: string;
  serviceType: string;
  status: string;
  isCenter: boolean;
}

export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  relationshipType: string;
  label?: string;
}

export type GraphNode = ElementDefinition & { data: GraphNodeData };
export type GraphEdge = ElementDefinition & { data: GraphEdgeData };
export type GraphElements = (GraphNode | GraphEdge)[];

export interface GraphData {
  centerService: Service;
  connectedServices: Service[];
  relationships: Relationship[];
}
