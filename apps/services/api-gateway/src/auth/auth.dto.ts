import { Transform } from 'class-transformer';
import { Equals, IsBoolean, IsEmail, IsString, Length, Matches, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class RegisterDto {
  @Transform(trim) @IsString() @Length(2, 60) name: string;
  @Transform(trim) @IsEmail() @MaxLength(120) email: string;
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/[\s()-]/g, '') : value))
  @Matches(/^\+[1-9]\d{7,14}$/, { message: 'Enter a valid phone number with country code' }) phone: string;
  @IsString() @Length(10, 72, { message: 'Password must be 10 to 72 characters' })
  @Matches(/[A-Za-z]/, { message: 'Password needs letters and numbers' }) @Matches(/\d/, { message: 'Password needs letters and numbers' }) password: string;
  @IsBoolean() @Equals(true, { message: 'You must accept the terms to create an account' }) acceptTerms: boolean;
}

export class LoginDto {
  @Transform(trim) @IsEmail() @MaxLength(120) email: string;
  @IsString() @MaxLength(72) password: string;
}

export class ChangePasswordDto {
  @IsString() @MaxLength(72) current: string;
  @IsString() @Length(10, 72) next: string;
}
