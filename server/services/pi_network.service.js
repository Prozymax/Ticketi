require('dotenv').config();
const axios = require('axios');
const { logger } = require('../utils/logger');
const User = require('../models/user/user.model');
const Purchase = require('../models/purchase/purchase.model');
const BlockchainTransaction = require('../models/blockchain/blockchain_transaction.model');
const Auth = require('../models/auth/auth.model');

class PiNetworkService {
    constructor() {
        this.baseUrl = process.env.PI_API_URL;

        this.apiKey = process.env.PI_API_KEY;

        logger.info(`🔧 Pi Network Service initialized:`);
        logger.info(`Environment: ${process.env.NODE_ENV}`);
        logger.info(`Base URL: ${this.baseUrl}`);
        logger.info(`API Key: ${this.apiKey ? 'Set' : 'Missing'}`);

        // Create reusable axios instance
        this.axiosInstance = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 second timeout
        });
    }

    /**
     * Generic API caller with uniform error handling
     */
    // apiCaller = async (endpoint, options = {}) => {
    //     try {
    //         logger.info(`🔗 Pi API Request: ${options.method || 'GET'} ${this.baseUrl}/${endpoint}`);

    //         const response = await this.axiosInstance.request({
    //             url: endpoint,
    //             method: options.method || 'GET',
    //             data: options.data || null,
    //             headers: {
    //                 ...this.axiosInstance.defaults.headers,
    //                 ...(options.headers || {})
    //             }
    //         });

    //         logger.info(`✅ Pi API Success: ${response.status}`);
    //         return { success: true, data: response.data, status: response.status };
    //     } catch (error) {
    //         logger.error('Pi Network API Error:');
    //         logger.error(`API Error Response Pi verification failed:${error.response?.data || error.message}`);

    //         // Log more details for debugging
    //         if (error.response) {
    //             logger.error(`Status: ${error.response.status}`);
    //             logger.error(`Headers: ${JSON.stringify(error.response.headers)}`);
    //             logger.error(`Config: ${JSON.stringify({
    //                 url: error.config?.url,
    //                 method: error.config?.method,
    //                 headers: error.config?.headers
    //             })}`);
    //         }

    //         return {
    //             success: false,
    //             error: error.response?.data || error.message,
    //             status: error.response?.status || 500
    //         };
    //     }
    // };

    apiCaller = async (endpoint, options = {}) => {
        try {
            logger.info(`🔗 Pi API Request: ${options.method || 'GET'} ${this.baseUrl}/${endpoint}`);
            console.log(`🔗 Pi API Request: ${options.method || 'GET'} ${this.baseUrl}/${endpoint}`);

            const config = {
                url: endpoint,
                method: options.method || 'GET',
                headers: {
                    ...this.axiosInstance.defaults.headers,
                    ...(options.headers || {}),
                },
            };

            if (options.method && options.method.toUpperCase() !== 'GET' && options.data) {
                config.data = options.data;
            }

            const response = await this.axiosInstance.request(config);

            logger.info(`✅ Pi API Success: ${response.status}`);
            return { success: true, data: response.data, status: response.status };
        } catch (error) {
            logger.error('Pi Network API Error:');
            logger.error(`API Error Response Pi verification failed: ${error.response?.data || error.message}`);

            if (error.response) {
                logger.error(`Status: ${error.response.status}`);
                logger.error(`Headers: ${JSON.stringify(error.response.headers)}`);
                logger.error(`Config: ${JSON.stringify({
                    url: error.config?.url,
                    method: error.config?.method,
                    headers: error.config?.headers,
                })}`);
            }

            return {
                success: false,
                error: error.response?.data || error.message,
                status: error.response?.status || 500,
            };
        }
    };


    verifyUser = async (accessToken, username) => {
        const response = await this.apiCaller('me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        })

        if(!response || response.error) {
            console.error(response.error)
            return { success: false, error: response.error || 'Unknown error' }
        }

        const user = response.data;
        if(user.username !== username) {
            return { success: false, error: true, message: 'Username mismatch' }
        }

        return { success: true, user, message: 'User verified' }
    }

    /**
     * Create / submit payment (User → App)
     */
    submitPayment = async (paymentData) => {
        try {
            const { amount, memo, metadata, userId, purchaseId } = paymentData;

            const paymentPayload = {
                amount: parseFloat(amount),
                memo: memo || 'Payment via Pi Network',
                metadata: {
                    purchaseId,
                    userId,
                    ...metadata
                }
            };

            const result = await this.apiCaller('/payments', {
                method: 'POST',
                data: paymentPayload,
                headers: {
                    'Authorization': `Key ${this.apiKey}`
                }
            });

            if (!result.success) throw new Error(result.error);

            const payment = result.data;

            await BlockchainTransaction.create({
                transactionHash: payment.identifier,
                fromAddress: payment.from_address,
                toAddress: payment.to_address,
                amount: payment.amount,
                status: 'pending',
                transactionType: 'payment',
                relatedId: purchaseId
            });

            if (purchaseId) {
                await Purchase.update(
                    { transactionHash: payment.identifier, paymentStatus: 'pending' },
                    { where: { id: purchaseId } }
                );
            }

            logger.info('Payment submitted successfully:', payment);

            return { success: true, payment };
        } catch (error) {
            logger.error('Payment submission error:', error);
            return { success: false, error: error.message };
        }
    };

    /**
     * Approve a payment (Server → Pi API)
     */
    approvePayment = async (paymentId) => {
        try {
            const result = await this.apiCaller(`/payments/${paymentId}/approve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Key ${this.apiKey}`
                }
            });

            if (!result.success) throw new Error(result.error);

            await BlockchainTransaction.update(
                { status: 'approved' },
                { where: { transactionHash: paymentId } }
            );

            await Purchase.update(
                { paymentStatus: 'approved' },
                { where: { transactionHash: paymentId } }
            );

            logger.info('Payment approved successfully:', { paymentId });

            return { success: true, payment: result.data };
        } catch (error) {
            logger.error('Payment approval error:', error);
            return { success: false, error: error.message };
        }
    };

    /**
     * Complete a payment (after blockchain txid)
     */
    completePayment = async (paymentId, txid) => {
        try {
            const result = await this.apiCaller(`/payments/${paymentId}/complete`, {
                method: 'POST',
                data: { txid },
                headers: {
                    'Authorization': `Key ${this.apiKey}`
                }
            });

            if (!result.success) throw new Error(result.error);

            await BlockchainTransaction.update(
                {
                    status: 'confirmed',
                    confirmations: result.data.confirmations || 1,
                    blockNumber: result.data.blockNumber
                },
                { where: { transactionHash: paymentId } }
            );

            await Purchase.update(
                { paymentStatus: 'completed' },
                { where: { transactionHash: paymentId } }
            );

            logger.info('Payment completed successfully:', { paymentId, txid });

            return { success: true, payment: result.data };
        } catch (error) {
            logger.error('Payment completion error:', error);
            return { success: false, error: error.message };
        }
    };

    /**
     * Cancel payment (if needed)
     */
    cancelPayment = async (paymentId) => {
        try {
            const result = await this.apiCaller(`/payments/${paymentId}/cancel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Key ${this.apiKey}`
                }
            });

            if (!result.success) throw new Error(result.error);

            await BlockchainTransaction.update(
                { status: 'cancelled' },
                { where: { transactionHash: paymentId } }
            );

            await Purchase.update(
                { paymentStatus: 'cancelled' },
                { where: { transactionHash: paymentId } }
            );

            logger.info('Payment cancelled successfully:', { paymentId });

            return { success: true, payment: result.data };
        } catch (error) {
            logger.error('Payment cancellation error:', error);
            return { success: false, error: error.message };
        }
    };

    /**
     * Get payment details / status
     */
    getPaymentStatus = async (paymentId) => {
        try {
            const result = await this.apiCaller(`/payments/${paymentId}`, {
                headers: {
                    'Authorization': `Key ${this.apiKey}`
                }
            });

            if (!result.success) throw new Error(result.error);

            const payment = result.data;

            await BlockchainTransaction.update(
                { status: payment.status },
                { where: { transactionHash: paymentId } }
            );

            await Purchase.update(
                { paymentStatus: payment.status },
                { where: { transactionHash: paymentId } }
            );

            return { success: true, payment };
        } catch (error) {
            logger.error('Get payment status error:', error);
            return { success: false, error: error.message };
        }
    };
}

module.exports = new PiNetworkService();
