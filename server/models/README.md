# Ticketi Database Models - Complete Roadmap

A comprehensive guide to the database models for the Ticketi Pi blockchain ticketing system.

## 🎯 Quick Start

```javascript
// Import models
const { User, Event, Ticket, Purchase, NFTTicket } = require('./models');

// Basic usage
const user = await User.create({ username: 'john', email: 'john@example.com', piWalletAddress: 'pi123' });
const event = await Event.create({ title: 'Concert', description: 'Music event', createdBy: user.id });
```

## 📋 Model Overview

| Model | Purpose | Key Features |
|-------|---------|--------------|
| **User** | User accounts & Pi wallets | Authentication, wallet integration |
| **Event** | Event management | Scheduling, location, status tracking |
| **Ticket** | Ticket types & pricing | Pi currency, availability tracking |
| **Purchase** | Transaction records | Payment status, blockchain hashes |
| **NFTTicket** | Digital ticket NFTs | QR codes, usage tracking |
| **UserSettings** | User preferences | Notifications, language, timezone |
| **Category** | Event categorization | Concerts, conferences, sports |
| **BlockchainTransaction** | Pi network tracking | Transaction monitoring |

## 🔧 Core Models

### User Model
```javascript
// Create user
const user = await User.create({
    username: 'johndoe',
    email: 'john@example.com',
    piWalletAddress: 'pi_wallet_123',
    firstName: 'John',
    lastName: 'Doe'
});

// Find user with events
const userWithEvents = await User.findByPk(userId, {
    include: [{ model: Event, as: 'createdEvents' }]
});
```

**Key Fields:**
- `piWalletAddress` - Pi network wallet (required, unique)
- `isVerified` - Account verification status
- `isActive` - Account status

### Event Model
```javascript
// Create event (matches frontend form)
const event = await Event.create({
    title: 'Token2049 Singapore',
    description: 'Blockchain conference in Singapore',
    location: 'Marina Bay Sands (10 Bayfront Avenue, Singapore)',
    startDate: '2025-09-12',
    endDate: '2025-09-12', 
    startTime: '09:00GMT',
    endTime: '18:00GMT',
    createdBy: userId,
    status: 'published'
});

// Get event with all details
const eventDetails = await Event.findByPk(eventId, {
    include: [
        { model: User, as: 'creator' },
        { model: Ticket, as: 'tickets' },
        { model: Category, as: 'categories' }
    ]
});
```

**Status Flow:** `draft` → `published` → `completed` / `cancelled`

### Ticket Model
```javascript
// Create ticket (matches frontend pricing)
const ticket = await Ticket.create({
    eventId: eventId,
    ticketType: 'regular',
    price: 10.5, // Pi currency
    currency: 'PI',
    totalQuantity: 100,
    availableQuantity: 100
});

// Update after purchase
await Ticket.update({
    availableQuantity: ticket.availableQuantity - quantity,
    soldQuantity: ticket.soldQuantity + quantity
}, { where: { id: ticketId } });
```

**Ticket Types:** `regular`, `vip`, `premium`, `early_bird`

### Purchase Model
```javascript
// Create purchase
const purchase = await Purchase.create({
    userId: buyerId,
    eventId: eventId,
    ticketId: ticketId,
    quantity: 2,
    totalAmount: 21.0, // price * quantity
    paymentStatus: 'pending'
});

// Update after Pi payment
await Purchase.update({
    paymentStatus: 'completed',
    transactionHash: 'pi_tx_hash_123'
}, { where: { id: purchaseId } });
```

**Payment Status:** `pending` → `completed` / `failed` / `refunded`

### NFTTicket Model
```javascript
// Create NFT after successful purchase
const nftTicket = await NFTTicket.create({
    purchaseId: purchaseId,
    tokenId: `ticket_${Date.now()}_${Math.random()}`,
    metadata: {
        eventName: event.title,
        ticketType: 'regular',
        purchaseDate: new Date()
    },
    qrCode: generateQRCode(purchaseId)
});

// Mark as used at event
await NFTTicket.update({
    isUsed: true,
    usedAt: new Date()
}, { where: { tokenId: tokenId } });
```

## 🚀 Complete Workflows

### 1. Event Creation (Frontend → Backend)
```javascript
const createCompleteEvent = async (eventData, userId) => {
    const transaction = await sequelize.transaction();
    
    try {
        // 1. Create event
        const event = await Event.create({
            title: eventData.title,
            description: eventData.description,
            location: eventData.location,
            startDate: eventData.startDate,
            endDate: eventData.endDate,
            startTime: eventData.startTime,
            endTime: eventData.endTime,
            createdBy: userId
        }, { transaction });
        
        // 2. Create tickets
        const tickets = await Ticket.bulkCreate([{
            eventId: event.id,
            ticketType: 'regular',
            price: eventData.ticketPrice,
            totalQuantity: eventData.regularTickets,
            availableQuantity: eventData.regularTickets
        }], { transaction });
        
        // 3. Add categories if provided
        if (eventData.categoryIds?.length) {
            await event.setCategories(eventData.categoryIds, { transaction });
        }
        
        await transaction.commit();
        return { event, tickets };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};
```

### 2. Ticket Purchase Flow
```javascript
const purchaseTickets = async (purchaseData) => {
    const transaction = await sequelize.transaction();
    
    try {
        // 1. Validate ticket availability
        const ticket = await Ticket.findByPk(purchaseData.ticketId, { transaction });
        if (ticket.availableQuantity < purchaseData.quantity) {
            throw new Error('Insufficient tickets available');
        }
        
        // 2. Create purchase record
        const purchase = await Purchase.create({
            userId: purchaseData.userId,
            eventId: purchaseData.eventId,
            ticketId: purchaseData.ticketId,
            quantity: purchaseData.quantity,
            totalAmount: ticket.price * purchaseData.quantity,
            paymentStatus: 'pending'
        }, { transaction });
        
        // 3. Update ticket availability
        await Ticket.update({
            availableQuantity: ticket.availableQuantity - purchaseData.quantity,
            soldQuantity: ticket.soldQuantity + purchaseData.quantity
        }, { 
            where: { id: purchaseData.ticketId },
            transaction 
        });
        
        // 4. Create NFT tickets
        const nftTickets = [];
        for (let i = 0; i < purchaseData.quantity; i++) {
            const nftTicket = await NFTTicket.create({
                purchaseId: purchase.id,
                tokenId: `${purchase.id}_${i + 1}`,
                metadata: {
                    eventTitle: ticket.event?.title,
                    ticketNumber: i + 1,
                    purchaseDate: purchase.purchaseDate
                }
            }, { transaction });
            nftTickets.push(nftTicket);
        }
        
        await transaction.commit();
        return { purchase, nftTickets };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};
```

### 3. Event Discovery & Search
```javascript
const searchEvents = async (filters = {}) => {
    const whereClause = {
        isActive: true,
        status: 'published',
        startDate: { [Op.gte]: new Date() } // Future events only
    };
    
    // Add filters
    if (filters.search) {
        whereClause[Op.or] = [
            { title: { [Op.iLike]: `%${filters.search}%` } },
            { description: { [Op.iLike]: `%${filters.search}%` } }
        ];
    }
    
    if (filters.location) {
        whereClause.location = { [Op.iLike]: `%${filters.location}%` };
    }
    
    if (filters.priceRange) {
        whereClause['$tickets.price$'] = {
            [Op.between]: [filters.priceRange.min, filters.priceRange.max]
        };
    }
    
    return await Event.findAll({
        where: whereClause,
        include: [
            { 
                model: User, 
                as: 'creator', 
                attributes: ['username', 'profileImage'] 
            },
            { 
                model: Ticket, 
                as: 'tickets',
                where: { isActive: true },
                required: false
            },
            { 
                model: Category, 
                as: 'categories',
                through: { attributes: [] }
            }
        ],
        order: [['startDate', 'ASC']],
        limit: filters.limit || 20,
        offset: filters.offset || 0
    });
};
```

## 📊 Analytics & Reporting

### User Dashboard Data
```javascript
const getUserDashboard = async (userId) => {
    const [user, createdEvents, purchases] = await Promise.all([
        User.findByPk(userId, {
            include: [{ model: UserSettings, as: 'settings' }]
        }),
        
        Event.findAll({
            where: { createdBy: userId },
            include: [{ model: Ticket, as: 'tickets' }]
        }),
        
        Purchase.findAll({
            where: { userId },
            include: [
                { model: Event, as: 'event' },
                { model: NFTTicket, as: 'nftTicket' }
            ]
        })
    ]);
    
    return {
        user,
        stats: {
            eventsCreated: createdEvents.length,
            ticketsPurchased: purchases.length,
            totalSpent: purchases.reduce((sum, p) => sum + parseFloat(p.totalAmount), 0)
        },
        createdEvents,
        purchases
    };
};
```

### Event Analytics
```javascript
const getEventAnalytics = async (eventId) => {
    const event = await Event.findByPk(eventId, {
        include: [
            { 
                model: Ticket, 
                as: 'tickets',
                include: [{ model: Purchase, as: 'purchases' }]
            }
        ]
    });
    
    const analytics = {
        totalTickets: event.tickets.reduce((sum, t) => sum + t.totalQuantity, 0),
        soldTickets: event.tickets.reduce((sum, t) => sum + t.soldQuantity, 0),
        revenue: event.tickets.reduce((sum, t) => 
            sum + (t.soldQuantity * parseFloat(t.price)), 0
        ),
        salesByType: event.tickets.map(t => ({
            type: t.ticketType,
            sold: t.soldQuantity,
            total: t.totalQuantity,
            revenue: t.soldQuantity * parseFloat(t.price)
        }))
    };
    
    return { event, analytics };
};
```

## 🔒 Security & Validation

### Input Validation
```javascript
const validateEventData = (eventData) => {
    const errors = [];
    
    if (!eventData.title?.trim()) errors.push('Title is required');
    if (!eventData.description?.trim()) errors.push('Description is required');
    if (!eventData.location?.trim()) errors.push('Location is required');
    if (new Date(eventData.startDate) < new Date()) errors.push('Start date must be in future');
    if (new Date(eventData.endDate) < new Date(eventData.startDate)) errors.push('End date must be after start date');
    
    if (errors.length > 0) {
        throw new ValidationError(errors.join(', '));
    }
};
```

### Access Control
```javascript
const checkEventOwnership = async (eventId, userId) => {
    const event = await Event.findByPk(eventId);
    if (!event || event.createdBy !== userId) {
        throw new Error('Unauthorized: You can only modify your own events');
    }
    return event;
};
```

## 🛠️ Database Setup

### 1. Environment Configuration
```env
# .env file
DEV_DB=ticketi_development
DEV_USER=postgres
DEV_PASSWORD=your_password
DEV_HOST=localhost
DEV_DIALECT=postgres

# Pi Network Configuration
PI_NETWORK_API_KEY=your_pi_api_key
PI_WALLET_PRIVATE_KEY=your_private_key
```

### 2. Database Initialization
```javascript
// server.js
const { dbManager } = require('./config/db.config');
const models = require('./models');

const initializeApp = async () => {
    try {
        // Initialize database with all models
        await dbManager.initialize(models);
        console.log('✅ Database initialized successfully');
        
        // Start server
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Failed to initialize database:', error);
        process.exit(1);
    }
};

initializeApp();
```

### 3. Seed Data (Optional)
```javascript
const seedDatabase = async () => {
    // Create default categories
    const categories = await Category.bulkCreate([
        { name: 'Concerts', description: 'Music events and concerts' },
        { name: 'Conferences', description: 'Business and tech conferences' },
        { name: 'Sports', description: 'Sporting events' },
        { name: 'Theater', description: 'Theater and performing arts' }
    ]);
    
    console.log('✅ Categories seeded');
};
```

## 🚨 Common Pitfalls & Solutions

### 1. Transaction Management
```javascript
// ❌ Wrong - No transaction
const purchase = await Purchase.create(data);
await Ticket.update(updateData, { where: { id: ticketId } });

// ✅ Correct - With transaction
const transaction = await sequelize.transaction();
try {
    const purchase = await Purchase.create(data, { transaction });
    await Ticket.update(updateData, { where: { id: ticketId }, transaction });
    await transaction.commit();
} catch (error) {
    await transaction.rollback();
    throw error;
}
```

### 2. N+1 Query Problem
```javascript
// ❌ Wrong - N+1 queries
const events = await Event.findAll();
for (const event of events) {
    event.creator = await User.findByPk(event.createdBy);
}

// ✅ Correct - Eager loading
const events = await Event.findAll({
    include: [{ model: User, as: 'creator' }]
});
```

### 3. Decimal Precision for Pi Currency
```javascript
// ❌ Wrong - JavaScript floating point issues
const total = 10.1 + 0.2; // 10.299999999999999

// ✅ Correct - Use Decimal type and proper handling
const { Decimal } = require('decimal.js');
const total = new Decimal(10.1).plus(0.2).toNumber(); // 10.3
```

## 📈 Performance Tips

1. **Index frequently queried fields:**
```javascript
// Add to model definition
indexes: [
    { fields: ['createdBy'] },
    { fields: ['startDate'] },
    { fields: ['status', 'isActive'] }
]
```

2. **Use pagination for large datasets:**
```javascript
const { limit, offset } = req.query;
const events = await Event.findAndCountAll({
    limit: parseInt(limit) || 20,
    offset: parseInt(offset) || 0
});
```

3. **Cache frequently accessed data:**
```javascript
const Redis = require('redis');
const redis = Redis.createClient();

// Cache event details
const cacheKey = `event:${eventId}`;
let event = await redis.get(cacheKey);
if (!event) {
    event = await Event.findByPk(eventId, { include: [...] });
    await redis.setex(cacheKey, 300, JSON.stringify(event)); // 5 min cache
}
```

## 🧪 Testing Strategy

### Unit Tests
```javascript
describe('User Model', () => {
    it('should create user with valid data', async () => {
        const userData = {
            username: 'testuser',
            email: 'test@example.com',
            piWalletAddress: 'test_wallet_address'
        };
        
        const user = await User.create(userData);
        expect(user.username).toBe('testuser');
    });
});
```

### Integration Tests
```javascript
describe('Event Purchase Flow', () => {
    it('should complete full purchase flow', async () => {
        // Create user, event, ticket
        // Perform purchase
        // Verify NFT ticket generation
        // Check blockchain transaction record
    });
});
```

## 📋 Deployment Checklist

- [ ] Environment variables configured
- [ ] Database connection configured
- [ ] Models imported and relationships defined
- [ ] Indexes created for performance
- [ ] Backup strategy implemented
- [ ] Monitoring and logging configured
- [ ] Security measures implemented

## 🔮 Future Enhancements

1. **Multi-chain Support**: Extend blockchain models for multiple networks
2. **Advanced NFT Features**: Implement secondary market, royalties, etc.
3. **Social Features**: Add models for reviews, ratings, social interactions
4. **Event Analytics**: Add models for tracking event performance
5. **Payment Gateway Integration**: Support for multiple payment methods
6. **Mobile App Support**: Optimize queries for mobile applications

This roadmap provides everything you need to implement and maintain the Ticketi database models effectively. Each section includes practical examples and best practices for real-world usage.