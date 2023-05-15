/* eslint-disable no-underscore-dangle */
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

import { afterAll, beforeAll, describe, test } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import {
    host,
    httpsAgent,
    port,
    shutdownServer,
    startServer,
} from '../testserver.js';
import { type VereineModel } from '../../src/verein/rest/verein-get.controller.js';
import { HttpStatus } from '@nestjs/common';

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const AdresseVorhanden = '80803'
const adresseNichtVorhanden = 'xx';
const schlagwortVorhanden = 'javascript';
const schlagwortNichtVorhanden = 'csharp';

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('GET /rest', () => {
    let baseURL: string;
    let client: AxiosInstance;

    beforeAll(async () => {
        await startServer();
        baseURL = `https://${host}:${port}/rest`;
        client = axios.create({
            baseURL,
            httpsAgent,
            validateStatus: () => true,
        });
    });

    afterAll(async () => {
        await shutdownServer();
    });

    test('Alle Vereine', async () => {
        // given

        // when
        const response: AxiosResponse<VereineModel> = await client.get('/');

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data).toBeDefined();

        const { vereine } = data._embedded;

        vereine
            .map((verein) => verein._links.self.href)
            .forEach((selfLink) => {
                // eslint-disable-next-line security/detect-non-literal-regexp, security-node/non-literal-reg-expr
                expect(selfLink).toMatch(new RegExp(`^${baseURL}`, 'u'));
            });
    });

    test('Vereine mit einer Postleizeil suchen', async () => {
        // given
        const params = { name: AdresseVorhanden };

        // when
        const response: AxiosResponse<VereineModel> = await client.get('/', {
            params,
        });

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data).toBeDefined();

        const { vereine } = data._embedded;

        // Jeder Verein hat eine Adresse mit einer Postleizahl '80803'
        vereine
            .map((verein) => verein.adresse)
            .forEach((adresse) =>
                expect(adresse.adresse.toLowerCase()).toEqual(
                    expect.stringContaining(AdresseVorhanden),
                ),
            );
    });

    test('Vereine zu einer nicht vorhandenen Postleizahl suchen', async () => {
        // given
        const params = { name: adresseNichtVorhanden };

        // when
        const response: AxiosResponse<string> = await client.get('/', {
            params,
        });

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.NOT_FOUND);
        expect(data).toMatch(/^not found$/iu);
    });

});
/* eslint-enable no-underscore-dangle */
