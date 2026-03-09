
CREATE TYPE link_type AS ENUM ('primary', 'secondary');

CREATE TABLE contacts (
  id bigserial PRIMARY KEY,
  phone_number text,
  email text,
  linked_id bigint,
  link_precedence link_type NOT NULL DEFAULT 'primary',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE contacts
  ADD CONSTRAINT contacts_linked_id_fkey
  FOREIGN KEY (linked_id) REFERENCES contacts(id) ON DELETE SET NULL;