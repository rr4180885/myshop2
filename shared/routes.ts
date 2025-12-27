import { z } from "zod";
import { insertUserSchema, insertProductSchema, insertInvoiceSchema, users, products, invoices } from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    login: {
      method: "POST" as const,
      path: "/api/login",
      input: z.object({
        username: z.string(),
        password: z.string(),
      }),
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: "POST" as const,
      path: "/api/logout",
      responses: {
        200: z.void(),
      },
    },
    me: {
      method: "GET" as const,
      path: "/api/user",
      responses: {
        200: z.custom<typeof users.$inferSelect | null>(),
      },
    },
  },
  products: {
    list: {
      method: "GET" as const,
      path: "/api/products",
      responses: {
        200: z.array(z.custom<typeof products.$inferSelect>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/products",
      input: insertProductSchema,
      responses: {
        201: z.custom<typeof products.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: "PUT" as const,
      path: "/api/products/:id",
      input: insertProductSchema.partial(),
      responses: {
        200: z.custom<typeof products.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/products/:id",
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  invoices: {
    list: {
      method: "GET" as const,
      path: "/api/invoices",
      responses: {
        200: z.array(z.custom<typeof invoices.$inferSelect>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/invoices",
      input: insertInvoiceSchema,
      responses: {
        201: z.custom<typeof invoices.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type LoginInput = z.infer<typeof api.auth.login.input>;
export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
