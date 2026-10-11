# InfoSeva — Sustainable AI-Based RTI Search And Public Information Assistance

**Making public information easier to discover, understand, and manage.**

InfoSeva is an AI-assisted public information platform designed to help citizens discover relevant information, explore government schemes and public resources, search for related Right to Information (RTI) information, and prepare RTI application drafts. It also provides information-management capabilities to support document organization, content review, and content-gap identification.

By combining a React-based user interface, Spring Boot backend services, and a Python-based AI service, InfoSeva brings information discovery and management capabilities together in one platform.

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Our Approach](#our-approach)
- [Key Features](#key-features)
- [User Roles](#user-roles)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [AI and Information Retrieval](#ai-and-information-retrieval)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration and Security](#configuration-and-security)
- [Project Scope and Limitations](#project-scope-and-limitations)
- [Future Improvements](#future-improvements)
- [Contributing](#contributing)
- [Disclaimer](#disclaimer)

---

## Overview

Accessing relevant public information can be challenging when information is distributed across documents, categories, departments, and different sources. Traditional keyword-based searching may also miss useful information when a user's wording differs from the terminology used in existing records.

**InfoSeva addresses this challenge through AI-assisted information discovery and structured information management.**

The platform combines citizen-facing information services with administrative capabilities, including content organization, review workflows, and content-gap identification. Its RTI assistance features support the discovery of related information and the preparation of RTI drafts.

### Project Goals

- Simplify the discovery of relevant public information.
- Support meaning-based information retrieval beyond exact keyword matching.
- Help users explore information about public schemes and related resources.
- Assist users in preparing RTI application drafts.
- Support structured document management and content review.
- Help information managers identify content gaps and organize information more effectively.

## Problem Statement

Public information is often spread across different records and sources, making relevant information difficult to locate efficiently. Differences in terminology and phrasing can limit conventional keyword searches, even when useful information exists.

At the same time, managing a growing information repository introduces additional challenges, including document organization, content verification, review-queue management, and identifying areas where relevant information may be missing.

InfoSeva aims to address these challenges through an integrated platform for information discovery, AI-assisted assistance, and structured content management.

## Our Approach

InfoSeva brings together three complementary capabilities:

1. **Information discovery** — helps users explore relevant public information through structured browsing and AI-assisted search.
2. **RTI assistance** — supports searching for related RTI information and preparing application drafts.
3. **Information management** — provides management-oriented interfaces for handling documents, reviewing content, monitoring content gaps, and managing public-information resources.

The platform is organized as separate frontend, backend, and AI-service components to keep presentation, application logic, authentication, and AI-related processing distinct.

## Key Features

### Citizen Services

- **Public information discovery:** Explore available information and resources through the application.
- **Government schemes:** Browse scheme-related information provided through the platform.
- **RTI assistance:** Access the RTI-related features available in the application.
- **RTI draft generation:** Generate a draft based on the user's provided information and the supported AI workflow.
- **AI assistant:** Interact with the AI-assisted question-and-answer functionality.
- **Document and information access:** Access available documents and related public-information resources.
- **Summarization:** Use AI-assisted summarization for supported content.
- **Complaints and feedback:** Access the application's complaint and feedback features.
- **Notices and notifications:** View available notices and notification-related information.

### Information Management

- **Document management:** Work with public-information documents through the management interface.
- **Review workflows:** Support the review of information before it is made available through the relevant workflow.
- **Content-gap identification:** Help identify areas where additional information may be required.
- **Structured information management:** Organize information using application-supported categories and metadata.
- **Dashboard views:** Access management-oriented summaries and operational information.

*Feature availability and behavior depend on the implemented application workflows and the configured data sources.*

## User Roles

InfoSeva includes role-oriented interfaces designed for different responsibilities.

| Role              | Primary purpose                                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Citizen**       | Discover public information and use the citizen-facing assistance features, including RTI-related functionality. |
| **Data Manager**  | Work with information-management tasks such as document handling, content gaps, and review-related workflows.    |
| **Administrator** | Access administrative functionality and responsibilities provided by the application.                            |

Access to protected functionality is managed through the application's authentication and authorization mechanisms.

## System Architecture

InfoSeva follows a service-oriented architecture with a React frontend, Java-based backend services, and a Python-based AI service.

```text
                 ┌──────────────────────┐
                 │     React Frontend   │
                 │       Port 3000      │
                 └──────────┬───────────┘
                            │
                 ┌──────────▼───────────┐
                 │     Auth Service     │
                 │     Spring Boot      │
                 │       Port 8081      │
                 └──────────┬───────────┘
                            │
                 ┌──────────▼───────────┐
                 │   InfoSeva Service   │
                 │     Spring Boot      │
                 │       Port 8082      │
                 └───────┬───────┬──────┘
                         │       │
              ┌──────────▼──┐ ┌──▼────────────────┐
              │ Oracle DB   │ │ Python AI Service │
              │ Application│ │    Port 8000      │
              │    Data     │ └────────┬──────────┘
              └─────────────┘          │
                              ┌────────▼─────────┐
                              │ AI / Retrieval   │
                              │ Components       │
                              │ Gemini, ChromaDB │
                              │ and Embeddings   │
                              └──────────────────┘

                     MongoDB supports
                  configured document data
```

The diagram illustrates the intended service relationships. Exact runtime behavior depends on the configuration and availability of each service.

### Architecture Responsibilities

- **Frontend:** Provides the user interface and communicates with the backend.
- **Authentication service:** Handles authentication-related functionality and JWT-based security.
- **InfoSeva service:** Implements core application functionality, business logic, protected APIs, and communication with the AI service.
- **AI service:** Provides AI-assisted capabilities, including supported retrieval, question-answering, summarization, and RTI-related workflows.
- **Oracle Database:** Stores application data configured for relational persistence.
- **MongoDB and ChromaDB:** Support the document-oriented and vector-retrieval components used by the configured AI and information workflows.

## Technology Stack

| Layer                      | Technologies                                                          |
| -------------------------- | --------------------------------------------------------------------- |
| Frontend                   | React, React Router, Tailwind CSS, Axios                              |
| UI and visualization       | Framer Motion, Recharts, Lucide                                       |
| Core backend               | Java 21, Spring Boot                                                  |
| Authentication             | Spring Security, JWT, Google OAuth2 integration                       |
| AI backend                 | Python, FastAPI                                                       |
| Language model integration | Google Gemini API                                                     |
| Semantic retrieval         | Embeddings, ChromaDB, retrieval-augmented generation (RAG) components |
| Relational database        | Oracle Database                                                       |
| Document database          | MongoDB                                                               |
| API documentation          | OpenAPI / Swagger support                                             |
| Testing                    | Backend and AI-service test suites are included in the project        |

Technology versions and individual integrations should be checked against the configuration files in the current repository before making release-specific claims.

## AI and Information Retrieval

InfoSeva incorporates AI components to support selected information-assistance workflows.

### Semantic Retrieval

Semantic retrieval represents text as numerical embeddings so that a query can be compared with stored text based on similarity in meaning. This can help identify relevant content even when the user's wording differs from the wording in a stored document.

### Retrieval-Augmented Generation

The configured retrieval-augmented generation (RAG) approach combines retrieved content with a language model to support responses grounded in available information.

### AI-Assisted Capabilities

The AI service includes workflows for supported operations such as:

- Question answering and conversational assistance
- Document upload and processing
- Summarization
- RTI-related assistance and draft generation
- Embedding-based information retrieval

The usefulness and accuracy of the output depend on the quality, coverage, and relevance of the available source material, along with the behavior of the configured language model.

## Project Structure

The repository is organized into frontend and backend components.

```text
InfoSeva/
├── Frontend/
│   └── React application
│
└── Backend/
    ├── auth-service/
    │   └── Spring Boot authentication service
    │
    ├── infoseva-service/
    │   └── Spring Boot core application service
    │
    ├── user-service/
    │   └── User-related backend component
    │
    └── ai-service/
        └── Python AI and retrieval service
```

This is a high-level overview; each service contains its own source files and configuration.

## Getting Started

InfoSeva consists of multiple services. Each component must be configured and started according to its own dependencies.

### Prerequisites

Install the tools required by the components you intend to run:

- Git
- Node.js and npm
- Java Development Kit (JDK) 21
- Maven, or use the Maven Wrapper if provided
- Python and pip, compatible with the AI service's requirements
- Oracle Database configured for the application
- MongoDB configured for the relevant document workflows
- API credentials for external AI or OAuth integrations when those features are enabled

### 1. Clone the Repository

```bash
git clone https://github.com/abirami-302/InfoSeva-Sustainable-AI-Based-RTI-Search-Public-Information-Assistance-System.git
cd InfoSeva
```

### 2. Configure Environment Variables

Review the example environment and configuration templates supplied in the repository.

Configure the required values for:

- Oracle and MongoDB connections
- JWT signing and validation
- Google Gemini API access
- Google OAuth2, if enabled
- Email or SMS integrations, if enabled
- Service URLs and ports

Use the configuration expected by each service. Do not commit actual credentials or private environment files.

### 3. Start the AI Service

Navigate to the AI-service directory:

```bash
cd Backend/ai-service
```

Create and activate a Python virtual environment, install the dependencies listed in the service's requirements file, and configure the required environment variables.

For example, on Windows:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Start the application using the FastAPI entry point and run command specified by the current source code or project configuration.

### 4. Start the Spring Boot Services

Open a terminal for each required Java service:

- `Backend/auth-service`
- `Backend/infoseva-service`

Review each service's configuration and Maven dependencies before starting it. If the repository includes a Maven Wrapper, it can be used instead of a separately installed Maven distribution.

Ensure that the configured database connections, service ports, and JWT settings are consistent across the services.

### 5. Start the Frontend

Navigate to the frontend directory:

```bash
cd Frontend
npm install
```

Start the frontend using the development script defined in `package.json`.

Ensure that the frontend's configured backend URL points to the running authentication and application services.

**Important:** These steps describe the setup process at a high level. The exact entry points, environment-variable names, database initialization steps, and startup commands must be verified against the current repository configuration before use.

## Configuration and Security

InfoSeva uses multiple services and external integrations, so configuration and credential management are important.

- Keep `.env` files and private configuration files out of version control.
- Use the provided example configuration files as templates.
- Never place API keys, OAuth client secrets, database passwords, SMTP passwords, or production JWT secrets in source code.
- Use strong, environment-supplied JWT secrets and consistent validation settings across services.
- Restrict access to protected APIs according to the intended application roles.
- Review authentication, authorization, and external-service settings before deployment.

Do not use development credentials or placeholder secrets in a production environment.

## Project Scope and Limitations

InfoSeva is an AI-assisted information discovery and management application. Its output should be interpreted in the context of the information available to the system.

- AI-generated responses may contain errors or incomplete information.
- Retrieved information may be limited by the documents and sources indexed by the application.
- Generated RTI drafts should be reviewed and completed by the user before submission.
- The platform does not guarantee that every relevant public record or RTI response is available.
- Availability of external services depends on their configuration and operation.

## Future Improvements

Potential areas for further development include:

- Expanding the coverage and quality of indexed public-information sources.
- Improving source attribution and verification in search results.
- Strengthening retrieval evaluation and response-quality testing.
- Enhancing multilingual information discovery.
- Improving document-review workflows and content-gap reporting.
- Adding deployment automation, observability, and operational monitoring.

These are improvement opportunities, not claims that the features are already implemented.

## Contributing

Contributions that improve correctness, usability, security, accessibility, testing, or documentation are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make focused changes and add relevant tests.
4. Verify that no secrets or private data are included.
5. Submit a pull request describing the changes and their purpose.

## Disclaimer

InfoSeva is an independent software project intended to support public-information discovery and assistance. It is not an official government portal and does not represent or imply affiliation with any government department.

AI-generated information and RTI drafts should be verified by the user before being relied upon or submitted to an authority.

---

**InfoSeva — Bridging the gap between public information and the people who need it.**
