import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
@Injectable()
export class UserService {
    constructor(private readonly prismaService: PrismaService) {}
    async findMany(idOremailOrtelegram_idOrname: string) {
        let mas = [];
        const user_dev = [];

        if (!isNaN(+idOremailOrtelegram_idOrname)) {
            mas = [{ id: +idOremailOrtelegram_idOrname }, { telegram_id: idOremailOrtelegram_idOrname }];
        }

        const user_data = await this.prismaService.users.findMany({
            where: {
                OR: [
                    ...mas,
                    { email: idOremailOrtelegram_idOrname },
                    { name: { contains: idOremailOrtelegram_idOrname, mode: 'insensitive' } },
                ],
            },
        });
        for (const user_dat of user_data) {
            const id = user_dat.id;
            const devices = await this.prismaService.devices.findMany({
                where: { user_id: id, is_active: true },
            });
            const payment = await this.prismaService.payment.findMany({
                where: { user_id: id, paid: true },
            });
            console.log(payment);
            const result = await this.prismaService
                .$queryRaw`select sum as bytes from users left join lateral ( select sum(sum) from devices left join lateral (select device_id, sum(use_traffic) from devices_servers where is_active = true and devices_servers.device_id = devices.id group by device_id) as t1 on true where devices.user_id = users.id group by user_id ) as t1 on true where users.id = ${id}`;
            const obj = {
                user: user_dat,
                devices: devices,
                bytes: result[0].bytes,
                payment: payment,
            };
            user_dev.push(obj);
        }
        return user_dev;
    }
    delete(id: number) {
        return this.prismaService.users.delete({ where: { id } });
    }

    update(id: number, name: string, email: string, balance: GLfloat, last_succes_daily: boolean, alert_push: boolean) {
        return this.prismaService.users.update({
            where: { id },
            data: { name, email, balance, last_succes_daily, alert_push },
        });
    }
}
