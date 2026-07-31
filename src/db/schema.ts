import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const entryKind = pgEnum("entry_kind", [
  "translation",
  "essay",
  "observation",
  "autopsy",
  "manifesto",
  "fragment",
]);

export const entryVisibility = pgEnum("entry_visibility", [
  "private",
  "draft",
  "public",
]);

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("user_email_unique").on(table.email)],
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("session_token_unique").on(table.token),
    index("session_user_id_idx").on(table.userId),
  ],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("account_user_id_idx").on(table.userId),
    uniqueIndex("account_provider_account_unique").on(
      table.providerId,
      table.accountId,
    ),
  ],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

/**
 * Better Auth owns the row semantics. Database storage makes preview and
 * production rate-limit decisions durable across serverless instances.
 */
export const rateLimit = pgTable(
  "rate_limit",
  {
    id: text("id").primaryKey(),
    key: text("key").notNull(),
    count: integer("count").notNull(),
    lastRequest: bigint("last_request", { mode: "number" }).notNull(),
  },
  (table) => [uniqueIndex("rate_limit_key_unique").on(table.key)],
);

export type EntrySnapshot = {
  title: string;
  slug: string;
  kind:
    | "translation"
    | "essay"
    | "observation"
    | "autopsy"
    | "manifesto"
    | "fragment";
  deck: string | null;
  politeSentence: string | null;
  translation: string | null;
  systemUnderneath: string | null;
  usefulPrinciple: string | null;
  body: string;
  tags: string[];
  sourceEntryId: string | null;
};

export const entries = pgTable(
  "entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    kind: entryKind("kind").notNull(),
    visibility: entryVisibility("visibility").notNull().default("private"),
    title: text("title").notNull(),
    deck: text("deck"),
    politeSentence: text("polite_sentence"),
    translation: text("translation"),
    systemUnderneath: text("system_underneath"),
    usefulPrinciple: text("useful_principle"),
    body: text("body").notNull().default(""),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    sourceEntryId: uuid("source_entry_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    publicationReviewedAt: timestamp("publication_reviewed_at", {
      withTimezone: true,
    }),
    publicationReviewedBy: text("publication_reviewed_by").references(
      () => user.id,
    ),
    version: integer("version").notNull().default(1),
  },
  (table) => [
    uniqueIndex("entries_slug_unique").on(table.slug),
    index("entries_public_kind_published_idx").on(
      table.visibility,
      table.kind,
      table.publishedAt,
    ),
    index("entries_tags_idx").using("gin", table.tags),
    foreignKey({
      columns: [table.sourceEntryId],
      foreignColumns: [table.id],
      name: "entries_source_entry_id_fk",
    }).onDelete("set null"),
    check(
      "entries_public_requires_review",
      sql`${table.visibility} <> 'public' OR (${table.publicationReviewedAt} IS NOT NULL AND ${table.publicationReviewedBy} IS NOT NULL AND ${table.publishedAt} IS NOT NULL)`,
    ),
  ],
);

export const entryRevisions = pgTable(
  "entry_revisions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entryId: uuid("entry_id")
      .notNull()
      .references(() => entries.id, { onDelete: "cascade" }),
    revisionNumber: integer("revision_number").notNull(),
    snapshot: jsonb("snapshot").$type<EntrySnapshot>().notNull(),
    visibility: entryVisibility("visibility").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("entry_revisions_entry_number_unique").on(
      table.entryId,
      table.revisionNumber,
    ),
    index("entry_revisions_entry_idx").on(table.entryId, table.revisionNumber),
  ],
);
