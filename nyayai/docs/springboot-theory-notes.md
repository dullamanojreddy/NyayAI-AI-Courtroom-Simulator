# SpringBoot Theory Notes (Unit-III)

These notes are provided for syllabus coverage.

## Introduction to Spring
- Spring is a Java framework that supports dependency injection and modular enterprise development.
- Spring Boot simplifies Spring setup using auto-configuration and starter dependencies.

## SpringBoot Architecture
- `@SpringBootApplication` bootstraps the app.
- Embedded server (Tomcat/Jetty) runs the web app without external deployment.
- Layers commonly include Controller, Service, Repository, and Model.

## Installation using Spring Initializr
- Choose Project (Maven/Gradle), Language (Java), and Spring Boot version.
- Add dependencies (Web, Data JPA, MongoDB/MySQL, etc.).
- Generate and import into IDE.

## Building a Web Application
- Define REST endpoints with `@RestController` and mapping annotations.
- Use services for business logic and repositories for data access.

## Dependency Injection
- Spring container creates and injects objects (`@Component`, `@Service`, constructor injection).
- Improves testability and modularity.

## Database Connectivity in SpringBoot
- Configure datasource in `application.properties` or `application.yml`.
- Use Spring Data repositories for CRUD operations.
