import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;

    constructor(private configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: this.configService.getOrThrow<string>('MAIL_USER'),
                pass: this.configService.getOrThrow<string>('MAIL_PASSWORD'),
            },
        });
    }

    async sendEmail(emailData: { to: string; subject: string; html: string }) {
        try {
            return await this.transporter.sendMail({
                from: this.configService.getOrThrow<string>('MAIL_USER'),
                to: emailData.to,
                subject: emailData.subject,
                html: emailData.html,
            });
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(error.message);
            }

            throw new Error('Failed to send email');
        }
    }
}
