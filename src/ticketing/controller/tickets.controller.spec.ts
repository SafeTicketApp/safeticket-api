import { Test, TestingModule } from '@nestjs/testing';
import { HashingService } from '../../crypto/services/hashing.service';
import { Ticket, TicketsService } from '../services/tickets.service';
import { TicketsController } from './tickets.controller';
import { TicketRequestDto, TicketResponseDto } from './tickets.dto';
import { ok } from 'neverthrow';

jest.mock('../services/tickets.service');

describe('TicketsController', () => {
    let sut: TicketsController;
    let mockedTicketService: TicketsService;
    let hashingService: HashingService;

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            controllers: [TicketsController],
            providers: [
                HashingService,
                TicketsService, // mocked
            ],
        }).compile();

        sut = app.get<TicketsController>(TicketsController);
        mockedTicketService = app.get<TicketsService>(TicketsService);
        hashingService = app.get<HashingService>(HashingService);

        // Mock ticket save to db
        const mockedTicket: Ticket = {
            ticketId: 'testing',
            reason: 'simulation',
            status: 'CREATED',
            startAddress: {
                street: '',
                houseNumber: '',
                zipCode: '',
                city: '',
                country: '',
            },
            endAddress: {
                street: '',
                houseNumber: '',
                zipCode: '',
                city: '',
                country: '',
            },
            hashedPassportId: 'wdasdsdas',
            ticketStatus: 'CREATED',
            validFromDateTime: new Date(),
            validToDateTime: new Date(),
        };
        jest.spyOn(mockedTicketService, 'createTicket').mockReturnValue(Promise.resolve(mockedTicket));
        jest.spyOn(mockedTicketService, 'invalidTickets').mockReturnValue(Promise.resolve());
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('Request ticket resource', () => {
        it('Should create a ticket', async () => {
            const ticketRequest: TicketRequestDto = {
                passportId: 'secret-id',
                reason: 'simulation',
                startAddress: {
                    street: 'Teststraße',
                    houseNumber: '42',
                    zipCode: '4711',
                    city: 'Testhausen',
                    country: 'DE',
                },
                endAddress: {
                    street: 'Teststraße',
                    houseNumber: '42',
                    zipCode: '4711',
                    city: 'Testhausen',
                    country: 'DE',
                },
                validFromDateTime: new Date(),
                validToDateTime: new Date(),
            };

            const mockedTicketResponse: Ticket = {
                ticketStatus: 'CREATED',
                ticketId: 'unique-ticket-id',
                status: 'CREATED',
                hashedPassportId: await hashingService.hashPassportId(ticketRequest.passportId),
                ...ticketRequest,
            };

            // mock the response depending on the ticket request
            jest.spyOn(mockedTicketService, 'createTicket').mockReturnValue(Promise.resolve(ok(mockedTicketResponse)));

            // test call to create ticket
            const createdTicket: TicketResponseDto = await sut.createTicket(ticketRequest);

            expect(createdTicket.ticketId).toBeTruthy();
            expect(createdTicket.hashedPassportId).toBeTruthy();
            expect(createdTicket.ticketStatus).toBe('CREATED');
            expect(createdTicket.hashedPassportId).toBe('6493f4ecc943cfdb31bc5b71f909cfa2f1f206d91618125b0f0d1eddb3a77d43');
        });
    });

    describe('invalid Ticket', () => {
        it('invalid a ticket in db', async () => {
            await sut.invalidTickets();
        });
    });
});
