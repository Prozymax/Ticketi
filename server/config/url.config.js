require('dotenv').config()
const { logger } = require('../utils/logger');

let environment = process.env.NODE_ENV,
    capacitorUrl = process.env.CAPACITORURL,
    androidUrl = process.env.CAPACITORANDROIDURL,
    server_urls = {
        devServerUrl: process.env.DEV_SERVER_URL,
        testServerUrl: process.env.TEST_SERVER_URL,
        prodServerUrl: process.env.PROD_SERVER_URL
    },

    frontend_urls = {
        devFrontendUrl: process.env.devFrontendUrl,
        testFrontendUrl: process.env.testFrontendUrl,
        productionFrontendUrl: process.env.productionUrl
    },

    allowed_origins = {
        devFrontendOrigin: process.env.devFrontendUrl,
        testFrontEndOrigin: process.env.testFrontendUrl,
        productionFrontEndOrigin: process.env.productionUrl
    },

    serverUrl =
        environment === 'development' ? server_urls?.devServerUrl :
            environment === 'test' ? server_urls?.testServerUrl :
                environment === 'production' ? server_urls.prodServerUrl :
                    null,

    allowedOrigin =
        environment === 'development' ? allowed_origins?.devFrontendOrigin :
            environment === 'test' ? allowed_origins?.testFrontEndOrigin :
                environment == 'production' ? allowed_origins?.productionFrontEndOrigin :
                    null,

    frontendUrl =
        environment === 'development' ? frontend_urls?.devFrontendUrl :
            environment === 'test' ? frontend_urls?.testFrontendUrl :
                environment === 'production' ? frontend_urls?.productionFrontendUrl :
                    null;

logger.info(`
    Server URL: ${serverUrl}
    Allowed Origin: ${allowedOrigin}
    Capacitor URL: ${capacitorUrl}
    Android URL: ${androidUrl}
    Frontend URL: ${frontendUrl}
    `)

module.exports = {
    serverUrl, allowedOrigin, frontendUrl, capacitorUrl, androidUrl
}