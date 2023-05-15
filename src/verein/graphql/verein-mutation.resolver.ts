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
// eslint-disable-next-line max-classes-per-file
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { type CreateError, type UpdateError } from '../service/errors.js';
import { IsInt, IsNumberString, Min } from 'class-validator';
import { UseGuards, UseInterceptors } from '@nestjs/common';
import { BadUserInputError } from './errors.js';
import { Verein } from '../entity/verein.entity.js';
import { VereinDTO } from '../rest/vereinDTO.entity.js';
import { VereinWriteService } from '../service/verein-write.service.js';
import { type IdInput } from './verein-query.resolver.js';
import { JwtAuthGraphQlGuard } from '../../security/auth/jwt/jwt-auth-graphql.guard.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { RolesAllowed } from '../../security/auth/roles/roles-allowed.decorator.js';
import { RolesGraphQlGuard } from '../../security/auth/roles/roles-graphql.guard.js';
import { getLogger } from '../../logger/logger.js';
import { Adresse } from '../entity/adresse.entity.js';

// Authentifizierung und Autorisierung durch
//  GraphQL Shield
//      https://www.graphql-shield.com
//      https://github.com/maticzav/graphql-shield
//      https://github.com/nestjs/graphql/issues/92
//      https://github.com/maticzav/graphql-shield/issues/213
//  GraphQL AuthZ
//      https://github.com/AstrumU/graphql-authz
//      https://www.the-guild.dev/blog/graphql-authz

export class VereinUpdateDTO extends VereinDTO {
    @IsNumberString()
    readonly id!: string;

    @IsInt()
    @Min(0)
    readonly version!: number;
}
@Resolver()
// alternativ: globale Aktivierung der Guards https://docs.nestjs.com/security/authorization#basic-rbac-implementation
@UseGuards(JwtAuthGraphQlGuard, RolesGraphQlGuard)
@UseInterceptors(ResponseTimeInterceptor)
export class VereinMutationResolver {
    readonly #service: VereinWriteService;

    readonly #logger = getLogger(VereinMutationResolver.name);

    constructor(service: VereinWriteService) {
        this.#service = service;
    }

    @Mutation()
    @RolesAllowed('admin', 'mitarbeiter')
    async create(@Args('input') vereinDTO: VereinDTO) {
        this.#logger.debug('create: vereinDTO=%o', vereinDTO);

        const verein = this.#vereinDtoToVerein(vereinDTO);
        const result = await this.#service.create(verein);
        this.#logger.debug('createVerein: result=%o', result);

        if (Object.prototype.hasOwnProperty.call(result, 'type')) {
            throw new BadUserInputError(
                this.#errorMsgCreateVerein(result as CreateError),
            );
        }
        return result;
    }

    @Mutation()
    @RolesAllowed('admin', 'mitarbeiter')
    async update(@Args('input') vereinDTO: VereinUpdateDTO) {
        this.#logger.debug('update: verein=%o', vereinDTO);

        const verein = this.#vereinUpdateDtoToVerein(vereinDTO);
        const versionStr = `"${vereinDTO.version.toString()}"`;

        const result = await this.#service.update({
            id: Number.parseInt(vereinDTO.id, 10),
            verein: verein,
            version: versionStr,
        });
        if (typeof result === 'object') {
            throw new BadUserInputError(this.#errorMsgUpdateVerein(result));
        }
        this.#logger.debug('updateVerein: result=%d', result);
        return result;
    }

    @Mutation()
    @RolesAllowed('admin')
    async delete(@Args() id: IdInput) {
        const idStr = id.id;
        this.#logger.debug('delete: id=%s', idStr);
        const result = await this.#service.delete(idStr);
        this.#logger.debug('deleteVerein: result=%s', result);
        return result;
    }

    #vereinDtoToVerein(vereinDTO: VereinDTO): Verein {
        const adresseDTO = vereinDTO.adresse;
        const adresse: Adresse = {
            id: undefined,
            plz: adresseDTO.plz,
            ort: adresseDTO.ort,
            verein: undefined,
        };
        const verein = {
            id: undefined,
            version: undefined,
            name: vereinDTO.name,
            mitgliedsbeitrag: vereinDTO.mitgliedsbeitrag,
            entstehungsdatum: vereinDTO.entstehungsdatum,
            homepage: vereinDTO.homepage,
            adresse,
            erzeugt: undefined,
            aktualisiert: undefined,
        };
        verein.adresse.verein = verein;
        return verein;
    }

    #vereinUpdateDtoToVerein(vereinDTO: VereinUpdateDTO): Verein {
        return {
            id: undefined,
            version: undefined,
            name: vereinDTO.name,
            mitgliedsbeitrag: vereinDTO.mitgliedsbeitrag,
            entstehungsdatum: vereinDTO.entstehungsdatum,
            homepage: vereinDTO.homepage,
            adresse: undefined,
            erzeugt: undefined,
            aktualisiert: undefined,
        };
    }

    #errorMsgCreateVerein(err: CreateError) {
        switch (err.type) {
            case 'NameExists': {
                return `Der Name des Vereins ${err.name} existiert bereits`;
            }
            default: {
                return 'Unbekannter Fehler';
            }
        }
    }

    #errorMsgUpdateVerein(err: UpdateError) {
        switch (err.type) {
            case 'VereinNotExists': {
                return `Es gibt kein Verein mit der ID ${err.id}`;
            }
            case 'VersionInvalid': {
                return `"${err.version}" ist keine gueltige Versionsnummer`;
            }
            case 'VersionOutdated': {
                return `Die Versionsnummer "${err.version}" ist nicht mehr aktuell`;
            }
            default: {
                return 'Unbekannter Fehler';
            }
        }
    }
}
