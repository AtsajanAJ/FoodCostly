import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { ac, organizationRoles } from "@/server/auth/permissions";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    organization({
      ac,
      roles: organizationRoles,
      allowUserToCreateOrganization: true,
      organizationLimit: 10,
      creatorRole: "owner",
      schema: {
        organization: {
          additionalFields: {
            currency: {
              type: "string",
              required: false,
              defaultValue: "THB",
              input: true,
            },
            timezone: {
              type: "string",
              required: false,
              defaultValue: "Asia/Bangkok",
              input: true,
            },
            locale: {
              type: "string",
              required: false,
              defaultValue: "en",
              input: true,
            },
          },
        },
      },
    }),
    nextCookies(),
  ],
  trustedOrigins: [env.BETTER_AUTH_URL],
});

export type Session = typeof auth.$Infer.Session;
