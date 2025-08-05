# Advanced Task Management System

## Overview

The Advanced Task Management System is a comprehensive task management solution built with .NET Core 8 backend and React frontend. The application allows users to create, update, delete, and retrieve tasks with various priorities and statuses, enhanced with visual representations and real-time updates.

## Table of Contents
- [Project Structure](#project-structure)
- [Commercial Approach](#commercial-approach)
- [Application Setup](#application-setup)
- [Application Access](#application-access)
- [Design Decisions](#design-decisions)
- [Technologies Used](#technologies-used)
- [Data Storage](#data-storage)
- [Features](#features)
- [Future Work](#future-work)
- [Testing](#testing)
- [Difficulties and Challenges](#difficulties-and-challenges)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## Project Structure

```
TaskManagementSystem/
├── src/                  # Source code for the project
│   ├── TaskManagement.API/   # Backend API
│   └── TaskManagement.Web/   # Frontend React application
├── tests/                # Test files
│   ├── TaskManagement.API.Tests/
│   └── TaskManagement.Web.Tests/
├── docs/                 # Documentation assets
│   ├── images/           # Screenshots and diagrams
│   └── pdfs/             # PDF documentation
├── README.md             # This file
└── TaskManagementSystem.sln
```

## Commercial Approach

Even though it's overkill to go into this depth for a smaller project, I always find it important to have structure and plan before coding. We code and build for commercial purposes. This custom template I developed helps keep things on track and commercially focused, concentrating on why users would use this rather than why I would build this.

See below this template I developed and used:

### 📄 [VIEW FULL COMMERCIAL ANALYSIS DOCUMENT](/docs/pdfs/task_management_app.pdf) 📄

![Commercial Analysis Template](/docs/images/task_management_app.jpg)

### Business Value First Approach

The development process followed a structured methodology to ensure commercial viability:

1. **Foundation**: Established the core value proposition and key pain points
2. **Story Construction**: Developed the business narrative that drives all design decisions
3. **User Stories Generation**: Translated business needs into specific user requirements
4. **User-Story Mapping**: Organized user journey into logical flow
5. **Wireframe Mockups**: Created visual representations of the solution

### Wireframes

#### Login and Registration
![Login Screen](/docs/images/loginScreen.PNG)
![Signup Screen](/docs/images/signupScreen.PNG)

#### Task Management
![Task Dashboard](/docs/images/taskDashScreen.PNG)
![Task Creation](/docs/images/taskCreateScreen.PNG)
![Task Editing](/docs/images/taskEditScreen.PNG)

#### Audit Trail
![Audit Trail Screen](/docs/images/auditTrailScreen.PNG)

## Application Setup

### Prerequisites

- .NET Core 8 SDK
- Node.js (v16+) and npm
- Git

### Getting Started

1. Clone the repository
   ```bash
   git clone https://github.com/ShiftyKitty/Advanced-Task-Management-System.git
   cd Advanced-Task-Management-System
   ```

2. Backend Setup
   ```bash
   cd src/TaskManagement.API
   dotnet restore
   dotnet run
   ```
   The API will be available at `http://localhost:5271`

  > **Note**: The database will be automatically created and initialized on first run. No manual migration commands are needed.


3. Frontend Setup
   ```bash
   cd src/TaskManagement.Web
   npm install
   npm run dev
   ```
   The frontend will be available at `http://localhost:3000`

Both the API and frontend application must be running simultaneously for the application to function correctly.

## Application Access

### Default Credentials

The application comes with pre-configured user accounts for testing:

| Username | Password | Role  |
|----------|----------|-------|
| admin    | Admin123 | Admin |
| test     | Test123  | User  |

### User Roles

- **Admin**: Access to all features, including the Logs/Audit Dashboard
- **User**: Access to task management features only

> **Note**: I have added my development data to this project for ease of set up and testing. Feel free to use the Sign Up to create a new account to start fresh, make tasks and then login as an Admin to see the general users inputs.


## Design Decisions

### What I Would Do Differently

- Separate front and back end code bases into distinct repositories for better scaling and maintenance
- Implement Role-Based Access Control (RBAC) from the beginning
- Improve the overall design with better styling and consistent UI elements

### Why These Technologies?

I chose Vite+React and .NET Core as technologies I wanted to gain more experience with. While I had some familiarity with them, this project gave me a chance to deepen my understanding by building something practical. Even if the project wasn't perfect, the learning experience made it worthwhile.

## Technologies Used

### Backend
- .NET Core 8
- ASP.NET Core Web API
- Entity Framework Core with SQLite
- JWT Authentication
- xUnit, Moq, FluentAssertions

### Frontend
- React 18
- Vite
- React Router
- Recharts (for visualizations)
- Jest, React Testing Library

## Data Storage

The application uses SQLite for data persistence, with Entity Framework Core as the ORM:

```csharp
// From Program.cs
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection") ?? 
                     "Data Source=taskmanagement.db"));
```

### Database Details

- **Database Type**: SQLite (file-based local database)
- **Database Location**: The database file `taskmanagement.db` is created in the application's root directory
- **ORM**: Entity Framework Core with Code-First approach
- **Database Initialization**: The database is automatically created if it doesn't exist using `context.Database.EnsureCreated()`
- **Seeded Data**: The database is pre-populated with:
  - Sample tasks (high, medium, and low priority examples)
  - Admin user account (username: "admin", password: "Admin123")

> **Note on Challenge Requirements**: The challenge specified "Use only local storage for data persistence." While the implementation uses SQLite instead of browser localStorage, it still satisfies the core requirement of local persistence without requiring external database services. SQLite provides a more robust solution with proper data modeling while maintaining the simplicity of local storage.

### Database Approach

This project uses Entity Framework Core with a Code-First approach and migrations for database management. Migrations were used throughout development to evolve the database schema while preserving data.

#### Migration process used:

1. Make changes to entity model classes
2. Run `Add-Migration MigrationName` to create a migration file
3. Run `Update-Database` to apply the migration to the database

This approach allowed for incremental database schema updates during development without data loss. The database is automatically initialized when the application first runs, including applying any pending migrations and seeding initial data.

For new users, no manual migration commands are needed as the database will be created with the current schema automatically when running the application for the first time (see taskmanagement.db).

### Entity Framework Models

The application includes three main data models:
- `Task`: Stores task information (title, description, priority, due date, status)
- `LogEntry`: Records for the middleware request logging
- `User`: User accounts for authentication

### Data Access

The application uses the Repository pattern through Entity Framework, allowing for:
- CRUD operations on tasks
- Audit logging of all API requests
- User authentication and authorization

## Features

The application implements all required features from the challenge specifications, with additional bonus features:

### Core Requirements Implemented

#### Backend
- **Task Model** with all required properties:
  - Title (string, required)
  - Description (string, optional)
  - Priority (enum: low, medium, high)
  - Due Date (datetime)
  - Status (enum: pending, in progress, completed, archived)

- **API Endpoints**:
  - GET /tasks - Retrieve all tasks
  - POST /tasks - Create a new task
  - PUT /tasks/{id} - Update a specific task
  - DELETE /tasks/{id} - Delete a specific task
  - GET /tasks/{id} - Retrieve a specific task

- **Advanced Requirements**:
  - Custom middleware logging all API requests with method type and endpoint
  - Event-driven logging for high-priority task creation/updates

#### Frontend
- **Task List Page** with filtering by priority and status
- **Task Detail Page** for viewing and modifying specific tasks
- **Create Task Page** with form for creating new tasks

- **Advanced UI Features**:
  - Lazy-loading implementation for task list
  - Dynamic visualizations (pie charts, progress bars) showing task distribution by status
  - Confirmation modal when setting tasks to high priority

### Bonus Features Implemented

- **JWT Authentication**:
  - Secure API endpoints with JWT
  - Login and registration functionality
  - Role-based access for admin features

- **Unit Testing**:
  - Comprehensive tests for both frontend and backend components
  - Testing frameworks: xUnit for backend, Jest for frontend

### Bonus Feature Not Implemented

- **Real-time Updates**: 
  - The ability for changes to reflect across browser tabs without refresh was researched but not implemented due to time constraints

## Future Work

If I were to continue developing this project, I would prioritize the following improvements:

### Architecture Enhancements
- **Separate Repositories**: Split frontend and backend code into separate repositories for better scaling and maintenance
- **Containerization**: Implement Docker containers for consistent deployment across environments
- **CI/CD Pipeline**: Set up automated testing and deployment workflows

### Security & Authentication Improvements
- **Role-Based Access Control (RBAC)**: Implement a more robust permission system beyond basic user/admin roles
- **Multi-Factor Authentication**: Add an additional security layer for sensitive operations
- **Password Recovery**: Implement a secure password reset workflow

### Feature Expansion
- **Real-time Updates**: Implement SignalR or WebSockets to allow changes in one browser tab to immediately reflect in others without refresh
- **Email Notifications**: Add notification system for task assignments and due date reminders
- **Data Export**: Enable exporting tasks and logs in various formats (CSV, PDF)
- **Advanced Filtering**: Implement more sophisticated task search and filtering capabilities

### UI/UX Improvements
- **Enhanced Design System**: Create a more polished, consistent UI with improved responsive behaviour
- **Accessibility Compliance**: Ensure the application meets WCAG standards for accessibility
- **Mobile Optimization**: Better support for mobile devices with touch-friendly interfaces

### Performance Optimizations
- **Caching Strategy**: Implement efficient caching to reduce API calls and improve response times
- **Bundle Optimization**: Improve frontend asset loading and reduce initial load times
- **Pagination Enhancements**: Optimize data loading and scrolling performance for large datasets

## Testing

The project includes comprehensive test suites for both backend and frontend components, implementing one of the bonus challenge requirements.

### Test Structure

```
tests/
├── TaskManagement.API.Tests/    # Backend tests
└── TaskManagement.Web.Tests/    # Frontend tests
```

### Running Tests

#### Prerequisites
- Ensure no instances of the application are running (stop both API and frontend applications)
- Make sure all dependencies are installed

#### Backend Tests
Backend tests are written using xUnit and can be run with:
```bash
cd tests/TaskManagement.API.Tests
dotnet restore
dotnet test
```

#### Frontend Tests
Frontend tests are implemented with Jest and React Testing Library and can be run with:
```bash
cd tests/TaskManagement.Web.Tests
npm install
npm test
```

### Testing Approach

The project employs a comprehensive testing strategy using modern testing frameworks for both backend and frontend components.

#### Backend Testing (C#)

- **Framework**: xUnit as the primary testing framework
- **Mocking**: Moq for creating mock objects of interfaces and services
- **Assertions**: FluentAssertions for more readable, fluent assertion syntax
- **Data Access**: EntityFrameworkCore.InMemory for database testing without external dependencies

Example backend test:
```csharp
// xUnit test with Moq and FluentAssertions
[Fact]
public async Task GetHighPriorityLogs_AsAdmin_ReturnsOnlyHighPriorityLogs()
{
    // Arrange
    SetupUserContext("Admin");
    
    // Act
    var result = await _controller.GetHighPriorityLogs();
    
    // Assert - using FluentAssertions
    result.Value.Should().NotBeNull();
    var logs = result.Value.Should().BeAssignableTo<IEnumerable<LogEntry>>().Subject;
    logs.Should().HaveCount(2);
    logs.Should().AllSatisfy(log => log.Priority.Should().Be("high"));
}
```

#### Frontend Testing (React)

- **Framework**: Jest as the core JavaScript testing framework
- **Component Testing**: React Testing Library for rendering and interacting with components
- **DOM Assertions**: @testing-library/jest-dom for enhanced DOM-related assertions
- **Environment**: jest-environment-jsdom for simulating browser behaviour

Example frontend test:
```javascript
// Jest test with React Testing Library
test('displays logs when fetch is successful', async () => {
    render(<LogsView />);
    
    await waitFor(() => {
        expect(screen.getByTestId('log-item-0')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('log-user-0')).toHaveTextContent('admin');
    expect(screen.getByTestId('log-action-0')).toHaveTextContent('viewed all tasks');
});
```

The frontend testing approach focuses on behaviour rather than implementation details, resulting in tests that are more robust and less susceptible to breaking when implementation changes occur while maintaining the same functionality.

## Difficulties and Challenges

Several technical challenges were encountered during development. Below is a brief account of these:

### Development Environment

- **Package Versioning**: .NET defaults to version 9 when targeting version 8. This required explicit version specification in project files and ensuring all NuGet packages were compatible with .NET Core 8.

- **Vite/React Configuration**: Initial setup with Vite presented challenges with proxy configuration for API communication. This was resolved by implementing a custom proxy in the Vite configuration to handle requests between the frontend (port 3000) and backend (port 5271).

### Testing Challenges

- **Frontend Component Testing**: Testing React components proved challenging due to the tight coupling between component implementation and tests. Pivoting to a behaviour-based testing approach using React Testing Library led to more maintainable tests that focus on functionality rather than implementation details.

- **JWT Testing**: Verifying token expiration required patience and special test cases. Tests were developed to validate the 60-minute token expiration by manipulating the system clock in test environments.

- **Mocking External Dependencies**: Creating realistic mocks for complex service interactions required careful implementation of Moq setups to ensure tests remained focused and isolated.

### Implementation Challenges

- **Custom Middleware Development**: Implementing the logging middleware that captures API requests required deep understanding of ASP.NET Core's request pipeline. Particular attention was needed to ensure the request body could be read without interfering with subsequent middleware components. Rather than just writing logs to a file, I created a structured LogEntry model to store logs in the database, enabling them to be queried, filtered, and displayed in the admin dashboard.

- **High Priority Task Event Logging**: Implementing the event-driven logging for high-priority tasks required establishing a clean separation between the task creation/update logic and the logging system. This was addressed using a publisher-subscriber pattern.

- **JWT Authentication**: Integrating JWT authentication presented challenges in token generation, validation, and proper claims management. Ensuring secure practices while maintaining usability required several iterations.

### Learning Curve

- **Vite and Modern React**: The project intentionally used technologies that were less familiar to gain experience. This learning curve added development time but resulted in valuable insights and skills growth.

- **Advanced ASP.NET Core Features**: Working with middleware, JWT authentication, and event-driven systems in .NET Core 8 required research and experimentation to implement correctly.

## License

This project does not include a specific license file. However, all third-party packages and libraries used in this project are open source and have been used in accordance with their respective licenses.

## Acknowledgments

- This project was developed as part of a coding challenge
- Thank you Conor and Gary for the opportunity
- Special thanks to the open-source community for the libraries used in this project