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
  ApiBadRequestResponse,
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
import { MeDto } from './dto/me.dto';
import { RegisterUserDto } from './dto/register.user.dto';
import { UpdateUserVersionTwoDto } from './dto/update.user-v2.dto';
import { UpdateUserDto } from './dto/update.user.dto';
import { UserUpdateImageDto } from './dto/user-updateimage.dto';
import { UserWithRankDto } from './dto/user-withrank.dto';
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
  @ApiOkResponse({ type: MeDto })
  @ApiOperation({ summary: '내 정보 확인' })
  @Get('/me')
  async getUser(@AuthUser() user: User) {
    const { twoFactorAuthSecret, currentHashedRefreshToken, ...me } =
      await this.userService.getUser(user.userId);
    return me;
  }

  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '유저 정보 업데이트 v2' })
  @Patch('/edit')
  @UseInterceptors(
    FileInterceptor('imagePath', {
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
  @ApiBadRequestResponse({
    description: '동일한 이메일이 존재합니다.\n\n동일한 닉네임이 존재합니다.',
  })
  async editProfileVersionTwo(
    @AuthUser() user: User,
    @UploadedFile() file: Express.Multer.File,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Body() formData: UpdateUserVersionTwoDto,
  ) {
    if (file) {
      this.userService.removeExistingImagePath(user.userId);
      this.userService.updateProfileImagePath(
        user.userId,
        `/profile_image/${file.filename}`,
      );
    }
    return this.userService.updateUserProfileV2(user.userId, formData);
  }

  @ApiOkResponse({ type: UserWithRankDto })
  @ApiOperation({ summary: '파라미터를 통한 유저 조회' })
  @Get('/:id')
  async getUserByParam(@Param('id') userId: number) {
    return this.userService.getUser(userId);
  }

  @ApiOkResponse({ type: UserWithRankDto })
  @ApiOperation({ summary: '파라미터를 통한 유저 조회(닉네임)' })
  @Get('/nickname/:nickname')
  async getUserByNickname(@Param('nickname') nickname: string) {
    return this.userService.getUserByNickname(nickname);
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
  @ApiOperation({ summary: '유저 사진 업로드' })
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
      `/profile_image/${file.filename}`,
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
    return this.userService.registerUser(
      user.userId,
      formData.email,
      formData.nickname,
      `/profile_image/${file.filename}`,
    );
  }
}
