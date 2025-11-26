export type RelationshipType =
  | "depends_on"
  | "communicates_with"
  | "authenticates_via"
  | "reads_from"
  | "writes_to"
  | "publishes"
  | "subscribes"
  | string;

export interface Relationship {
  id: string;
  source: string;
  target: string;
  relationshipType: RelationshipType;
  description?: string;
  metadata?: Record<string, unknown>;
}
