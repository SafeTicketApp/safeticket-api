import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import { err, ok, Result } from 'neverthrow';
import { TicketModel } from './tickets.schema';

/**
 * Enumeration of reason why ticket creation failed.
 */
export enum TicketCreationFailureReason {
    /**
     * There exists a same ticket for the same time.
     */
    ConflictInTime,
    /**
     * Undefined technical error.
     */
    InternalError,
}
/**
 * Custom failure holder  for reason why ticket creation has been aborted or declined.
 */
export class TicketCreationFailure {
    constructor(public readonly reason: TicketCreationFailureReason, public readonly error?: Error) {}
}

export interface TicketID {
    searchTicketId: string;
}

export interface Address {
    street: string;
    houseNumber: string;
    zipCode: string;
    city: string;
    country: string;
}
export type TicketStatus = 'CREATED' | 'EXPIRED' | 'DECLINED';

export interface Identity {
    hashedPassportId: string;
}

export interface TicketRequest extends Identity {
    reason: string;

    startAddress: Address;
    endAddress: Address;

    validFromDateTime: Date;
    validToDateTime: Date;
}

export interface Ticket extends TicketRequest {
    ticketId: string;
    ticketStatus: TicketStatus;
}
/**
 * Service for handling all tickets agnostic to any external access point e.g.: controller, scheduler etc.
 */
@Injectable()
export class TicketsService {
    constructor(@InjectModel('Tickets') private ticketModel: Model<TicketModel>) {}

    /**
     *Creates a new ticket by given request.
     * @param ticketToCreate the new ticket to create.
     */
    async createTicket(ticketToCreate: TicketRequest): Promise<Result<Ticket, TicketCreationFailure>> {
        try {
            let numberOfTicketsInDB = await this.ticketModel
                .find({
                    $or: [
                        {
                            validToDateTime: {
                                $gte: ticketToCreate.validFromDateTime,
                                $lte: ticketToCreate.validToDateTime,
                            },
                            validFromDateTime: {
                                $gte: ticketToCreate.validFromDateTime,
                                $lte: ticketToCreate.validToDateTime,
                            },
                        },
                    ],
                    hashedPassportId: ticketToCreate.hashedPassportId,
                })
                .countDocuments();

            console.debug(numberOfTicketsInDB);
            if (numberOfTicketsInDB > 0) {
                return Promise.resolve(err(new TicketCreationFailure(TicketCreationFailureReason.ConflictInTime)));
            }

            const savedTicket: Ticket = await new this.ticketModel(ticketToCreate).save();
            return Promise.resolve(ok(savedTicket));
        } catch (e) {
            //catch every thing and return them
            return Promise.reject(err(new TicketCreationFailure(TicketCreationFailureReason.InternalError, e)));
        }
    }

    /**
     * Search all tickets which belongs to hashed password id.
     * @param searchedHashedPasswordId hashed passwort id to search for tickets
     */
    async retrieveByIdentity(identity: Identity): Promise<Ticket[]> {
        return this.ticketModel.find({
            hashedPassportId: identity.hashedPassportId,
        });
    }
    /**
     *Find one ticket by ticket id.
     * @param searchTicketId the ticket id of the ticket to search
     */
    async findTicket(searchTicketId: string): Promise<Ticket> {
        const foundTicket: Ticket = await this.ticketModel.findOne({
            _id: new ObjectId(searchTicketId),
        });

        return foundTicket;
    }
}
