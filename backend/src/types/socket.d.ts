import { Socket } from 'socket.io';
import { User } from '../models/User.model';

export interface AuthenticatedSocket extends Socket {
  user?: User;
  userId?: string;
}