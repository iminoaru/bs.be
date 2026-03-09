import express from 'express';
import dotenv from 'dotenv';
import routes from './routes';

dotenv.config();

const app = express();
app.use(express.json());

import path from 'path';
// Use process.cwd() instead of __dirname to ensure Vercel finds the folder correctly from the project root
app.use(express.static(path.join(process.cwd(), 'public')));

app.use('/', routes);

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
