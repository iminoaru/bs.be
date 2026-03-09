# Bitespeed Identity Reconciliation

Node.js, Express, TypeScript, Supabase (PostgreSQL)

## ENV Variables
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
PORT=3000
```

## POST /identify

**Request Body**
```json
{
  "email": "<text>",
  "phoneNumber": "<number>"
}
```


