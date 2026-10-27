import Fastify from "fastify";
import cors from "@fastify/cors";
import prismaPlugin from "./plugins/prisma.js";
import jwtPlugin from "./plugins/jwt.js";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import { env } from "./config/env.js";

export async function buildApp() {
  const app = Fastify({
    logger:
      env.NODE_ENV === "development"
        ? { transport: { target: "pino-pretty" } }
        : true,
  });

  await app.register(cors);
  await app.register(prismaPlugin);
  await app.register(jwtPlugin);

  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: "/api/auth" });

  return app;
}
