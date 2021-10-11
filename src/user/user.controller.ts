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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { editFileName, imageFileFilter } from 'src/utils/file-upload.util';
import { UpdateUserDto } from './dto/update.user.dto';
import { UserDto } from './dto/user.dto';
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

  @ApiOkResponse({ type: UpdateUserDto })
  @ApiOperation({ summary: '유저 정보 업데이트' })
  @Patch('/:id')
  async updateUser(@Param('id') userId, @Body() updateData: UpdateUserDto) {
    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('요청값 비어있음');
    }
    return this.userService.updateUser(userId, updateData);
  }

  @ApiOkResponse({ type: UserDto })
  @ApiOperation({ summary: '유저 삭제' })
  @Delete('/:id')
  async deleteUser(@Param('id') userId) {
    return this.userService.deleteUser(userId);
  }

  @ApiOperation({ summary: '회원 가입' })
  @Post('/register')
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
  @UseGuards(AuthGuard('jwt'))
  async registerUserWithUploadProfileImage(
    @Req() req,
    @UploadedFile() file: Express.Multer.File,
    // TODO: form-data DTO도 생성할 수 있는지 확인하기
    @Body() data,
  ) {
    console.log(data);
    console.log(req);
    // const response = {
    //   originalName: file.originalname,
    //   filename: file.filename,
    // };
    return this.userService.registerUser(
      data.userId,
      data.nickname,
      data.imagePath,
    );
  }

  // TODO: user 프로파일 이미지
  // auth guard image
  // @Get('/profile_image')
  // seeUploadedFile(@Param('imgpath') image, @Res() res) {
  //   return res.sendFile(image, { root: './profile_image' });
  // }
}
