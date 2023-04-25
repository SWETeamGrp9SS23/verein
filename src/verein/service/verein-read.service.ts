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
 * Das Modul besteht aus der Klasse {@linkcode VereinReadService}.
 * @packageDocumentation
 */

import { Injectable } from '@nestjs/common';
import { QueryBuilder } from './query-builder.js';
import RE2 from 're2';
import { getLogger } from '../../logger/logger.js';

/**
 * Typdefinition für `findById`
 */
export interface FindByIdParams {
    /** ID des gesuchten Vereins */
    id: number;
}
export interface Suchkriterien {
    readonly name?: string;
    readonly mitgliedsbeitrag?: number;
    readonly entstehungsdatum?: string;
    readonly homepage?: string;
    readonly adresse?: string;
}

/**
 * Die Klasse `VereinReadService` implementiert das Lesen für Verein und greift
 * mit _TypeORM_ auf eine relationale DB zu.
 */
@Injectable()
export class VereinReadService {
    static readonly ID_PATTERN = new RE2('^[1-9][\\d]*$');

    readonly #queryBuilder: QueryBuilder;

    readonly #logger = getLogger(VereinReadService.name);

    constructor(queryBuilder: QueryBuilder) {
        this.#queryBuilder = queryBuilder;
    }

    // Rueckgabetyp Promise bei asynchronen Funktionen
    //    ab ES2015
    //    vergleiche Task<> bei C# und Mono<> aus Project Reactor
    // Status eines Promise:
    //    Pending: das Resultat ist noch nicht vorhanden, weil die asynchrone
    //             Operation noch nicht abgeschlossen ist
    //    Fulfilled: die asynchrone Operation ist abgeschlossen und
    //               das Promise-Objekt hat einen Wert
    //    Rejected: die asynchrone Operation ist fehlgeschlagen and das
    //              Promise-Objekt wird nicht den Status "fulfilled" erreichen.
    //              Im Promise-Objekt ist dann die Fehlerursache enthalten.

    /**
     * Ein Verein asynchron anhand seiner ID suchen
     * @param id ID des gesuchten Vereins
     * @returns Der gefundene Verein vom Typ [Verein](verein_entity_verein_entity.Verein.html) oder undefined
     *          in einem Promise aus ES2015 (vgl.: Mono aus Project Reactor oder
     *          Future aus Java)
     */
    // https://2ality.com/2015/01/es6-destructuring.html#simulating-named-parameters-in-javascript
    async findById({ id }: FindByIdParams) {
        this.#logger.debug('findById: id=%d', id);

        // https://typeorm.io/working-with-repository
        // Das Resultat ist undefined, falls kein Datensatz gefunden
        // Lesen: Keine Transaktion erforderlich
        const verein = await this.#queryBuilder.buildId({ id }).getOne();
        if (verein === null) {
            this.#logger.debug('findById: Kein Verein gefunden');
            return;
        }

        this.#logger.debug('findById: verein=%o', verein);
        return verein;
    }

    /**
     * Vereine asynchron suchen.
     * @param suchkriterien JSON-Objekt mit Suchkriterien
     * @returns Ein JSON-Array mit den gefundenen Vereinen. Ggf. ist das Array leer.
     */
    async find(suchkriterien?: Suchkriterien) {
        this.#logger.debug('find: suchkriterien=%o', suchkriterien);

        // Keine Suchkriterien?
        if (suchkriterien === undefined) {
            const vereine = await this.#queryBuilder.build({}).getMany();
            return vereine;
        }
        const keys = Object.keys(suchkriterien);
        if (keys.length === 0) {
            const vereine = await this.#queryBuilder
                .build(suchkriterien)
                .getMany();
            return vereine;
        }

        // QueryBuilder https://typeorm.io/select-query-builder
        // Das Resultat ist eine leere Liste, falls nichts gefunden
        // Lesen: Keine Transaktion erforderlich
        const vereine = await this.#queryBuilder.build(suchkriterien).getMany();
        this.#logger.debug('find: vereine=%o', vereine);

        return vereine;
    }
}
