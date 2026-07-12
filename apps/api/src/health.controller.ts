import { Controller, Get } from '@nestjs/common';

// Endpoint simple de salud: lo usa Render para verificar que el servidor está vivo,
// y sirve para un "ping" externo que evite que el plan gratis se duerma.
@Controller()
export class HealthController {
  @Get('health')
  health() {
    return { status: 'ok', service: 'releve-api', time: new Date().toISOString() };
  }
}
