# Dependency Mapping Tool

A desktop application for visualizing and managing service dependencies across multiple deployment environments. Built with Tauri, React, and Rust.

![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-blue)
![Version](https://img.shields.io/badge/version-0.1.0-green)
![License](https://img.shields.io/badge/license-MIT-purple)

## Overview

The Dependency Mapping Tool helps engineering teams understand and document the relationships between microservices, databases, message queues, and other infrastructure components. It provides an interactive graph visualization that makes it easy to explore how services connect and depend on each other.

## Features

### Interactive Dependency Graph
- **Visual graph representation** of services and their relationships using Cytoscape.js
- **Click-to-explore** navigation - click on any service to center the graph on it
- **Zoom and pan** controls for navigating large architectures
- **Depth control** to show 1, 2, or 3 levels of dependencies
- **Multiple layout algorithms** including force-directed and hierarchical layouts

### Multi-Environment Support
- **Isolated environments** for dev, staging, production, or custom environments
- **Easy switching** between environments via dropdown
- **Create new environments** directly from the UI
- Each environment maintains its own set of services and relationships

### Service Management
- **Create, edit, and delete services** with a full-featured editor
- **Service types**: API, Database, Cache, Queue, Gateway, Frontend, Backend, External, Identity Provider
- **Health status tracking**: Healthy, Degraded, Unhealthy, Unknown, Deprecated
- **Rich metadata**: Version, owner, team, description, tags, and custom key-value pairs
- **Tag autocomplete** from existing tags in the environment

### Relationship Management
- **Define dependencies** between services with descriptive relationship types
- **Relationship types**: depends_on, communicates_with, authenticates_via, reads_from, writes_to, publishes, subscribes
- **Visual differentiation** with color-coded edges based on relationship type
- **Bidirectional view** showing both incoming and outgoing dependencies

### Filtering & Search
- **Filter by service type** - show/hide specific categories (APIs, databases, etc.)
- **Filter by status** - focus on healthy, degraded, or problematic services
- **Filter by relationship type** - isolate specific dependency patterns
- **Full-text search** across service names, descriptions, tags, and owners

### Data Validation
- **Built-in validation panel** to check data integrity
- **Detects issues** like orphaned relationships, missing references, circular dependencies
- **Severity levels**: Errors, warnings, and informational notices
- **Click-to-highlight** affected services in the graph

### Data Storage
- **File-based storage** using JSON files for easy version control
- **Human-readable format** for manual editing if needed
- **Per-environment directories** keeping data isolated
- **No database required** - works entirely with local files

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://rustup.rs/) 1.70+
- Platform-specific dependencies for Tauri ([see docs](https://tauri.app/v1/guides/getting-started/prerequisites))

### Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/DependencyMappingTool.git
cd DependencyMappingTool

# Install dependencies
npm install

# Run in development mode
npm run tauri dev
```

### Production Build

```bash
# Build for your current platform
npm run tauri build
```

Build outputs are located in:
- **macOS**: `src-tauri/target/release/bundle/macos/Dependency Mapping Tool.app`
- **macOS DMG**: `src-tauri/target/release/bundle/dmg/Dependency Mapping Tool_0.1.0_aarch64.dmg`
- **Windows**: `src-tauri/target/release/bundle/msi/`
- **Linux**: `src-tauri/target/release/bundle/deb/` or `appimage/`

## Data Format

### Directory Structure

```
data/
├── dev/
│   ├── services/
│   │   ├── api-gateway.json
│   │   ├── user-service.json
│   │   └── ...
│   └── relationships.json
├── staging/
│   ├── services/
│   └── relationships.json
└── prod/
    ├── services/
    └── relationships.json
```

### Service Schema

```json
{
  "id": "api-gateway",
  "name": "API Gateway",
  "serviceType": "gateway",
  "status": "healthy",
  "description": "Main entry point for all API requests",
  "version": "2.4.1",
  "owner": "platform-team",
  "team": "Platform Engineering",
  "tags": ["critical", "public-facing"],
  "metadata": {
    "repository": "https://github.com/org/api-gateway",
    "port": 8080,
    "replicas": 3
  }
}
```

### Relationships Schema

```json
[
  {
    "id": "rel-001",
    "source": "api-gateway",
    "target": "auth-service",
    "relationshipType": "authenticates_via",
    "description": "Validates JWT tokens for all requests"
  },
  {
    "id": "rel-002",
    "source": "user-service",
    "target": "postgres-users",
    "relationshipType": "reads_from",
    "description": "Queries user profiles and preferences"
  }
]
```

## Service Types

| Type | Description | Color |
|------|-------------|-------|
| `api` | REST or GraphQL API service | Blue |
| `database` | Persistent data storage | Orange |
| `cache` | In-memory cache (Redis, Memcached) | Red |
| `queue` | Message queue (RabbitMQ, Kafka) | Yellow |
| `gateway` | API gateway or load balancer | Purple |
| `frontend` | Web or mobile frontend | Cyan |
| `backend` | Backend processing service | Green |
| `external` | Third-party or external service | Gray |
| `identity-provider` | Authentication/identity service | Pink |

## Relationship Types

| Type | Description | Use Case |
|------|-------------|----------|
| `depends_on` | Hard dependency required to function | Service won't work without target |
| `communicates_with` | Makes HTTP/RPC calls | API-to-API communication |
| `authenticates_via` | Uses for authentication | OAuth, JWT validation |
| `reads_from` | Reads data from target | Database queries |
| `writes_to` | Writes data to target | Database inserts/updates |
| `publishes` | Publishes messages/events | Event producers |
| `subscribes` | Subscribes to messages/events | Event consumers |

## Architecture

### Tech Stack

- **Frontend**: React 18, TypeScript, Chakra UI, Cytoscape.js, Zustand
- **Backend**: Rust, Tauri 2.0
- **Build**: Vite, Cargo

### Project Structure

```
├── src/                    # React frontend
│   ├── components/         # UI components
│   │   ├── graph/          # Dependency graph visualization
│   │   ├── editor/         # Service/relationship editors
│   │   ├── filters/        # Filter panel components
│   │   ├── navigation/     # Search, breadcrumbs, env switch
│   │   ├── validation/     # Data validation panel
│   │   ├── details/        # Service detail panel
│   │   └── layout/         # App layout components
│   ├── store/              # Zustand state management
│   ├── services/           # Tauri IPC wrappers
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── src-tauri/              # Rust backend
│   └── src/
│       ├── commands/       # Tauri command handlers
│       ├── models/         # Data models
│       ├── state/          # Application state
│       └── storage/        # File I/O operations
├── data/                   # Sample data files
└── specs/                  # TLA+ formal specification
```

## Formal Specification

The `specs/` directory contains a TLA+ formal specification of the application's core state management logic. This can be used to verify safety properties like:

- No duplicate service IDs within an environment
- Relationships always reference existing services
- Current environment always exists

See [specs/README.md](specs/README.md) for details on running the model checker.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + F` | Focus search bar |
| `Escape` | Close modals/panels |
| `Enter` | Submit forms |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Tauri](https://tauri.app/) - Desktop app framework
- [Cytoscape.js](https://js.cytoscape.org/) - Graph visualization
- [Chakra UI](https://chakra-ui.com/) - React component library
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
