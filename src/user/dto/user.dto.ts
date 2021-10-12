// import { PickType } from '@nestjs/swagger';
import { OmitType } from '@nestjs/swagger';
import { User } from 'src/entities/User';

export class UserDto extends OmitType(User, ['currentHashedRefreshToken']) {}
