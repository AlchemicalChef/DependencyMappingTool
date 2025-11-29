---------------------------- MODULE DependencyMappingTool ----------------------------
(*
 * TLA+ Formal Specification for the Dependency Mapping Tool
 *
 * This specification models the core state management and operations of a
 * dependency mapping application that tracks services and their relationships
 * across multiple deployment environments.
 *
 * Key abstractions:
 * - Environments: Isolated contexts (dev, staging, prod) containing services
 * - Services: Nodes in the dependency graph with metadata
 * - Relationships: Directed edges between services
 *
 * Safety properties verified:
 * - No duplicate service IDs within an environment
 * - Relationships only reference existing services
 * - Current environment always exists
 * - No orphaned relationships after service deletion (when using safe delete)
 *)

EXTENDS Naturals, Sequences, FiniteSets, TLC

CONSTANTS
    MaxServices,        \* Maximum number of services per environment
    MaxRelationships,   \* Maximum number of relationships per environment
    MaxEnvironments,    \* Maximum number of environments
    ServiceIds,         \* Set of possible service IDs
    EnvironmentNames,   \* Set of possible environment names
    ServiceTypes,       \* Set of service types (api, database, cache, etc.)
    RelationshipTypes   \* Set of relationship types (depends_on, etc.)

(*
 * Type definitions for clarity (used in type invariant)
 *)
ServiceTypeSet == {"api", "database", "cache", "queue", "gateway",
                   "frontend", "backend", "external", "identity-provider"}

StatusTypeSet == {"healthy", "degraded", "unhealthy", "unknown", "deprecated"}

RelationshipTypeSet == {"depends_on", "communicates_with", "authenticates_via",
                        "reads_from", "writes_to", "publishes", "subscribes"}

(*
 * A Service record contains:
 * - id: unique identifier within the environment
 * - serviceType: category of the service
 * - status: health status
 *)
Service == [
    id: ServiceIds,
    serviceType: ServiceTypes,
    status: StatusTypeSet
]

(*
 * A Relationship record contains:
 * - source: ID of the source service
 * - target: ID of the target service
 * - relationshipType: type of the relationship
 *)
Relationship == [
    source: ServiceIds,
    target: ServiceIds,
    relationshipType: RelationshipTypes
]

VARIABLES
    environments,           \* Set of existing environment names
    currentEnvironment,     \* Currently selected environment
    services,               \* Function: environment -> set of services
    relationships,          \* Function: environment -> set of relationships
    validationErrors        \* Set of current validation errors (for modeling)

vars == <<environments, currentEnvironment, services, relationships, validationErrors>>

-----------------------------------------------------------------------------
(*
 * Type Invariant
 *
 * Ensures all variables maintain their expected types throughout execution.
 *)
TypeInvariant ==
    /\ environments \subseteq EnvironmentNames
    /\ currentEnvironment \in EnvironmentNames \cup {"-"}  \* "-" represents no selection
    /\ \A env \in environments:
        /\ services[env] \subseteq Service
        /\ relationships[env] \subseteq Relationship
    /\ validationErrors \subseteq STRING

-----------------------------------------------------------------------------
(*
 * Safety Invariants
 *)

(*
 * The current environment must always be a valid existing environment
 * (or "-" if no environments exist)
 *)
CurrentEnvironmentValid ==
    currentEnvironment = "-" \/ currentEnvironment \in environments

(*
 * No duplicate service IDs within any single environment
 *)
NoDuplicateServiceIds ==
    \A env \in environments:
        \A s1, s2 \in services[env]:
            s1.id = s2.id => s1 = s2

(*
 * All relationships must reference existing services in the same environment
 * (no orphaned relationships)
 *)
RelationshipsHaveValidEndpoints ==
    \A env \in environments:
        \A rel \in relationships[env]:
            /\ \E s \in services[env]: s.id = rel.source
            /\ \E s \in services[env]: s.id = rel.target

(*
 * No self-referential relationships (a service cannot depend on itself)
 *)
NoSelfRelationships ==
    \A env \in environments:
        \A rel \in relationships[env]:
            rel.source # rel.target

(*
 * Combined safety invariant
 *)
SafetyInvariant ==
    /\ TypeInvariant
    /\ CurrentEnvironmentValid
    /\ NoDuplicateServiceIds
    /\ RelationshipsHaveValidEndpoints
    /\ NoSelfRelationships

-----------------------------------------------------------------------------
(*
 * Helper Operators
 *)

(*
 * Get all service IDs in an environment
 *)
ServiceIdsInEnv(env) ==
    {s.id : s \in services[env]}

(*
 * Check if a service ID exists in an environment
 *)
ServiceExists(env, serviceId) ==
    \E s \in services[env]: s.id = serviceId

(*
 * Get relationships involving a specific service (as source or target)
 *)
RelationshipsForService(env, serviceId) ==
    {rel \in relationships[env]: rel.source = serviceId \/ rel.target = serviceId}

(*
 * Count services in an environment
 *)
ServiceCount(env) ==
    Cardinality(services[env])

(*
 * Count relationships in an environment
 *)
RelationshipCount(env) ==
    Cardinality(relationships[env])

-----------------------------------------------------------------------------
(*
 * Initial State
 *
 * The system starts with no environments, services, or relationships.
 *)
Init ==
    /\ environments = {}
    /\ currentEnvironment = "-"
    /\ services = [env \in EnvironmentNames |-> {}]
    /\ relationships = [env \in EnvironmentNames |-> {}]
    /\ validationErrors = {}

-----------------------------------------------------------------------------
(*
 * Actions: Environment Management
 *)

(*
 * Create a new environment
 *
 * Preconditions:
 * - Environment name not already in use
 * - Haven't exceeded max environments
 *
 * Effects:
 * - Adds environment to the set
 * - If no current environment, switches to the new one
 *)
CreateEnvironment(envName) ==
    /\ envName \notin environments
    /\ Cardinality(environments) < MaxEnvironments
    /\ environments' = environments \cup {envName}
    /\ currentEnvironment' = IF currentEnvironment = "-"
                             THEN envName
                             ELSE currentEnvironment
    /\ UNCHANGED <<services, relationships, validationErrors>>

(*
 * Switch to a different environment
 *
 * Preconditions:
 * - Target environment exists
 *
 * Effects:
 * - Updates current environment
 *)
SwitchEnvironment(envName) ==
    /\ envName \in environments
    /\ envName # currentEnvironment
    /\ currentEnvironment' = envName
    /\ UNCHANGED <<environments, services, relationships, validationErrors>>

-----------------------------------------------------------------------------
(*
 * Actions: Service Management
 *)

(*
 * Create a new service in the current environment
 *
 * Preconditions:
 * - Current environment is valid
 * - Service ID doesn't already exist
 * - Haven't exceeded max services
 *
 * Effects:
 * - Adds service to the current environment
 *)
CreateService(serviceId, serviceType, status) ==
    /\ currentEnvironment # "-"
    /\ ~ServiceExists(currentEnvironment, serviceId)
    /\ ServiceCount(currentEnvironment) < MaxServices
    /\ LET newService == [id |-> serviceId,
                          serviceType |-> serviceType,
                          status |-> status]
       IN services' = [services EXCEPT ![currentEnvironment] =
                       services[currentEnvironment] \cup {newService}]
    /\ UNCHANGED <<environments, currentEnvironment, relationships, validationErrors>>

(*
 * Update an existing service
 *
 * Preconditions:
 * - Current environment is valid
 * - Service exists
 *
 * Effects:
 * - Replaces service with updated version (same ID)
 *)
UpdateService(serviceId, newType, newStatus) ==
    /\ currentEnvironment # "-"
    /\ ServiceExists(currentEnvironment, serviceId)
    /\ LET oldService == CHOOSE s \in services[currentEnvironment]: s.id = serviceId
           newService == [id |-> serviceId, serviceType |-> newType, status |-> newStatus]
       IN services' = [services EXCEPT ![currentEnvironment] =
                       (services[currentEnvironment] \ {oldService}) \cup {newService}]
    /\ UNCHANGED <<environments, currentEnvironment, relationships, validationErrors>>

(*
 * Delete a service (unsafe - may leave orphaned relationships)
 *
 * This models the raw delete operation without cleanup.
 * In practice, the UI should use SafeDeleteService.
 *
 * Preconditions:
 * - Current environment is valid
 * - Service exists
 *
 * Effects:
 * - Removes service from environment
 * - NOTE: Does NOT remove relationships (potential invariant violation)
 *)
UnsafeDeleteService(serviceId) ==
    /\ currentEnvironment # "-"
    /\ ServiceExists(currentEnvironment, serviceId)
    /\ LET serviceToDelete == CHOOSE s \in services[currentEnvironment]: s.id = serviceId
       IN services' = [services EXCEPT ![currentEnvironment] =
                       services[currentEnvironment] \ {serviceToDelete}]
    /\ UNCHANGED <<environments, currentEnvironment, relationships, validationErrors>>

(*
 * Delete a service safely (removes associated relationships first)
 *
 * This is the correct way to delete a service, maintaining invariants.
 *
 * Preconditions:
 * - Current environment is valid
 * - Service exists
 *
 * Effects:
 * - Removes all relationships involving the service
 * - Removes the service
 *)
SafeDeleteService(serviceId) ==
    /\ currentEnvironment # "-"
    /\ ServiceExists(currentEnvironment, serviceId)
    /\ LET serviceToDelete == CHOOSE s \in services[currentEnvironment]: s.id = serviceId
           relsToDelete == RelationshipsForService(currentEnvironment, serviceId)
       IN /\ services' = [services EXCEPT ![currentEnvironment] =
                          services[currentEnvironment] \ {serviceToDelete}]
          /\ relationships' = [relationships EXCEPT ![currentEnvironment] =
                               relationships[currentEnvironment] \ relsToDelete]
    /\ UNCHANGED <<environments, currentEnvironment, validationErrors>>

-----------------------------------------------------------------------------
(*
 * Actions: Relationship Management
 *)

(*
 * Create a new relationship between two services
 *
 * Preconditions:
 * - Current environment is valid
 * - Both source and target services exist
 * - Source and target are different (no self-loops)
 * - Relationship doesn't already exist (same source, target, type)
 * - Haven't exceeded max relationships
 *
 * Effects:
 * - Adds relationship to current environment
 *)
CreateRelationship(sourceId, targetId, relType) ==
    /\ currentEnvironment # "-"
    /\ ServiceExists(currentEnvironment, sourceId)
    /\ ServiceExists(currentEnvironment, targetId)
    /\ sourceId # targetId
    /\ ~\E rel \in relationships[currentEnvironment]:
        rel.source = sourceId /\ rel.target = targetId /\ rel.relationshipType = relType
    /\ RelationshipCount(currentEnvironment) < MaxRelationships
    /\ LET newRel == [source |-> sourceId,
                      target |-> targetId,
                      relationshipType |-> relType]
       IN relationships' = [relationships EXCEPT ![currentEnvironment] =
                            relationships[currentEnvironment] \cup {newRel}]
    /\ UNCHANGED <<environments, currentEnvironment, services, validationErrors>>

(*
 * Delete a relationship
 *
 * Preconditions:
 * - Current environment is valid
 * - Relationship exists
 *
 * Effects:
 * - Removes relationship from environment
 *)
DeleteRelationship(sourceId, targetId, relType) ==
    /\ currentEnvironment # "-"
    /\ \E rel \in relationships[currentEnvironment]:
        rel.source = sourceId /\ rel.target = targetId /\ rel.relationshipType = relType
    /\ LET relToDelete == CHOOSE rel \in relationships[currentEnvironment]:
           rel.source = sourceId /\ rel.target = targetId /\ rel.relationshipType = relType
       IN relationships' = [relationships EXCEPT ![currentEnvironment] =
                            relationships[currentEnvironment] \ {relToDelete}]
    /\ UNCHANGED <<environments, currentEnvironment, services, validationErrors>>

-----------------------------------------------------------------------------
(*
 * Actions: Validation
 *)

(*
 * Run validation on current environment
 *
 * This models the validation command that checks for data integrity issues.
 * In this spec, we model it as a no-op since our invariants should prevent
 * invalid states (when using safe operations).
 *)
ValidateEnvironment ==
    /\ currentEnvironment # "-"
    /\ LET orphanedRels == {rel \in relationships[currentEnvironment]:
           ~ServiceExists(currentEnvironment, rel.source) \/
           ~ServiceExists(currentEnvironment, rel.target)}
       IN validationErrors' = IF orphanedRels = {}
                              THEN {}
                              ELSE {"Orphaned relationships found"}
    /\ UNCHANGED <<environments, currentEnvironment, services, relationships>>

-----------------------------------------------------------------------------
(*
 * Next State Relation
 *
 * The system can take any of the defined actions.
 * We use SafeDeleteService to maintain invariants.
 *)
Next ==
    \/ \E env \in EnvironmentNames: CreateEnvironment(env)
    \/ \E env \in environments: SwitchEnvironment(env)
    \/ \E sid \in ServiceIds, stype \in ServiceTypes, status \in StatusTypeSet:
        CreateService(sid, stype, status)
    \/ \E sid \in ServiceIds, stype \in ServiceTypes, status \in StatusTypeSet:
        UpdateService(sid, stype, status)
    \/ \E sid \in ServiceIds: SafeDeleteService(sid)
    \/ \E src, tgt \in ServiceIds, rtype \in RelationshipTypes:
        CreateRelationship(src, tgt, rtype)
    \/ \E src, tgt \in ServiceIds, rtype \in RelationshipTypes:
        DeleteRelationship(src, tgt, rtype)
    \/ ValidateEnvironment

(*
 * Fairness condition - ensures progress
 *)
Fairness ==
    WF_vars(Next)

(*
 * Complete specification
 *)
Spec == Init /\ [][Next]_vars /\ Fairness

-----------------------------------------------------------------------------
(*
 * Liveness Properties
 *)

(*
 * If we try to create an environment, eventually it exists
 * (assuming the action is enabled)
 *)
EnvironmentEventuallyCreated ==
    \A env \in EnvironmentNames:
        [](Cardinality(environments) < MaxEnvironments =>
           <>(env \in environments \/ Cardinality(environments) = MaxEnvironments))

-----------------------------------------------------------------------------
(*
 * Theorems to verify
 *)

(*
 * The safety invariant is preserved by all transitions
 *)
THEOREM Spec => []SafetyInvariant

(*
 * Type safety is maintained
 *)
THEOREM Spec => []TypeInvariant

=============================================================================
\* Modification History
\* Created for Dependency Mapping Tool formal verification
