import { UserModel, CreateUserInput } from '../models/User';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
} from '../utils/encryption';
import { AppError } from '../utils/response';

export const AuthService = {
  async register(username: string, email: string, password: string, display_name?: string) {
    // Check if user exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      throw new AppError('USER_EXISTS', 'Email already registered', 409);
    }

    const existingUsername = await UserModel.findByUsername(username);
    if (existingUsername) {
      throw new AppError('USERNAME_EXISTS', 'Username already taken', 409);
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Create user
    const userData: CreateUserInput = {
      username,
      email,
      password_hash,
      display_name,
    };

    const user = await UserModel.create(userData);

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    // Remove password from response
    const { password_hash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 3600,
    };
  },

  async login(email: string, password: string) {
    // Find user
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    // Verify password
    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    // Update last login
    await UserModel.updateLastLogin(user.id);

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    // Remove password from response
    const { password_hash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 3600,
    };
  },
};
