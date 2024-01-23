import { IsEmail, IsString, MinLength } from 'class-validator';
import { User } from '../entities/user.entity';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @MinLength(6)
  password: string;
}
