import { Controller, Get, Post, Body, Param, Logger } from '@nestjs/common';
import {
  TicketsService,
  IAddress as Address,
  Identity,
  Ticket,
  TicketStatus,
} from '../services/tickets.service';
import { ApiTags } from '@nestjs/swagger';

export class TicketRequestDto {
  passportId: string;
  reason: string;

  startAddress: Address;
  endAddress: Address;

  validFromDateTime: Date;
  validToDateTime: Date;
}

export class IdentityDto implements Identity {
  hashedPassportId: string;
}

export class TicketResponseDto implements Ticket {
  ticketId: string;

  hashedPassportId: string;
  reason: string;

  startAddress: Address;
  endAddress: Address;

  validFromDateTime: Date;
  validToDateTime: Date;

  ticketStatus: TicketStatus;
}

export class AddressDto implements Address {
  street: string;
  houseNumber: string;
  zipCode: string;
  city: string;
  country: string;
}

@ApiTags('ticket')
@Controller('api/v1/tickets')
export class TicketsController {
  private readonly logger = new Logger(TicketsController.name);

  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  async createTicket(
    @Body() ticketDto: TicketRequestDto,
  ): Promise<TicketResponseDto> {
    return this.ticketsService.createTicket({
      hashedPassportId: '#' + ticketDto.passportId,
      reason: ticketDto.reason,
      startAddress: ticketDto.startAddress,
      endAddress: ticketDto.endAddress,
      validFromDateTime: ticketDto.validFromDateTime,
      validToDateTime: ticketDto.validToDateTime,
    });
  }

  @Get(':ticketId')
  async getTicket(
    @Param('ticketId') ticketId: string,
  ): Promise<TicketResponseDto> {
    return this.ticketsService.findTicket(ticketId);
  }

  @Post('/identity')
  async retrieveTicketsForIdentity(
    @Body() identity: IdentityDto,
  ): Promise<TicketResponseDto[]> {
    return this.ticketsService.retrieveByIdentity(identity);
  }
}
