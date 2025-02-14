// SQL query to create users table
export const createUserTableQuery = ` 
    CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL
    );
`;

// SQL query to create items table
export const createItemTableQuery = `
    CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    uid INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL,
    FOREIGN KEY (uid) REFERENCES users(id) ON DELETE CASCADE
);`;

// SQL query to check if tables exist
export const tableExistsQuery = `
    SELECT tablename, EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = ANY($1)
    ) AS exists
    FROM (VALUES ('users'), ('items')) AS t(tablename);
`;
