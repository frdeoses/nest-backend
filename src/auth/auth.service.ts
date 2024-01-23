import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

import * as bcryptjs from 'bcryptjs';

import { InjectModel } from '@nestjs/mongoose';
import { User } from './entities/user.entity';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwt-payload';
import { LoginResponse } from './interfaces/login-response';

import { CreateUserDto, LoginDto, RegisterDto, UpdateAuthDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // console.log(createUserDto);
    try {
      const { password, ...userdata } = createUserDto;

      const newUser = new this.userModel({
        // Encriptar contraseña
        password: bcryptjs.hashSync(password, 10),
        ...userdata,
      });

      await newUser.save();

      const { password: _, ...user } = newUser.toJSON();

      // Guardar usuario
      return user;

      // Generar el JWT
    } catch (error) {
      // console.log(error);
      if (error.code === 11000) {
        throw new BadRequestException(`${createUserDto.email} already exits`);
      }

      throw new InternalServerErrorException('Something terrible happen');
    }
  }

  async register(registerDto: RegisterDto): Promise<LoginResponse> {
    const user = await this.create({
      email: registerDto.email,
      name: registerDto.name,
      password: registerDto.password,
    });

    console.log(user);

    return {
      user: user,
      token: this.getJWTToken({ id: user._id }),
    };
  }

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    // console.log(loginDto);

    const { email, password } = loginDto;

    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new UnauthorizedException('Not valid credentials - email');
    }

    if (!bcryptjs.compareSync(password, user.password)) {
      throw new UnauthorizedException('Not valid credentials - password');
    }

    const { password: _, ...rest } = user.toJSON();

    return {
      user: rest,
      token: this.getJWTToken({ id: user.id }),
    };
  }

  async findUserById(id: string) {
    const user = await this.userModel.findById(id);

    const { password, ...rest } = user.toJSON();

    return rest;
  }

  findAll(): Promise<User[]> {
    return this.userModel.find();
  }

  // findOne(id: number) {
  //   return `This action returns a #${id} auth`;
  // }

  // update(id: number, updateAuthDto: UpdateAuthDto) {
  //   return `This action updates a #${id} auth`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} auth`;
  // }

  getJWTToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);

    return token;
  }
}
