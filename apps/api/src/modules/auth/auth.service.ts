import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const agent = await this.prisma.agent.findUnique({ where: { email } });

    if (!agent || !agent.isActive) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const valid = await bcrypt.compare(password, agent.password);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    const payload = { sub: agent.id, email: agent.email, role: agent.role };
    const accessToken = this.jwt.sign(payload, { expiresIn: '8h' });
    const refreshToken = this.jwt.sign(payload, {
      expiresIn: '7d',
      secret: process.env.JWT_REFRESH_SECRET ?? 'refresh_secret',
    });

    return {
      accessToken,
      refreshToken,
      agent: { id: agent.id, name: agent.name, email: agent.email, role: agent.role },
    };
  }

  async refresh(token: string) {
    try {
      const payload = this.jwt.verify(token, {
        secret: process.env.JWT_REFRESH_SECRET ?? 'refresh_secret',
      });
      const agent = await this.prisma.agent.findUnique({ where: { id: payload.sub } });
      if (!agent?.isActive) throw new Error();
      return {
        accessToken: this.jwt.sign(
          { sub: agent.id, email: agent.email, role: agent.role },
          { expiresIn: '8h' },
        ),
      };
    } catch {
      throw new UnauthorizedException('Token inválido');
    }
  }
}
