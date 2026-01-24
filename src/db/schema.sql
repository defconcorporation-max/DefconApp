
CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    company_name TEXT,
    plan TEXT DEFAULT 'Standard',
    status TEXT DEFAULT 'Active',
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS social_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    platform TEXT,
    url TEXT,
    username TEXT,
    FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS credentials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    service_name TEXT,
    username TEXT,
    password TEXT, -- In a real app, this should be encrypted. For local app, simple storage might suffice or basic obfuscation.
    FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS content_ideas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'ToDo', -- ToDo, Done, Archived
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shoots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    title TEXT,
    shoot_date DATE,
    status TEXT DEFAULT 'Planned', -- Planned, Completed
    FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shoot_videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shoot_id INTEGER NOT NULL,
    idea_id INTEGER, -- Link to an idea if it came from there
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT 0,
    FOREIGN KEY(shoot_id) REFERENCES shoots(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS commissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    role_name TEXT, -- Seller, Editor, Cameraman
    person_name TEXT,
    rate_type TEXT, -- Percentage, Fixed
    rate_value REAL,
    FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    amount REAL,
    status TEXT, -- Paid, Pending
    date DATE,
    description TEXT,
    FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE
);
