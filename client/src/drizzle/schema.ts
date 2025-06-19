const {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  decimal,
  boolean,
} = require("drizzle-orm/pg-core");
const { createInsertSchema } = require("drizzle-zod");

// Session storage table for authentication
const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table: typeof sessions) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email").unique().notNull(),
  password: varchar("password"), // For local authentication
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  googleId: varchar("google_id"), // For Google OAuth
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Travel searches and saved locations
const travelSearches = pgTable("travel_searches", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").notNull().references(() => users.id),
  location: text("location").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  searchType: varchar("search_type").notNull(), // 'tourist' | 'weather' | 'both'
  results: jsonb("results"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Saved tourist spots
const savedSpots = pgTable("saved_spots", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").notNull().references(() => users.id),
  spotId: varchar("spot_id").notNull(), // External API ID
  name: text("name").notNull(),
  description: text("description"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  rating: decimal("rating", { precision: 2, scale: 1 }),
  imageUrl: text("image_url"),
  address: text("address"),
  distance: decimal("distance", { precision: 8, scale: 2 }), // in km
  createdAt: timestamp("created_at").defaultNow(),
});

// Agent conversation history
const agentConversations = pgTable("agent_conversations", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").notNull().references(() => users.id),
  agentType: varchar("agent_type").notNull(), // 'tourist' | 'weather' | 'supervisor'
  message: text("message").notNull(),
  response: text("response"),
  metadata: jsonb("metadata"), // Store agent-specific data
  createdAt: timestamp("created_at").defaultNow(),
});

// Trip planning data
const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  locations: jsonb("locations"), // Array of location objects
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema exports
const insertUserSchema = createInsertSchema(users);
const insertTravelSearchSchema = createInsertSchema(travelSearches);
const insertSavedSpotSchema = createInsertSchema(savedSpots);
const insertAgentConversationSchema = createInsertSchema(agentConversations);
const insertTripSchema = createInsertSchema(trips);

module.exports = {
  sessions,
  users,
  travelSearches,
  savedSpots,
  agentConversations,
  trips,
  insertUserSchema,
  insertTravelSearchSchema,
  insertSavedSpotSchema,
  insertAgentConversationSchema,
  insertTripSchema,
};