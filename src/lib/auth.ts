import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin, emailOTP } from "better-auth/plugins";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/server/email";
import { destroyAsset } from "@/lib/server/cloudinary";
import { OtpEmail, otpSubject } from "@/emails/OtpEmail";
import { WelcomeEmail } from "@/emails/WelcomeEmail";
import { SITE } from "@/lib/site";

const appUrl = process.env.BETTER_AUTH_URL ?? SITE.url;

export const auth = betterAuth({
  appName: "KAMPLY",
  baseURL: appUrl,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, { provider: "postgresql" }),
  trustedOrigins: [appUrl, SITE.url, "https://kamply.site", "https://www.kamply.site", ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : [])],

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
  },

  emailVerification: {
    autoSignInAfterVerification: true,
    afterEmailVerification: async (user) => {
      void sendEmail({
        to: user.email,
        subject: "Bienvenue sur KAMPLY",
        react: WelcomeEmail({ name: user.name, url: `${appUrl}/app` }),
      });
    },
  },

  user: {
    deleteUser: {
      enabled: true,
      // Supprime les images Cloudinary du compte avant de supprimer l'utilisateur.
      beforeDelete: async (user) => {
        const [u, campaigns] = await Promise.all([
          db.user.findUnique({ where: { id: user.id }, select: { imagePublicId: true } }),
          db.campaign.findMany({ where: { userId: user.id }, select: { imagePublicId: true } }),
        ]);
        await Promise.all([u?.imagePublicId, ...campaigns.map((c) => c.imagePublicId)].map((id) => destroyAsset(id)));
      },
    },
    changeEmail: { enabled: false },
    additionalFields: {
      companyName: { type: "string", required: false, input: true },
      phone: { type: "string", required: false, input: true },
      website: { type: "string", required: false, input: true },
      sector: { type: "string", required: false, input: true },
      imagePublicId: { type: "string", required: false, input: false },
      onboardingCompleted: { type: "boolean", required: false, defaultValue: false, input: false },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    // Pas de cache cookie : le profil (onboarding, rôle) doit être à jour à chaque requête.
    cookieCache: { enabled: false },
  },

  databaseHooks: {
    user: {
      create: {
        // Les adresses listées dans ADMIN_EMAILS deviennent administratrices à l'inscription.
        before: async (user) => {
          const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
          return { data: { ...user, role: admins.includes(user.email.toLowerCase()) ? "admin" : "user" } };
        },
        // Chaque compte reçoit son portefeuille dès sa création.
        after: async (user) => {
          await db.wallet.create({ data: { userId: user.id } });
        },
      },
    },
  },

  rateLimit: { enabled: true, window: 60, max: 30 },

  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 60 * 10,
      allowedAttempts: 5,
      sendVerificationOnSignUp: true,
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }) {
        // Pas d'await : évite de révéler par le temps de réponse si l'adresse existe.
        void sendEmail({ to: email, subject: otpSubject(type), react: OtpEmail({ otp, kind: type }), devLog: `code ${otp} (${type})` });
      },
    }),
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
      bannedUserMessage: "Votre compte est suspendu. Consultez l'e-mail que nous vous avons envoyé ou contactez-nous.",
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
