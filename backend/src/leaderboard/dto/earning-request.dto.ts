import { IsUUID, IsInt, Min } from 'class-validator';

export class EarningRequestDto {
  @IsUUID()
  playerId!: string;

  @IsInt()
  @Min(1)
  amount!: number;
}
