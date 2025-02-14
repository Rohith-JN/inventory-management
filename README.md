# Inventory Management System

## Overview
This is a simple Inventory Management System built using Node.js, Express, PostgreSQL, and Docker. The application supports basic CRUD operations for inventory items and includes user authentication using JWT (JSON Web Token). Additionally, it has an IP-based rate limiter to enhance security.

## Features
- **User Authentication**: JWT-based authentication for secure login and signup.
- **CRUD Operations**: Users can create, read, update, and delete inventory items.
- **Database**: PostgreSQL as the database backend.
- **Containerization**: The app is containerized using Docker for easy deployment.
- **Rate Limiting**: IP-based rate limiting to prevent abuse.

## Tech Stack
- Node.js
- Express.js
- PostgreSQL
- JWT Authentication
- Docker

## Setup Instructions

### Prerequisites
Make sure you have the following installed on your system:
- [Node.js](https://nodejs.org/)
- [Docker](https://www.docker.com/)
- [PostgreSQL](https://www.postgresql.org/) (If running locally without Docker)

### Clone the Repository
```bash
git clone https://github.com/Rohith-JN/inventory-management.git
cd inventory-management
```

### Environment Variables
Create a `.env` file in the root directory and configure it with the following variables:
```
JWT_SECRET=
PORT=
PGDATABASE=
PGHOST=
PGPASSWORD=
PGPORT=
PGUSER=
NODE_ENV=
DATABASE_URL=
```

### Running the Project with Docker
1. **Build and Start Containers:**
   ```bash
   docker-compose up --build```
2. The server should now be running at `http://localhost:${PORT}`.

### API Endpoints
| Method | Endpoint              | Description                   |
|--------|-----------------------|-------------------------------|
| POST   | /signup               | Register a new user           |
| POST   | /login                | Login and receive a JWT token |
| GET    | /getItems/:uid        | Get all inventory items       |
| GET    | /getItem/:id/:uid     | Get a specific item by ID     |
| POST   | /createItem/:uid      | Create a new inventory item   |
| PUT    | /updateItem/:id/:uid  | Update an existing item       |
| DELETE | /deleteItem/:id/:uid  | Delete an item                |

### Authentication
- Use the `Authorization: Bearer <token>` header for authenticated routes.