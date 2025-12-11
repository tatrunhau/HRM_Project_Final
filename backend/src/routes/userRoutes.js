import express from 'express';
import { authme } from '../controllers/UserController.js';

const router = express.Router();

router.get('/authme', authme);

export default router;
