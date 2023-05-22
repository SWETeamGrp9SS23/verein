/*
 * Copyright (C) 2016 - present Juergen Zimmermann, Hochschule Karlsruhe
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * Das Modul besteht aus der Klasse {@linkcode VereinWriteService} für die
 * Schreiboperationen im Anwendungskern.
 * @packageDocumentation
 */

import {
    type VereinNotExists,
    type CreateError,
    type UpdateError,
    type VersionInvalid,
    type VersionOutdated,
} from './errors.js';
import { type DeleteResult, Repository } from 'typeorm';
import { Verein } from '../entity/verein.entity.js';
import { VereinReadService } from './verein-read.service.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { MailService } from '../../mail/mail.service.js';
import RE2 from 're2';
import { Adresse } from '../entity/adresse.entity.js';
import { getLogger } from '../../logger/logger.js';

/** Typdefinitionen zum Aktualisieren eines Vereins mit `update`. */
export interface UpdateParams {
    /** ID des zu aktualisierenden Vereins. */
    id: number | undefined;
    /** Verein-Objekt mit den aktualisierten Werten. */
    verein: Verein;
    /** Versionsnummer für die aktualisierenden Werte. (ETAG) */
    version: string;
}

/**
 * Die Klasse `VereinWriteService` implementiert den Anwendungskern für das
 * Schreiben von Bücher und greift mit _TypeORM_ auf die DB zu.
 */
@Injectable()
export class VereinWriteService {
    private static readonly VERSION_PATTERN = new RE2('^"\\d*"');

    readonly #repo: Repository<Verein>;

    readonly #readService: VereinReadService;

    readonly #mailService: MailService;

    readonly #logger = getLogger(VereinWriteService.name);

    constructor(
        @InjectRepository(Verein) repo: Repository<Verein>,
        readService: VereinReadService,
        mailService: MailService,
    ) {
        this.#repo = repo;
        this.#readService = readService;
        this.#mailService = mailService;
    }

    /**
     * Ein neuer Verein soll angelegt werden.
     * @param verein Das neu abzulegende Verein
     * @returns Die ID des neu angelegten Vereines oder im Fehlerfall
     * [CreateError](../types/verein_service_errors.CreateError.html)
     */
    async create(verein: Verein): Promise<CreateError | number> {
        this.#logger.debug('create: verein=%o', verein);
        const validateResult = await this.#validateCreate(verein);
        if (validateResult !== undefined) {
            return validateResult;
        }

        const vereinDb = await this.#repo.save(verein); // implizite Transaktion
        this.#logger.debug('create: vereinDb=%o', vereinDb);

        await this.#sendmail(vereinDb);

        return vereinDb.id!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
    }

    /**
     * Ein vorhandener Verein soll aktualisiert werden.
     * @param verein Der zu aktualisierende Verein
     * @param id ID des zu aktualisierenden Vereins
     * @param version Die Versionsnummer für optimistische Synchronisation
     * @returns Die neue Versionsnummer gemäß optimistischer Synchronisation
     *  oder im Fehlerfall [UpdateError](../types/verein_service_errors.UpdateError.html)
     */
    // https://2ality.com/2015/01/es6-destructuring.html#simulating-named-parameters-in-javascript
    async update({
        id,
        verein,
        version,
    }: UpdateParams): Promise<UpdateError | number> {
        this.#logger.debug(
            'update: id=%d, verein=%o, version=%s',
            id,
            verein,
            version,
        );
        if (id === undefined) {
            this.#logger.debug('update: Keine gueltige ID');
            return { type: 'VereinNotExists', id };
        }

        const validateResult = await this.#validateUpdate(verein, id, version);
        this.#logger.debug('update: validateResult=%o', validateResult);
        if (!(validateResult instanceof Verein)) {
            return validateResult;
        }

        const vereinNeu = validateResult;
        const merged = this.#repo.merge(vereinNeu, verein);
        this.#logger.debug('update: merged=%o', merged);
        const updated = await this.#repo.save(merged); // implizite Transaktion
        this.#logger.debug('update: updated=%o', updated);

        return updated.version!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
    }

    /**
     * Ein Verein wird asynchron anhand seiner ID gelöscht.
     *
     * @param id ID des zu löschenden Vereins
     * @returns true, falls der Verein vorhanden war und gelöscht wurde. Sonst false.
     */
    async delete(id: number) {
        this.#logger.debug('delete: id=%d', id);
        const verein = await this.#readService.findById({ id });
        if (verein === undefined) {
            return false;
        }

        let deleteResult: DeleteResult | undefined;
        await this.#repo.manager.transaction(async (transactionalMgr) => {
            // Den Verein zur gegebenen ID mit Adresse asynchron loeschen
            const adresseId = verein.adresse?.id;
            if (adresseId !== undefined) {
                await transactionalMgr.delete(Adresse, adresseId);
            }

            deleteResult = await transactionalMgr.delete(Verein, id);
            this.#logger.debug('delete: deleteResult=%o', deleteResult);
        });

        return (
            deleteResult?.affected !== undefined &&
            deleteResult.affected !== null &&
            deleteResult.affected > 0
        );
    }

    async #validateCreate(verein: Verein): Promise<CreateError | undefined> {
        this.#logger.debug('#validateCreate: verein=%o', verein);

        const { name } = verein;
        const vereine = await this.#readService.find({ name });
        if (vereine.length > 0) {
            return { type: 'NameExists', name };
        }

        this.#logger.debug('#validateCreate: ok');
        return undefined;
    }

    async #sendmail(verein: Verein) {
        const subject = `Neue Verein ${verein.id}`;
        const ort = verein.adresse?.ort ?? 'N/A';
        const plz = verein.adresse?.plz ?? 'N/A';
        const body = `Das Verein mit der Adresse <strong>${plz} - ${ort}</strong> ist angelegt`;
        await this.#mailService.sendmail({ subject, body });
    }

    async #validateUpdate(
        verein: Verein,
        id: number,
        versionStr: string,
    ): Promise<Verein | UpdateError> {
        const result = this.#validateVersion(versionStr);
        if (typeof result !== 'number') {
            return result;
        }

        const version = result;
        this.#logger.debug(
            '#validateUpdate: verein=%o, version=%s',
            verein,
            version,
        );

        const resultFindById = await this.#findByIdAndCheckVersion(id, version);
        this.#logger.debug('#validateUpdate: %o', resultFindById);
        return resultFindById;
    }

    #validateVersion(version: string | undefined): VersionInvalid | number {
        if (
            version === undefined ||
            !VereinWriteService.VERSION_PATTERN.test(version)
        ) {
            const error: VersionInvalid = { type: 'VersionInvalid', version };
            this.#logger.debug('#validateVersion: VersionInvalid=%o', error);
            return error;
        }

        return Number.parseInt(version.slice(1, -1), 10);
    }

    async #findByIdAndCheckVersion(
        id: number,
        version: number,
    ): Promise<Verein | VereinNotExists | VersionOutdated> {
        const vereinDb = await this.#readService.findById({ id });
        if (vereinDb === undefined) {
            const result: VereinNotExists = { type: 'VereinNotExists', id };
            this.#logger.debug(
                '#checkIdAndVersion: VereinNotExists=%o',
                result,
            );
            return result;
        }

        // nullish coalescing
        const versionDb = vereinDb.version!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
        if (version < versionDb) {
            const result: VersionOutdated = {
                type: 'VersionOutdated',
                id,
                version,
            };
            this.#logger.debug(
                '#checkIdAndVersion: VersionOutdated=%o',
                result,
            );
            return result;
        }

        return vereinDb;
    }
}
