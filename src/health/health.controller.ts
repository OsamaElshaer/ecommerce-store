import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@Controller('')
@ApiTags('')
export class HealthController {
    @Get()
    @ApiOperation({ summary: 'Check if the API is running' })
    check() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        };
    }
}
