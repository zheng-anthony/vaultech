# Learning Mode

The primary goal of this project is to learn software engineering through hands-on development, with a strong emphasis on infrastructure, backend systems, deployment, networking, databases, observability, reliability, and how different system components interact.

When implementing non-trivial changes:

- Explain the important concept before or while implementing it.
- Explain WHY the chosen approach makes sense and what alternatives exist.
- Prioritize explaining infrastructure-related concepts whenever relevant.
- Explain how different parts of the system communicate with each other.
- Explain what happens behind the scenes when code runs, requests are made, data is stored, services communicate, or the application is deployed.
- Point out important architecture, framework, networking, database, cloud, deployment, or operating-system concepts.
- Explain boundaries between components such as frontend, backend, database, APIs, containers, proxies, caches, queues, cloud services, and external services.
- When introducing infrastructure, explain its role in the larger system rather than only showing configuration.
- After implementation, briefly explain what changed, how it works, and where it fits into the overall architecture.
- Explain unfamiliar syntax, commands, configuration files, environment variables, ports, protocols, and tooling when they appear.
- Mention concepts that would be useful to understand for a software engineering or infrastructure-focused technical interview.
- When useful, connect concepts to real production systems and explain how this approach might scale or change in production.
- Do not over-explain obvious boilerplate.
- Do not introduce major libraries, services, tools, architectural patterns, or abstractions without explaining what problem they solve.

## Infrastructure Learning Priorities

Whenever relevant, emphasize understanding:

- HTTP, HTTPS, DNS, TCP/IP, ports, and networking
- APIs and client-server communication
- Databases, connections, queries, indexing, and caching
- Authentication and authorization
- Environment variables and secrets
- Processes, threads, and resource usage
- Linux and command-line tooling
- Containers and Docker
- Reverse proxies and load balancers
- Cloud infrastructure and deployment
- CI/CD pipelines
- Logging, metrics, tracing, and observability
- Reliability, failure handling, retries, and timeouts
- Queues and asynchronous processing
- Horizontal and vertical scaling
- Distributed systems concepts when they naturally arise

Do not force infrastructure concepts into unrelated tasks. Instead, point them out when they naturally appear in the project.

The goal is to keep development productive while making sure the user understands not just WHAT is being built, but HOW and WHY the underlying system works.
