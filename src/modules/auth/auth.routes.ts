import type { FastifyInstance } from "fastify";
import { registerSchema, loginSchema } from "./auth.schema.js";
import { registerUser, loginUser, AuthError } from "./auth.service.js";

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/register", async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: "Validation error", errors: parsed.error.flatten().fieldErrors });
    }

    try {
      const user = await registerUser(fastify, parsed.data);
      const token = fastify.jwt.sign({ sub: user.id, email: user.email });
      return reply.code(201).send({
        user: { id: user.id, email: user.email, name: user.name },
        token,
      });
    } catch (err) {
      if (err instanceof AuthError) {
        return reply.code(409).send({ message: err.message });
      }
      throw err;
    }
  });

  fastify.post("/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: "Validation error", errors: parsed.error.flatten().fieldErrors });
    }

    try {
      const user = await loginUser(fastify, parsed.data);
      const token = fastify.jwt.sign({ sub: user.id, email: user.email });
      return reply.send({
        user: { id: user.id, email: user.email, name: user.name },
        token,
      });
    } catch (err) {
      if (err instanceof AuthError) {
        return reply.code(401).send({ message: err.message });
      }
      throw err;
    }
  });

  fastify.get("/me", { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const user = await fastify.prisma.user.findUnique({ where: { id: request.user.sub } });
    if (!user) {
      return reply.code(404).send({ message: "User not found" });
    }
    return reply.send({ id: user.id, email: user.email, name: user.name });
  });
}
