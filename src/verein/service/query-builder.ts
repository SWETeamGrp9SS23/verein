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
 * Das Modul besteht aus der Klasse {@linkcode QueryBuilder}.
 * @packageDocumentation
 */

import { Verein } from '../entity/verein.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Adresse } from '../entity/adresse.entity.js';
import { getLogger } from '../../logger/logger.js';
import { typeOrmModuleOptions } from '../../config/db.js';

/** Typdefinitionen für die Suche mit der Buch-ID. */
export interface BuildIdParams {
    /** ID des gesuchten Buchs. */
    id: number;
}
/**
 * Die Klasse `QueryBuilder` implementiert das Lesen für Vereine und greift
 * mit _TypeORM_ auf eine relationale DB zu.
 */
@Injectable()
export class QueryBuilder {
    readonly #vereinAlias = `${Verein.name
        .charAt(0)
        .toLowerCase()}${Verein.name.slice(1)}`;

    readonly #adresseAlias = `${Adresse.name
        .charAt(0)
        .toLowerCase()}${Adresse.name.slice(1)}`;

    readonly #repo: Repository<Verein>;

    readonly #logger = getLogger(QueryBuilder.name);

    constructor(@InjectRepository(Verein) repo: Repository<Verein>) {
        this.#repo = repo;
    }

    /**
     * Ein Verein mit der ID suchen.
     * @param id ID des gesuchten Buches
     * @returns QueryBuilder
     */
    buildId({ id }: BuildIdParams) {
        const queryBuilder = this.#repo.createQueryBuilder(this.#vereinAlias);
        queryBuilder.innerJoinAndSelect(
            `${this.#vereinAlias}.adresse`,
            this.#adresseAlias,
        );
        queryBuilder.where(`${this.#vereinAlias}.id = :id`, { id: id }); // eslint-disable-line object-shorthand
        return queryBuilder;
    }

    /**
     * Vereine asynchron suchen.
     * @param suchkriterien JSON-Objekt mit Suchkriterien
     * @returns QueryBuilder
     */
    // eslint-disable-next-line max-lines-per-function
    build(suchkriterien: Record<string, any>) {
        this.#logger.debug('build: suchkriterien=%o', suchkriterien);

        let queryBuilder = this.#repo.createQueryBuilder(this.#vereinAlias);
        queryBuilder.innerJoinAndSelect(
            `${this.#vereinAlias}.adresse`,
            'adresse',
        );

        // z.B. { titel: 'a', rating: 5, javascript: true }
        // "rest properties" fuer anfaengliche WHERE-Klausel: ab ES 2018 https://github.com/tc39/proposal-object-rest-spread
        // type-coverage:ignore-next-line
        const { adresse } = suchkriterien;

        let useWhere = true;

        // Titel in der Query: Teilstring des Titels und "case insensitive"
        // CAVEAT: MySQL hat keinen Vergleich mit "case insensitive"
        // type-coverage:ignore-next-line
        if (adresse !== undefined && typeof adresse === 'string') {
            const ilike =
                typeOrmModuleOptions.type === 'postgres' ? 'ilike' : 'like';
            queryBuilder = queryBuilder.where(
                `${this.#vereinAlias}.adresse ${ilike} :adresse`,
                { adresse: `%${adresse}%` },
            );
            useWhere = false;
        }

        this.#logger.debug('build: sql=%s', queryBuilder.getSql());
        return queryBuilder;
    }
}
