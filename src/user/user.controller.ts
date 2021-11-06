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
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { JwtTwoFactorGuard } from 'src/auth/guards/jwt-two-factor.guard';
import { AuthUser } from 'src/decorators/auth-user.decorator';
import { UserStatus } from 'src/entities/User';
import { editFileName, imageFileFilter } from 'src/utils/file-upload.util';
import { User } from '../entities/User';
import { RegisterUserDto } from './dto/register.user.dto';
import { UpdateUserDto } from './dto/update.user.dto';
import { UserUpdateImageDto } from './dto/user-updateimage.dto';
import { UserDto } from './dto/user.dto';
import { UserService } from './user.service';

@UseInterceptors(ClassSerializerInterceptor)
@ApiTags('User')
@UseGuards(JwtTwoFactorGuard)
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
  async getUser(@AuthUser() user: User) {
    return this.userService.getUser(user.userId);
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

  // @ApiOkResponse({ type: UpdateUserDto })
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '유저 정보 업데이트' })
  @Put('/profile_image')
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
  @ApiOkResponse({ type: UserDto })
  async uploadProfileImage(
    @AuthUser() user: User,
    @UploadedFile() file: Express.Multer.File,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Body() formData: UserUpdateImageDto,
  ) {
    this.userService.removeExistingImagePath(user.userId);
    return this.userService.updateProfileImagePath(
      user.userId,
      `http://back-nestjs:3005/profile_image/${file.filename}`,
    );
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
    @AuthUser() user: User,
    @UploadedFile() file: Express.Multer.File,
    // TODO: form-data DTO도 생성할 수 있는지 확인하기
    @Body() formData: RegisterUserDto,
  ) {
    if (user.status !== UserStatus.NOT_REGISTERED)
      throw new BadRequestException(
        '잘못된 요청입니다 (회원가입 이미 되어 있음)',
      );
    if (file === undefined) {
      return this.userService.registerUser(
        user.userId,
        formData.email,
        formData.nickname,
        user.imagePath,
      );
    }
    // TODO: production 환경 일 경우
    return this.userService.registerUser(
      user.userId,
      formData.email,
      formData.nickname,
      `http://back-nestjs:3005/profile_image/${file.filename}`,
    );
  }
}
