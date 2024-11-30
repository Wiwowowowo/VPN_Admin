import { Body, Controller, Delete, Get, Param, Put } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get(':idOremailOrtelegram_idOrname')
    findManyUser(@Param('idOremailOrtelegram_idOrname') idOremailOrtelegram_idOrname: string) {
        return this.userService.findMany(idOremailOrtelegram_idOrname);
    }

    @Delete(':id')
    deleteUser(@Param('id') id: string) {
        return this.userService.delete(+id);
    }

    @Put(':id')
    updateUser(
        @Param('id') id: string,
        @Body('name') name: string,
        @Body('email') email: string,
        @Body('balance') balance: GLfloat,
        @Body('last_succes_daily') last_succes_daily: boolean,
        @Body('alert_push') alert_push: boolean,
    ) {
        return this.userService.update(+id, name, email, +balance, last_succes_daily, alert_push);
    }
}
