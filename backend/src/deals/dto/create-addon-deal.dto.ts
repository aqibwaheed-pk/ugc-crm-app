import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAddonDealDto {
  @IsString({ message: 'Subject must be a string' })
  @MinLength(1, { message: 'Subject cannot be empty' })
  @MaxLength(500, { message: 'Subject cannot exceed 500 characters' })
  subject: string;

  @IsString({ message: 'Body must be a string' })
  @MinLength(1, { message: 'Body cannot be empty' })
  @MaxLength(10000, { message: 'Body cannot exceed 10000 characters' })
  body: string;

  @IsString({ message: 'Sender must be a string' })
  @MinLength(1, { message: 'Sender cannot be empty' })
  @MaxLength(500, { message: 'Sender cannot exceed 500 characters' })
  sender: string;

  @IsEmail({}, { message: 'User email must be valid' })
  userEmail: string;
}
