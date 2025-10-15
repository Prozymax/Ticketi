const { createTransport } = require("nodemailer");
const { serverUrl } = require("./url.config");
const { depositSuccessMessage, welcomeMessage, OtpMessage, resetMessage } = require("../misc/message.misc");

class MailConfig {
    constructor(config = {}) {
        this.host = process.env.MAIL_HOST;
        this.port = process.env.MAIL_PORT;
        this.user = process.env.MAIL_USER;
        this.password = process.env.MAIL_PASSWORD;
        this.from = process.env.MAIL_USER;
        this.txid = config.txid;
        this.depositAmount = config.depositAmount;
        this.token = config.token;
        this.to = config.email;
        this.otp = config.otp;
        this.resetMessage = resetMessage
        this.subject = 'OTP VERIFICATION';
        this.OtpMessage = OtpMessage
        this.welcomeMessage = welcomeMessage
        this.depositSuccessMessage = depositSuccessMessage

        this.mailTransporter = createTransport({
            host: this.host,
            port: this.port,
            secure: true,
            auth: {
                user: this.user,
                pass: this.password,
            },
        });
    }

    sendMail = async (email, subject, message) => {
        try {
            let response = await this.mailTransporter.sendMail({
                from: this.from,
                to: email,
                subject: subject,
                html: message,
            })

            return { message: 'Email sent successfully', response, sent: true };
        }
        catch (error) {
            return { message: 'Error sending email', error: error.message, sent: false };
        }
    }

    sendOtp = async (email, firstName, otp) => {
        try {
            let response = await this.mailTransporter.sendMail({
                from: this.from,
                to: email,
                subject: 'Verify Your Email Address',
                html: this.OtpMessage(otp, firstName),
            })

            return { message: 'Email sent successfully', response, sent: true };
        }
        catch (error) {
            logger.error(error)
            return { message: 'Error sending email', error: error.message, sent: false };
        }
    }

    sendWelcomeEmail = async (email, firstName) => {
        try {
            let response = await this.mailTransporter.sendMail({
                from: this.from,
                to: email,
                subject: 'Welcome to IMX',
                html: this.welcomeMessage(firstName),
            })

            return { message: 'Welcome email sent successfully', response, sent: true };
        }
        catch (error) {
            logger.error(error)
            return { message: 'Error sending welcome email', error: error.message, sent: false };
        }
    }

    sendforgottenPassWord = async (email, resetLink, firstName) => {
        try {
            let response = await this.mailTransporter.sendMail({
                from: this.from,
                to: email,
                subject: 'Reset Your Password',
                html: this.resetMessage(firstName, resetLink),
            })

            return { message: 'Password reset email sent successfully', response, sent: true };
        }
        catch (error) {
            logger.error(error)
            return { message: 'Error sending password reset email', error: error.message, sent: false };
        }
    }

}

module.exports = { MailConfig };