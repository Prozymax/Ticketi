const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db.config');

const NFTTicket = sequelize.define('NFTTicket', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    purchaseId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'purchase_id',
        references: {
            model: 'purchases',
            key: 'id'
        }
    },
    tokenId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'token_id'
    },
    contractAddress: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'contract_address'
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true
    },
    qrCode: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'qr_code'
    },
    isUsed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_used'
    },
    usedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'used_at'
    },
    isTransferable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_transferable'
    }
}, {
    tableName: 'nft_tickets',
    timestamps: true,
    underscored: true
});

module.exports = NFTTicket;