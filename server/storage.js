const {
  users,
  travelSearches,
  savedSpots,
  agentConversations,
  trips,
} = require("./schema");
const { db } = require("./db");
const { eq, desc, and } = require("drizzle-orm");

class DatabaseStorage {
  // User operations
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email) {
    console.log(db.select().from(users));
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData) {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async upsertUser(userData) {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Travel search operations
  async createTravelSearch(search) {
    const [travelSearch] = await db
      .insert(travelSearches)
      .values(search)
      .returning();
    return travelSearch;
  }

  async getUserTravelSearches(userId) {
    return await db
      .select()
      .from(travelSearches)
      .where(eq(travelSearches.userId, userId))
      .orderBy(desc(travelSearches.createdAt));
  }

  // Saved spots operations
  async saveTouristSpot(spot) {
    const [savedSpot] = await db
      .insert(savedSpots)
      .values(spot)
      .returning();
    return savedSpot;
  }

  async getUserSavedSpots(userId) {
    return await db
      .select()
      .from(savedSpots)
      .where(eq(savedSpots.userId, userId))
      .orderBy(desc(savedSpots.createdAt));
  }

  async removeSavedSpot(id, userId) {
    await db
      .delete(savedSpots)
      .where(and(eq(savedSpots.id, id), eq(savedSpots.userId, userId)));
  }

  // Agent conversation operations
  async saveAgentConversation(conversation) {
    const [agentConversation] = await db
      .insert(agentConversations)
      .values(conversation)
      .returning();
    return agentConversation;
  }

  async getUserAgentConversations(userId, limit = 50) {
    return await db
      .select()
      .from(agentConversations)
      .where(eq(agentConversations.userId, userId))
      .orderBy(desc(agentConversations.createdAt))
      .limit(limit);
  }

  // Trip operations
  async createTrip(trip) {
    const [newTrip] = await db
      .insert(trips)
      .values(trip)
      .returning();
    return newTrip;
  }

  async getUserTrips(userId) {
    return await db
      .select()
      .from(trips)
      .where(eq(trips.userId, userId))
      .orderBy(desc(trips.createdAt));
  }

  async updateTrip(id, userId, updates) {
    const [updatedTrip] = await db
      .update(trips)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(trips.id, id), eq(trips.userId, userId)))
      .returning();
    return updatedTrip;
  }

  async deleteTrip(id, userId) {
    await db
      .delete(trips)
      .where(and(eq(trips.id, id), eq(trips.userId, userId)));
  }
}

const storage = new DatabaseStorage();

module.exports = { storage };