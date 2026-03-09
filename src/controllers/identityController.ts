import { Request, Response } from 'express';
import { reconcileIdentity } from '../services/identityService';

export const identify = async (req: Request, res: Response) => {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
        return res.status(400).json({ error: 'Either email or phoneNumber must be provided.' });
    }

    const emailStr = email ? String(email) : undefined;
    const phoneStr = phoneNumber ? String(phoneNumber) : undefined;

    try {
        const result = await reconcileIdentity(emailStr, phoneStr);
        return res.status(200).json(result);
    } catch (error) {
        console.error('Error in identify:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
