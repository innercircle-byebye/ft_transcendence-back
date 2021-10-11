import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserDto } from 'src/user/dto/user.dto';
import { diskStorage } from 'multer';
import { editFileName, imageFileFilter } from 'src/utils/file-upload.util';
import { RegisterUserDto } from './dto/register.user.dto';
import { UpdateUserDto } from './dto/update.user.dto';
import { UserService } from './user.service';

@ApiTags('User')
@Controller('api/user')
export class UserController {
  constructor(private userService: UserService) {}

  @ApiOperation({ summary: '전체 유저 확인' })
  @Get()
  getAllUsers() {
    return this.userService.getAllUsers();
  }

  // TODO: connect.sid 를 통해 현재 자기자신 조회할 수 있도록 업데이트 필요
  @ApiOkResponse({ type: UserDto })
  @ApiOperation({ summary: '유저 확인' })
  @Get('/:id')
  async getUser(@Param('id') userId) {
    return this.userService.getUser(userId);
  }

  @ApiOkResponse({ type: UserDto })
  @ApiOperation({ summary: '유저 회원 가입' })
  @Post()
  async postUser(@Body() data: RegisterUserDto) {
    return this.userService.registerUser(
      data.intraUsername,
      data.email,
      data.nickname,
      data.imagePath,
    );
  }

  @ApiOkResponse({ type: UpdateUserDto })
  @ApiOperation({ summary: '유저 정보 업데이트' })
  @Patch('/:id')
  async updateUser(@Param('id') userId, @Body() updateData: UpdateUserDto) {
    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('요청값 비어있음');
    }
    return this.userService.updateUser(userId, updateData);
  }

  @ApiOperation({ summary: '로그인' })
  @Post('login')
  login() {}

  @ApiOperation({ summary: '로그아웃' })
  @Post('logout')
  logout(@Req() req, @Res() res) {
    req.logout();
    res.clearCooke('connect.sid', { httpOnly: true });
    res.send('ok');
  }

  @ApiOkResponse({ type: UserDto })
  @ApiOperation({ summary: '유저 삭제' })
  @Delete('/:id')
  async deleteUser(@Param('id') userId) {
    return this.userService.deleteUser(userId);
  }

  @ApiOperation({ summary: '프로필 사진 업로드 ' })
  @Post('/upload_profile')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './profile_image',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
      // 파일 용량 제한
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  async uploadProfileImage(@UploadedFile() file: Express.Multer.File) {
    console.log(file);
    const response = {
      originalName: file.originalname,
      filename: file.filename,
    };
    return response;
  }

  // @Get('/:imgpath')
  // seeUploadedFile(@Param('imgpath') image, @Res() res) {
  //   return res.sendFile(image, { root: './profile_image' });
  // }
}
