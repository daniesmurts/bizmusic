import { pgTable, text, integer, boolean, timestamp, jsonb, pgEnum, uniqueIndex, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums - keep them as lowercase for DB if they were created that way, but Prisma usually keeps them as defined
export const roleEnum = pgEnum("role", ["ADMIN", "BUSINESS_OWNER", "STAFF"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["INACTIVE", "ACTIVE", "EXPIRED"]);

// Users Table
export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()), 
  email: text("email").notNull().unique(),
  passwordHash: text("passwordHash").notNull(),
  role: roleEnum("role").default("BUSINESS_OWNER").notNull(),
  termsAccepted: boolean("termsAccepted").default(false).notNull(),
  termsAcceptedAt: timestamp("termsAcceptedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()),
});

// Businesses Table
export const businesses = pgTable("businesses", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").references(() => users.id).notNull(),
  inn: text("inn").notNull().unique(),
  ogrn: text("ogrn"),
  kpp: text("kpp"),
  legalName: text("legalName").notNull(),
  address: text("address").notNull(),
  phone: text("phone"),
  contactPerson: text("contactPerson"),
  businessType: text("businessType"),
  businessCategory: text("businessCategory"),
  bankName: text("bankName"),
  bik: text("bik"),
  settlementAccount: text("settlementAccount"),
  corrAccount: text("corrAccount"),
  subscriptionStatus: subscriptionStatusEnum("subscriptionStatus").default("INACTIVE").notNull(),
  subscriptionExpiresAt: timestamp("subscriptionExpiresAt"),
  trialEndsAt: timestamp("trialEndsAt"),
  rebillId: text("rebillId"),
  currentPlanSlug: text("currentPlanSlug"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()),
});

// Locations Table
export const locations = pgTable("locations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("businessId").references(() => businesses.id).notNull(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  deviceId: text("deviceId").unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()),
});

// Tracks Table
export const tracks = pgTable("tracks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  fileUrl: text("fileUrl").notNull(),
  duration: integer("duration").notNull(),
  bpm: integer("bpm"),
  genre: text("genre").default("Unknown"),
  moodTags: text("moodTags").array().notNull(),
  isExplicit: boolean("isExplicit").default(false).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  energyLevel: integer("energyLevel"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()),
});

// Playlists Table
export const playlists = pgTable("playlists", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("businessId").references(() => businesses.id),
  name: text("name").notNull(),
  scheduleConfig: jsonb("scheduleConfig"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()),
});

// PlaylistTracks Join Table
export const playlistTracks = pgTable("playlist_tracks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  playlistId: text("playlistId").references(() => playlists.id, { onDelete: "cascade" }).notNull(),
  trackId: text("trackId").references(() => tracks.id, { onDelete: "cascade" }).notNull(),
  position: integer("position").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()),
}, (t) => ({
  playlistTrackUnique: uniqueIndex("playlist_track_unique").on(t.playlistId, t.trackId),
  playlistPositionIndex: index("playlist_position_idx").on(t.playlistId, t.position),
}));

// PlayLogs Table
export const playLogs = pgTable("play_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  locationId: text("locationId").references(() => locations.id),
  businessId: text("businessId").references(() => businesses.id),
  trackId: text("trackId").references(() => tracks.id).notNull(),
  playedAt: timestamp("playedAt").defaultNow().notNull(),
});

// Licenses Table
export const licenses = pgTable("licenses", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("businessId").references(() => businesses.id).notNull(),
  licenseNumber: text("licenseNumber").notNull().unique(),
  signingName: text("signingName").notNull(),
  issuedAt: timestamp("issuedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  validFrom: timestamp("validFrom").notNull(),
  validTo: timestamp("validTo").notNull(),
  totalCost: integer("totalCost").default(0).notNull(),
  pdfUrl: text("pdfUrl").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Blog Related Tables
export const blogCategories = pgTable("blog_categories", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
});

export const blogPosts = pgTable("blog_posts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  categoryId: text("categoryId").references(() => blogCategories.id).notNull(),
  authorId: text("authorId").references(() => users.id).notNull(),
  imageUrl: text("imageUrl").notNull(),
  published: boolean("published").default(false).notNull(),
  featured: boolean("featured").default(false).notNull(),
  views: integer("views").default(0).notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()),
}, (t) => ({
  slugIdx: index("blog_post_slug_idx").on(t.slug),
  categoryIdx: index("blog_post_category_idx").on(t.categoryId),
  publishedIdx: index("blog_post_published_idx").on(t.published),
}));

export const blogPostTags = pgTable("blog_post_tags", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  postId: text("postId").references(() => blogPosts.id, { onDelete: "cascade" }).notNull(),
  tagName: text("tagName").notNull(),
}, (t) => ({
  postIdx: index("blog_post_tags_post_idx").on(t.postId),
  tagIdx: index("blog_post_tags_tag_idx").on(t.tagName),
}));

// Payments Table
export const payments = pgTable("payments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("businessId").references(() => businesses.id).notNull(),
  amount: integer("amount").notNull(),
  status: text("status").notNull(),
  tbankPaymentId: text("tbankPaymentId").unique(),
  orderId: text("orderId").notNull().unique(),
  recurrent: boolean("recurrent").default(false).notNull(),
  rebillId: text("rebillId"),
  errorCode: text("errorCode"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()),
});

// RELATIONS
export const usersRelations = relations(users, ({ many }) => ({
  businesses: many(businesses),
  blogPosts: many(blogPosts),
}));

export const businessesRelations = relations(businesses, ({ one, many }) => ({
  user: one(users, { fields: [businesses.userId], references: [users.id] }),
  locations: many(locations),
  playlists: many(playlists),
  licenses: many(licenses),
  playLogs: many(playLogs),
  payments: many(payments),
}));

export const locationsRelations = relations(locations, ({ one, many }) => ({
  business: one(businesses, { fields: [locations.businessId], references: [businesses.id] }),
  playLogs: many(playLogs),
}));

export const tracksRelations = relations(tracks, ({ many }) => ({
  playLogs: many(playLogs),
  playlistTracks: many(playlistTracks),
}));

export const playlistsRelations = relations(playlists, ({ one, many }) => ({
  business: one(businesses, { fields: [playlists.businessId], references: [businesses.id] }),
  tracks: many(playlistTracks),
}));

export const playlistTracksRelations = relations(playlistTracks, ({ one }) => ({
  playlist: one(playlists, { fields: [playlistTracks.playlistId], references: [playlists.id] }),
  track: one(tracks, { fields: [playlistTracks.trackId], references: [tracks.id] }),
}));

export const playLogsRelations = relations(playLogs, ({ one }) => ({
  location: one(locations, { fields: [playLogs.locationId], references: [locations.id] }),
  business: one(businesses, { fields: [playLogs.businessId], references: [businesses.id] }),
  track: one(tracks, { fields: [playLogs.trackId], references: [tracks.id] }),
}));

export const licensesRelations = relations(licenses, ({ one }) => ({
  business: one(businesses, { fields: [licenses.businessId], references: [businesses.id] }),
}));

export const blogCategoriesRelations = relations(blogCategories, ({ many }) => ({
  posts: many(blogPosts),
}));

export const blogPostsRelations = relations(blogPosts, ({ one, many }) => ({
  category: one(blogCategories, { fields: [blogPosts.categoryId], references: [blogCategories.id] }),
  author: one(users, { fields: [blogPosts.authorId], references: [users.id] }),
  tags: many(blogPostTags),
}));

export const blogPostTagsRelations = relations(blogPostTags, ({ one }) => ({
  post: one(blogPosts, { fields: [blogPostTags.postId], references: [blogPosts.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  business: one(businesses, { fields: [payments.businessId], references: [businesses.id] }),
}));
