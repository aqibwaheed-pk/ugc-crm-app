import { IsString, IsEmail, IsNumber, IsDateString, MinLength, MaxLength, Min, IsOptional } from 'class-validator';

export class CreateDealDto {
  @IsString({ message: 'Brand name must be a string' })
  @MinLength(1, { message: 'Brand name cannot be empty' })
  @MaxLength(255, { message: 'Brand name cannot exceed 255 characters' })
  brand_name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
  description?: string;

  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(0, { message: 'Amount cannot be negative' })
  amount: number;

  @IsOptional()
  @IsDateString({}, { message: 'Deadline must be a valid date string' })
  deadline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Deal notes cannot exceed 500 characters' })
  notes?: string;

  @IsOptional()
  @IsEmail()
  userEmail?: string; // For addon requests
}
