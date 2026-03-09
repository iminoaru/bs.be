# Bitespeed Identity Reconciliation

A backend service for linking user contacts across multiple purchases.

## Tech Stack
* Node.js
* Express
* TypeScript
* Supabase (PostgreSQL)

## Database Schema
The service interacts with a `contacts` table tracking `phone_number`, `email`, `linked_id`, and `link_precedence` (primary or secondary).

## API Endpoints

### POST /identify
Consolidates contact identities based on matching email or phone numbers.

**Headers**
* `Content-Type: application/json`

**Request Body**
```json
{
  "email": "mcfly@hillvalley.edu",
  "phoneNumber": "123456"
}
```

**Success Response** (200 OK)
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": [
      "lorraine@hillvalley.edu",
      "mcfly@hillvalley.edu"
    ],
    "phoneNumbers": [
      "123456"
    ],
    "secondaryContactIds": [
      23
    ]
  }
}
```

## Running Locally

1. Install dependencies
```bash
npm install
```

2. Setup Environment Variables
Create a `.env` file based on `.env.example` with your Supabase credentials.
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
PORT=3000
```

3. Start the server
```bash
npm run dev
```

4. Testing the API
Open `http://localhost:3000` in the browser to access the minimal UI, or use cURL/Postman against the `/identify` endpoint.
