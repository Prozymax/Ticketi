const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db.config');

const BlockchainTransaction = sequelize.define('BlockchainTransaction', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    transactionHash: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'transaction_hash'
    },
    blockNumber: {
        type: DataTypes.BIGINT,
        allowNull: true,
        field: 'block_number'
    },
    fromAddress: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'from_address'
    },
    toAddress: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'to_address'
    },
    amount: {
        type: DataTypes.DECIMAL(18, 6),
        allowNull: false
    },
    gasUsed: {
        type: DataTypes.BIGINT,
        allowNull: true,
        field: 'gas_used'
    },
    gasPrice: {
        type: DataTypes.BIGINT,
        allowNull: true,
        field: 'gas_price'
    },
    status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'failed'),
        defaultValue: 'pending'
    },
    transactionType: {
        type: DataTypes.ENUM('payment', 'nft_mint', 'nft_transfer'),
        allowNull: false,
        field: 'transaction_type'
    },
    relatedId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'related_id'
    },
    confirmations: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'blockchain_transactions',
    timestamps: true,
    underscored: true
});

module.exports = BlockchainTransaction;