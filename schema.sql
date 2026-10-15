CREATE TABLE IF NOT EXISTS applications (
 id SERIAL PRIMARY KEY,
 company VARCHAR(160) NOT NULL,
 role VARCHAR(160) NOT NULL,
 applied_on DATE NOT NULL DEFAULT CURRENT_DATE,
 status VARCHAR(20) NOT NULL DEFAULT 'applied' CHECK(status IN ('applied','interview','offer','rejected')),
 url TEXT DEFAULT '', notes TEXT DEFAULT '',
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
