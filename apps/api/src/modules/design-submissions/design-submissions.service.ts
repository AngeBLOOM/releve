import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DesignSubmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: any) {
    if (!dto?.designUrl) throw new BadRequestException('Falta el diseño');
    return this.prisma.designSubmission.create({
      data: {
        source: dto.source ?? 'simulador',
        designUrl: String(dto.designUrl),
        garment: dto.garment ?? null,
        colors: dto.colors ?? null,
        note: dto.note ?? null,
        customerName: dto.customerName ?? null,
        phone: dto.phone ?? null,
      },
    });
  }

  findAll(status?: string) {
    return this.prisma.designSubmission.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async unseenCount() {
    return { count: await this.prisma.designSubmission.count({ where: { status: 'NUEVO' } }) };
  }

  updateStatus(id: string, status: string) {
    return this.prisma.designSubmission.update({ where: { id }, data: { status } });
  }

  remove(id: string) {
    return this.prisma.designSubmission.delete({ where: { id } });
  }
}
