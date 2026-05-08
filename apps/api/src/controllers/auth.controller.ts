import type { Request, Response } from 'express';
import { prisma } from '../config/database';
import { ApiResponse } from '../utils/ApiResponse';
import { catchAsync } from '../utils/catchAsync';
import { ApiError } from '../utils/ApiError';

export class AuthController {
  public login = catchAsync(async (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new ApiError(400, 'Username and password are required');
    }

    // Try to find the user by their name (username) case-insensitively
    const user = await prisma.user.findFirst({
      where: {
        name: {
          equals: username,
          mode: 'insensitive',
        },
      },
    });

    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Verify password using Bun's built-in hasher
    const isPasswordValid = await Bun.password.verify(password, user.password);

    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Usually we would sign a JWT here. For now, since the frontend
    // just relies on the user object being returned, we return a mock token
    // along with the sanitized user details.
    const token = 'mock-jwt-token-replace-later';

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    };

    res.send(new ApiResponse({ user: userData, token }, 'Login successful'));
  });
}
