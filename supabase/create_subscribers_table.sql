-- Membuat ENUM untuk status subscriber
CREATE TYPE subscriber_status AS ENUM ('UNVERIFIED', 'VERIFIED', 'UNSUBSCRIBED');

-- Membuat tabel subscribers
CREATE TABLE subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    status subscriber_status DEFAULT 'UNVERIFIED',
    verification_token UUID,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menambahkan indeks untuk mempercepat pencarian (opsional tapi disarankan)
CREATE INDEX idx_subscribers_email ON subscribers(email);
CREATE INDEX idx_subscribers_status ON subscribers(status);

-- Membuat fungsi trigger untuk update otomatis `updated_at`
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Menerapkan trigger ke tabel subscribers
CREATE TRIGGER update_subscribers_modtime
BEFORE UPDATE ON subscribers
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
