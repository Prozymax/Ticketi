// Import all models
const Auth = require('./auth/auth.model.js')
const User = require('./user/user.model');
const Event = require('./event/event.model');
const Ticket = require('./ticket/ticket.model');
const Purchase = require('./purchase/purchase.model');
const Payment = require('./payment/payment.model');
const NFTTicket = require('./nft_ticket/nft_ticket.model');
const UserSettings = require('./settings/user_settings.model');
const Category = require('./category/category.model');
const EventCategory = require('./event_category/event_category.model');
const BlockchainTransaction = require('./blockchain/blockchain_transaction.model');
const Followers = require('./followers/followers.model.js');

// Define Model Relationships

// auth relationship
Auth.belongsTo(User, { 
    foreignKey: 'user_id' 
});

// User Relationships
User.hasMany(Event, { 
    foreignKey: 'organizerId', 
    as: 'organizedEvents' 
});

User.hasOne(Auth, { 
    foreignKey: 'user_id', 
    onDelete: 'CASCADE' 
});

User.hasMany(Purchase, { 
    foreignKey: 'userId', 
    as: 'purchases' 
});

User.hasMany(Payment, { 
    foreignKey: 'userId', 
    as: 'payments' 
});

User.hasOne(UserSettings, { 
    foreignKey: 'userId', 
    as: 'settings' 
});

// Event Relationships
Event.belongsTo(User, { 
    foreignKey: 'organizerId', 
    as: 'organizer' 
});

Event.hasMany(Ticket, { 
    foreignKey: 'eventId', 
    as: 'tickets' 
});

Event.hasMany(Purchase, { 
    foreignKey: 'eventId', 
    as: 'purchases' 
});

Event.belongsToMany(Category, {
    through: EventCategory,
    foreignKey: 'eventId',
    otherKey: 'categoryId',
    as: 'categories'
});

// Ticket Relationships
Ticket.belongsTo(Event, { 
    foreignKey: 'eventId', 
    as: 'event' 
});

Ticket.hasMany(Purchase, { 
    foreignKey: 'ticketId', 
    as: 'purchases' 
});

// Purchase Relationships
Purchase.belongsTo(User, { 
    foreignKey: 'userId', 
    as: 'buyer' 
});

Purchase.belongsTo(Event, { 
    foreignKey: 'eventId', 
    as: 'event' 
});

Purchase.belongsTo(Ticket, { 
    foreignKey: 'ticketId', 
    as: 'ticket' 
});

Purchase.hasOne(NFTTicket, { 
    foreignKey: 'purchaseId', 
    as: 'nftTicket' 
});

Purchase.hasOne(Payment, { 
    foreignKey: 'purchaseId', 
    as: 'payment' 
});

// Payment Relationships
Payment.belongsTo(User, { 
    foreignKey: 'userId', 
    as: 'user' 
});

Payment.belongsTo(Purchase, { 
    foreignKey: 'purchaseId', 
    as: 'purchase' 
});

Payment.belongsTo(Event, { 
    foreignKey: 'eventId', 
    as: 'event' 
});

// NFT Ticket Relationships
NFTTicket.belongsTo(Purchase, { 
    foreignKey: 'purchaseId', 
    as: 'purchase' 
});

// User Settings Relationships
UserSettings.belongsTo(User, { 
    foreignKey: 'userId', 
    as: 'user' 
});

// Category Relationships
Category.belongsToMany(Event, {
    through: EventCategory,
    foreignKey: 'categoryId',
    otherKey: 'eventId',
    as: 'events'
});

// EventCategory Relationships
EventCategory.belongsTo(Event, { 
    foreignKey: 'eventId', 
    as: 'event' 
});

EventCategory.belongsTo(Category, { 
    foreignKey: 'categoryId', 
    as: 'category' 
});

// Followers Relationships
User.hasMany(Followers, {
    foreignKey: 'followerId',
    as: 'following'
});

User.hasMany(Followers, {
    foreignKey: 'followingId',
    as: 'followers'
});

Followers.belongsTo(User, {
    foreignKey: 'followingId',
    as: 'followedUser'
});

Followers.belongsTo(User, {
    foreignKey: 'followerId',
    as: 'followerUser'
});

// Export all models
module.exports = {
    Auth,
    User,
    Event,
    Ticket,
    Purchase,
    Payment,
    NFTTicket,
    UserSettings,
    Followers,
    Category,
    EventCategory,
    BlockchainTransaction
};