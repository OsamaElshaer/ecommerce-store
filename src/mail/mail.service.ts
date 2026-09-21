import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
    private resend: Resend;

    constructor(private configService: ConfigService) {
        this.resend = new Resend(
            this.configService.get<string>('RESEND_API_KEY'),
        );
    }

    async sendEmail(emailData: { to: string; subject: string; html: string }) {
        return this.resend.emails.send({
            from: this.configService.get<string>('MAIL_FROM')!,
            to: emailData.to,
            subject: emailData.subject,
            html: emailData.html,
        });
    }
}
