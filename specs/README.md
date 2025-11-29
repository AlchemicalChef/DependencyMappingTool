# TLA+ Formal Specification

This directory contains a TLA+ formal specification of the Dependency Mapping Tool's core state management logic.

## Overview

The specification models:

- **Environments**: Isolated contexts (dev, staging, prod) containing services and relationships
- **Services**: Nodes in the dependency graph with id, type, and status
- **Relationships**: Directed edges between services with relationship types

## Files

- `DependencyMappingTool.tla` - The main TLA+ specification
- `DependencyMappingTool.cfg` - TLC model checker configuration

## Safety Properties Verified

1. **CurrentEnvironmentValid**: The current environment always exists (or is unset)
2. **NoDuplicateServiceIds**: No duplicate service IDs within any environment
3. **RelationshipsHaveValidEndpoints**: All relationships reference existing services
4. **NoSelfRelationships**: Services cannot have relationships with themselves

## Running the Model Checker

### Prerequisites

Install the TLA+ Toolbox or TLC command-line tools:
- [TLA+ Toolbox](https://lamport.azurewebsites.net/tla/toolbox.html) (GUI)
- [TLC command-line](https://github.com/tlaplus/tlaplus/releases)

### Using TLA+ Toolbox

1. Open the TLA+ Toolbox
2. File → Open Spec → Add New Spec
3. Select `DependencyMappingTool.tla`
4. Create a new model (TLC Model Checker → New Model)
5. Configure constants as in the `.cfg` file
6. Run the model checker

### Using Command Line

```bash
# From the specs directory
tlc DependencyMappingTool.tla -config DependencyMappingTool.cfg
```

## Key Design Decisions

### Safe vs Unsafe Delete

The specification includes both `SafeDeleteService` and `UnsafeDeleteService`:

- **SafeDeleteService**: Removes all relationships involving the service before deleting it. This maintains the `RelationshipsHaveValidEndpoints` invariant.
- **UnsafeDeleteService**: Only removes the service, potentially leaving orphaned relationships. This is included to demonstrate what the invariants catch.

The `Next` relation uses `SafeDeleteService` to ensure invariants are maintained.

### State Space

The configuration uses small bounds to keep model checking tractable:
- 3 service IDs
- 2 environments
- 3 service types
- 2 relationship types

For more thorough checking, increase these values (at the cost of longer runtime).

## Mapping to Implementation

| TLA+ Concept | Implementation |
|--------------|----------------|
| `environments` | `availableEnvironments` in servicesStore |
| `currentEnvironment` | `currentEnvironment` in servicesStore |
| `services[env]` | Services loaded per environment |
| `relationships[env]` | Relationships loaded per environment |
| `CreateEnvironment` | `create_environment` Tauri command |
| `CreateService` | `save_service` Tauri command (new service) |
| `SafeDeleteService` | `delete_relationships_for_service` + `delete_service` |
| `CreateRelationship` | `save_relationship` Tauri command |

## Extending the Specification

To add new features:

1. Add new state variables if needed
2. Define new actions with preconditions and effects
3. Add the action to the `Next` relation
4. Define any new invariants
5. Update the configuration file
