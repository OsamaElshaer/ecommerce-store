import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
    ApiOperation,
    ApiResponse,
    ApiTags,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { LogoutDto } from './dto/logout.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Register a new customer account' })
    @ApiResponse({ status: 201, description: 'User created successfully' })
    @ApiResponse({ status: 409, description: 'Email already exists' })
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Get('verify-email')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Verify the user email address' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Email verified successfully.',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid, expired, or already used verification token.',
    })
    verifyEmail(@Query('token') token: string) {
        return this.authService.verifyEmail(token);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Log in and receive access + refresh tokens' })
    @ApiResponse({ status: 200, description: 'Login successful' })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get a new access token using a refresh token' })
    @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
    @ApiResponse({
        status: 401,
        description: 'Invalid or expired refresh token',
    })
    refresh(@Body() dto: RefreshTokenDto) {
        return this.authService.refreshToken(dto.refresh_token);
    }
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: "Log out (revoke the current session's refresh token)",
    })
    @ApiResponse({ status: 200, description: 'Logged out successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    logout(@Req() req: any, @Body() dto: LogoutDto) {
        return this.authService.logout(req.user.id, dto.refresh_token);
    }

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Request a password reset email' })
    @ApiResponse({
        status: HttpStatus.OK,
        description:
            'Returns a generic message whether or not the email exists.',
    })
    forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(dto.email);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Password has been reset successfully.',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid, expired, or already used reset token.',
    })
    @ApiOperation({ summary: "Reset the user's password" })
    resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto.token, dto.new_password);
    }

    @Post('resend-verification')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Resend the email verification link' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Verification email resend request processed.',
    })
    resendVerification(@Body() dto: ResendVerificationDto) {
        return this.authService.resendVerification(dto.email);
    }
}
