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

import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { typeOrmModuleOptions } from '../../config/db.js';
import { getLogger } from '../../logger/logger.js';
import { Adresse } from '../entity/adresse.entity.js';
import { Verein } from '../entity/verein.entity.js';

/** Typdefinitionen für die Suche mit der Verein-ID. */
export interface BuildIdParams {
    /** ID des gesuchten Vereins. */
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
     * @param id ID des gesuchten Vereins
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
    build(suchkriterien: Record<string, any>) {
        this.#logger.debug('build: suchkriterien=%o', suchkriterien);

        let queryBuilder = this.#repo.createQueryBuilder(this.#vereinAlias);
        queryBuilder.innerJoinAndSelect(
            `${this.#vereinAlias}.adresse`,
            'adresse',
        );

        // z.B. { postleitzahl: '76351' }
        // "rest properties" fuer anfaengliche WHERE-Klausel: ab ES 2018 https://github.com/tc39/proposal-object-rest-spread
        // type-coverage:ignore-next-line
        const { postleitzahl, ...props } = suchkriterien;

        let useWhere = true;

        // Titel in der Query: Teilstring des Titels und "case insensitive"
        // CAVEAT: MySQL hat keinen Vergleich mit "case insensitive"
        // type-coverage:ignore-next-line
        if (postleitzahl !== undefined && typeof postleitzahl === 'string') {
            const ilike =
                typeOrmModuleOptions.type === 'postgres' ? 'ilike' : 'like';
            queryBuilder = queryBuilder.where(
                `${this.#adresseAlias}.postleitzahl ${ilike} :postleitzahl`,
                { postleitzahl: `%${postleitzahl}%` },
            );
            useWhere = false;
        }

        Object.keys(props).forEach((key) => {
            const param: Record<string, unknown> = {};
            // eslint-disable-next-line security/detect-object-injection
            param[key] = props[key];
            const whereClause = `${this.#vereinAlias}.${key} = :${key}`;
            const queryMethod = useWhere
                ? queryBuilder.where.bind(queryBuilder)
                : queryBuilder.andWhere.bind(queryBuilder);

            queryMethod(whereClause, param);

            useWhere = false;
        });

        this.#logger.debug('build: sql=%s', queryBuilder.getSql());
        return queryBuilder;
    }
}
