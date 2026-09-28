// send-customer-message.dto.ts — body of POST /businesses/:id/customers/:customerId/messages
import { IsString, MaxLength, MinLength } from 'class-validator';

export class SendCustomerMessageDto {
  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  content!: string;
}