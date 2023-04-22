/* eslint-disable max-classes-per-file, @typescript-eslint/no-magic-numbers */
/*
 * Copyright (C) 2016 - present Juergen Zimmermann, Florian Goebel, Hochschule Karlsruhe
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
 * Das Modul besteht aus der Entity-Klasse.
 * @packageDocumentation
 */

import { AdresseDTO } from './adresseDTO.js';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';

export class VereinDtoOhneRef {
    @ApiProperty({ example: 'FC Bayern' })
    @IsNotEmpty()
    @IsString()
    readonly name!: string;

    @ApiProperty({ example: 1 })
    @IsNotEmpty()
    @IsNumber()
    readonly mitgliedsbeitrag!: number;

    @ApiProperty({ example: '2012-11-21' })
    @IsOptional()
    @IsString()
    readonly entstehungsdatum: Date | string | undefined;

    @ApiProperty({ example: 'https://test.de/' })
    @IsOptional()
    @IsString()
    readonly homepage?: string;

    @ApiProperty({ type: AdresseDTO })
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => AdresseDTO)
    readonly adresse!: AdresseDTO;
}

export class VereinDTO extends VereinDtoOhneRef {
    @ValidateNested()
    @Type(() => AdresseDTO)
    @ApiProperty({ example: 'Der Titel', type: String })
    readonly titel!: AdresseDTO;
}
