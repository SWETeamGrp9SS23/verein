/* eslint-disable max-lines */
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

/**
 * Das Modul besteht aus der Controller-Klasse für Lesen an der REST-Schnittstelle.
 * @packageDocumentation
 */

// eslint-disable-next-line max-classes-per-file
import {
    ApiHeader,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiProperty,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { type Verein } from '../entity/verein.entity.js';
import {
    VereinReadService,
    type Suchkriterien,
} from '../service/verein-read.service.js';
import {
    Controller,
    Get,
    Headers,
    HttpStatus,
    Param,
    Query,
    Req,
    Res,
    UseInterceptors,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { Adresse } from '../entity/adresse.entity.js';
import { getBaseUri } from './getBaseUri.js';
import { getLogger } from '../../logger/logger.js';
import { paths } from '../../config/paths.js';

/** href-Link für HATEOAS */
export interface Link {
    /** href-Link für HATEOAS-Links */
    href: string;
}

/** Links für HATEOAS */
export interface Links {
    /** self-Link */
    self: Link;
    /** Optionaler Linke für list */
    list?: Link;
    /** Optionaler Linke für add */
    add?: Link;
    /** Optionaler Linke für update */
    update?: Link;
    /** Optionaler Linke für remove */
    remove?: Link;
}

/** Typedefinition für ein Titel-Objekt ohne Rückwärtsverweis zum Buch */
export type AdresseModel = Omit<Adresse, 'verein' | 'id'>;

/** Verein-Objekt mit HATEOAS-Links */
export type VereinModel = Omit<
    Verein,
    'abbildungen' | 'aktualisiert' | 'erzeugt' | 'id' | 'adresse' | 'version'
> & {
    adresse: AdresseModel;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _links: Links;
};

/** Verein-Objekte mit HATEOAS-Links in einem JSON-Array. */
export interface VereineModel {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _embedded: {
        vereine: VereinModel[];
    };
}

/**
 *Die Klasse VereinGetController dient der Formulierung von Abfragen in OpenAPI oder Swagger.
  Sie erbt von der Basisklasse Verein und überschreibt dabei deren Eigenschaften. 
  Dabei wird sichergestellt, dass diese Eigenschaften nicht gesetzt oder undefiniert sein können, 
  um eine flexible Formulierung der Abfragen zu ermöglichen. 
  Dementsprechend wird bei jeder Eigenschaft auch der Typ undefined angegeben. 
  In OpenAPI existiert der Datentyp Date nicht, deshalb wird stattdessen der Typ string verwendet.
 */

/**
 *Die Klasse 'BuchQuery' implementiert das Interface Suchkriterien und definiert verschiedene Eigenschaften wie name, rating, 
 mitgliedsbeitrag, entstehungsdatum, homepage und adresse, die in der Abfrage optional sein können und daher 
 mit { required: false } deklariert werden.
 */
export class VerinQuery implements Suchkriterien {
    @ApiProperty({ required: false })
    declare readonly name: string;

    @ApiProperty({ required: false })
    declare readonly rating: number;

    @ApiProperty({ required: false })
    declare readonly mitgliedsbeitrag: number;

    @ApiProperty({ required: false })
    declare readonly entstehungsdatum: string;

    @ApiProperty({ required: false })
    declare readonly homepage: string;

    @ApiProperty({ required: false })
    declare readonly adresse: string;
}

/**
 * Die Controller-Klasse für die Verwaltung von Vereinen.
 */
// Decorator in TypeScript, zur Standardisierung in ES vorgeschlagen (stage 3)
// https://devblogs.microsoft.com/typescript/announcing-typescript-5-0-beta/#decorators
// https://github.com/tc39/proposal-decorators
@Controller(paths.rest)
// @UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ResponseTimeInterceptor)
@ApiTags('Verein API')
// @ApiBearerAuth()
// Klassen ab ES 2015
export class VereinGetController {
    // readonly in TypeScript, vgl. C#
    // private ab ES 2019
    readonly #service: VereinReadService;

    readonly #logger = getLogger(VereinGetController.name);

    // Dependency Injection (DI) bzw. Constructor Injection
    // constructor(private readonly service: VereinReadService) {}
    constructor(service: VereinReadService) {
        this.#service = service;
    }

    /**
     * Ein Verein wird asynchron anhand seiner ID als Pfadparameter gesucht.
     *
     * Falls es ein solches Verein gibt und `If-None-Match` im Request-Header
     * auf die aktuelle Version des Buches gesetzt war, wird der Statuscode
     * `304` (`Not Modified`) zurückgeliefert. Falls `If-None-Match` nicht
     * gesetzt ist oder eine veraltete Version enthält, wird das gefundene
     * Verein im Rumpf des Response als JSON-Datensatz mit Atom-Links für HATEOAS
     * und dem Statuscode `200` (`OK`) zurückgeliefert.
     *
     * Falls es kein Verein zur angegebenen ID gibt, wird der Statuscode `404`
     * (`Not Found`) zurückgeliefert.
     *
     * @param id Pfad-Parameter `id`
     * @param req Request-Objekt von Express mit Pfadparameter, Query-String,
     *            Request-Header und Request-Body.
     * @param version Versionsnummer im Request-Header bei `If-None-Match`
     * @param accept Content-Type bzw. MIME-Type
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    // eslint-disable-next-line max-params, max-lines-per-function
    @Get(':id')
    @ApiOperation({ summary: 'Suche mit der Verein-ID', tags: ['Suchen'] })
    @ApiParam({
        name: 'id',
        description: 'Z.B. 00000000-0000-0000-0000-000000000001',
    })
    @ApiHeader({
        name: 'If-None-Match',
        description: 'Header für bedingte GET-Requests, z.B. "0"',
        required: false,
    })
    @ApiOkResponse({ description: 'Der Verein wurde gefunden' })
    @ApiNotFoundResponse({ description: 'Kein Verein zur ID gefunden' })
    @ApiResponse({
        status: HttpStatus.NOT_MODIFIED,
        description: 'Der Verein wurde bereits heruntergeladen',
    })
    async findById(
        @Param('id') id: number,
        @Req() req: Request,
        @Headers('If-None-Match') version: string | undefined,
        @Res() res: Response,
    ): Promise<Response<VereinModel | undefined>> {
        this.#logger.debug('findById: id=%s, version=%s"', id, version);

        if (req.accepts(['json', 'html']) === false) {
            this.#logger.debug('findById: accepted=%o', req.accepted);
            return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
        }

        let verein: Verein | undefined;
        try {
            // vgl. Kotlin: Aufruf einer suspend-Function
            verein = await this.#service.findById({ id });
        } catch (err) {
            // err ist implizit vom Typ "unknown", d.h. keine Operationen koennen ausgefuehrt werden
            // Exception einer export async function bei der Ausfuehrung fangen:
            // https://strongloop.com/strongblog/comparing-node-js-promises-trycatch-zone-js-angular
            this.#logger.error('findById: error=%o', err);
            return res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        }

        if (verein === undefined) {
            this.#logger.debug('findById: NOT_FOUND');
            return res.sendStatus(HttpStatus.NOT_FOUND);
        }
        this.#logger.debug('findById(): buch=%o', verein);

        // ETags
        const versionDb = verein.version;
        if (version === `"${versionDb}"`) {
            this.#logger.debug('findById: NOT_MODIFIED');
            return res.sendStatus(HttpStatus.NOT_MODIFIED);
        }
        this.#logger.debug('findById: versionDb=%s', versionDb);
        res.header('ETag', `"${versionDb}"`);

        // HATEOAS mit Atom Links und HAL (= Hypertext Application Language)
        const vereinModel = this.#toModel(verein, req);
        this.#logger.debug('findById: buchModel=%o', vereinModel);
        return res.json(vereinModel);
    }

    /**
     * Bücher werden mit Query-Parametern asynchron gesucht. Falls es mindestens
     * ein solches Verein gibt, wird der Statuscode `200` (`OK`) gesetzt. Im Rumpf
     * des Response ist das JSON-Array mit den gefundenen Büchern, die jeweils
     * um Atom-Links für HATEOAS ergänzt sind.
     *
     * Falls es kein Verein zu den Suchkriterien gibt, wird der Statuscode `404`
     * (`Not Found`) gesetzt.
     *
     * Falls es keine Query-Parameter gibt, werden alle Bücher ermittelt.
     *
     * @param query Query-Parameter von Express.
     * @param req Request-Objekt von Express.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    @Get()
    @ApiOperation({ summary: 'Suche mit Suchkriterien', tags: ['Suchen'] })
    @ApiOkResponse({ description: 'Eine evtl. leere Liste mit Büchern' })
    async find(
        @Query() query: BuchQuery,
        @Req() req: Request,
        @Res() res: Response,
    ): Promise<Response<VereineModel | undefined>> {
        this.#logger.debug('find: query=%o', query);

        if (req.accepts(['json', 'html']) === false) {
            this.#logger.debug('find: accepted=%o', req.accepted);
            return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
        }

        const vereine = await this.#service.find(query);
        this.#logger.debug('find: %o', vereine);
        if (vereine.length === 0) {
            this.#logger.debug('find: NOT_FOUND');
            return res.sendStatus(HttpStatus.NOT_FOUND);
        }

        // HATEOAS: Atom Links je Buch
        const vereineModel = vereine.map((verein) =>
            this.#toModel(verein, req, false),
        );
        this.#logger.debug('find: buecherModel=%o', vereineModel);

        const result: VereineModel = { _embedded: { vereine: vereineModel } };
        return res.json(result).send();
    }

    #toModel(verein: Verein, req: Request, all = true) {
        const baseUri = getBaseUri(req);
        this.#logger.debug('#toModel: baseUri=%s', baseUri);
        const { id } = verein;
        const links = all
            ? {
                  self: { href: `${baseUri}/${id}` },
                  list: { href: `${baseUri}` },
                  add: { href: `${baseUri}` },
                  update: { href: `${baseUri}/${id}` },
                  remove: { href: `${baseUri}/${id}` },
              }
            : { self: { href: `${baseUri}/${id}` } };

        this.#logger.debug('#toModel: verein=%o, links=%o', verein, links);
        const adresseModel: AdresseModel = {
            plz: verein.adresse?.plz ?? 'N/A', // eslint-disable-line unicorn/consistent-destructuring
            ort: verein.adresse?.ort ?? 'N/A', // eslint-disable-line unicorn/consistent-destructuring
        };
        /* eslint-disable unicorn/consistent-destructuring */
        const vereinModel: VereinModel = {
            name: verein.name,
            mitgliedsbeitrag: verein.mitgliedsbeitrag,
            entstehungsdatum: verein.entstehungsdatum,
            homepage: verein.homepage,
            adresse: adresseModel,
            _links: links,
        };
        /* eslint-enable unicorn/consistent-destructuring */

        return vereinModel;
    }
}
/* eslint-enable max-lines */
