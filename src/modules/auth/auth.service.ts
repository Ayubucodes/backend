import bcrypt from "bcrypt";
import type { FastifyInstance } from "fastify";
import type { RegisterInput, LoginInput } from "./auth.schema.js";

const SALT_ROUNDS = 10;

export class AuthError extends Error {}

export async function registerUser(fastify: FastifyInstance, input: RegisterInput) {
  const existing = await fastify.prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AuthError("Email already in use");
  }

  const hashed = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await fastify.prisma.user.create({
    data: {
      email: input.email,
      password: hashed,
      name: input.name ?? null,
    },
  });

  return user;
}

export async function loginUser(fastify: FastifyInstance, input: LoginInput) {
  const user = await fastify.prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new AuthError("Invalid email or password");
  }

  const valid = await bcrypt.compare(input.password, user.password);
  if (!valid) {
    throw new AuthError("Invalid email or password");
  }

  return user;
}
