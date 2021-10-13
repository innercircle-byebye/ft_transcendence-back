import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
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
import {
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { UserStatus } from 'src/entities/User';
import { editFileName, imageFileFilter } from 'src/utils/file-upload.util';
import { RegisterUserDto } from './dto/register.user.dto';
import { UpdateUserDto } from './dto/update.user.dto';
import { UserDto } from './dto/user.dto';
import { UserService } from './user.service';

@UseInterceptors(ClassSerializerInterceptor)
@ApiTags('User')
@UseGuards(AuthGuard('jwt'))
@Controller('api/user')
export class UserController {
  constructor(private userService: UserService) {}

  @ApiOperation({ summary: '전체 유저 확인' })
  @Get('/all')
  getAllUsers() {
    return this.userService.getAllUsers();
  }

  // TODO: connect.sid 를 통해 현재 자기자신 조회할 수 있도록 업데이트 필요
  @ApiOkResponse({ type: UserDto })
  @ApiOperation({ summary: '유저 확인' })
  @Get('/me')
  async getUser(@Req() req) {
    return this.userService.getUser(req.user.userId);
  }

  @ApiOkResponse({ type: UserDto })
  @ApiOperation({ summary: '파라미터를 통한 유저 조회' })
  @Get('/:id')
  async getUserByParam(@Param('id') userId) {
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

  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({ type: UserDto })
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
  async registerUserWithUploadProfileImage(
    @Req() req,
    @UploadedFile() file: Express.Multer.File,
    // TODO: form-data DTO도 생성할 수 있는지 확인하기
    @Body() formData: RegisterUserDto,
  ) {
    if (req.user.status !== UserStatus.NOT_REGISTERED)
      throw new BadRequestException(
        '잘못된 요청입니다 (회원가입 이미 되어 있음)',
      );
    if (file === undefined) {
      return this.userService.registerUser(
        req.user.userId,
        formData.nickname,
        formData.email,
        req.user.imagePath,
      );
    }
    // TODO: production 환경 일 경우
    return this.userService.registerUser(
      req.user.userId,
      formData.nickname,
      formData.email,
      `http://localhost:3005/profile_image/${file.filename}`,
    );
  }
}
