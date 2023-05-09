/*
 * Copyright (C) 2021 - present Juergen Zimmermann, Hochschule Karlsruhe
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
import { Args, Query, Resolver } from '@nestjs/graphql';
import { BadUserInputError } from './errors.js';
import { type Verein } from '../entity/verein.entity.js';
import { VereinReadService } from '../service/verein-read.service.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { UseInterceptors } from '@nestjs/common';
import { getLogger } from '../../logger/logger.js';

export type VereinDTO = Omit<Verein, 'abbildungen' | 'aktualisiert' | 'erzeugt'>;
export interface IdInput {
    id: number;
}

@Resolver()
@UseInterceptors(ResponseTimeInterceptor)
export class VereinQueryResolver {
    readonly #service: VereinReadService;

    readonly #logger = getLogger(VereinQueryResolver.name);

    constructor(service: VereinReadService) {
        this.#service = service;
    }

    @Query()
    async verein(@Args() idInput: IdInput) {
        const { id } = idInput;
        this.#logger.debug('findById: id=%d', id);

        const verein = await this.#service.findById({ id });
        if (verein === undefined) {
            // https://www.apollographql.com/docs/apollo-server/data/errors
            throw new BadUserInputError(
                `Es wurde kein Verein mit der ID ${id} gefunden.`,
            );
        }
        const vereinDTO = this.#toVereinDTO(verein);
        this.#logger.debug('findById: vereinDTO=%o', vereinDTO);
        return vereinDTO;
    }

    @Query()
    async vereine(@Args() name: { name: string } | undefined) {
        const nameStr = name?.name;
        this.#logger.debug('find: name=%s', nameStr);
        const suchkriterium = nameStr === undefined ? {} : { name: nameStr };
        const vereine = await this.#service.find(suchkriterium);
        if (vereine.length === 0) {
            throw new BadUserInputError('Es wurden keine Vereine gefunden.');
        }

        const vereineDTO = vereine.map((buch) => this.#toVereinDTO(buch));
        this.#logger.debug('find: buecherDTO=%o', vereineDTO);
        return vereineDTO;
    }

    #toVereinDTO(verein: Verein): VereinDTO {
        return {
            id: verein.id,
            version: verein.version,
            mitgliedsbeitrag: verein.mitgliedsbeitrag,
            entstehungsdatum: verein.entstehungsdatum,
            homepage: verein.homepage,
            name: verein.name,
            adresse: verein.adresse,
        };
    }
}
