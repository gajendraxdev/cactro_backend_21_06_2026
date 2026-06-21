import argon2 from "argon2";
import type { FastifyInstance } from "fastify";
import { prisma } from "@event-booking/db";
import { UserRole, type JwtPayload } from "@event-booking/types";
import { AppError } from "../../utils/app-error.js";
import type { LoginInput, RegisterInput } from "./auth.schema.js";

type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
};

type AuthResult = {
  user: PublicUser;
  accessToken: string;
};

export class AuthService {
  constructor(private readonly app: FastifyInstance) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new AppError("Email already registered", 409);
    }

    const hashedPassword = await argon2.hash(input.password);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: hashedPassword,
        role: input.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    const token = this.createToken({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
    });

    return {
      user: { ...user, role: user.role as UserRole },
      accessToken: token,
    };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    const isValidPassword = await argon2.verify(user.password, input.password);

    if (!isValidPassword) {
      throw new AppError("Invalid email or password", 401);
    }

    const token = this.createToken({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as UserRole,
        createdAt: user.createdAt,
      },
      accessToken: token,
    };
  }

  private createToken(payload: JwtPayload): string {
    return this.app.jwt.sign(payload);
  }
}