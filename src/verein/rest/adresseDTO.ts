/*
 * Copyright (C) 2023 - present Juergen Zimmermann, Florian Goebel, Hochschule Karlsruhe
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

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Entity-Klasse für Adresse ohne TypeORM.
 */

const MAX_PLZ_LENGTH = 10;
const MAX_ORT_LENGTH = 100;

export class AdresseDTO {
    @ApiProperty({ example: '76351' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(MAX_PLZ_LENGTH)
    readonly plz!: string;

    @ApiProperty({ example: 'Linkenheim-Hochstetten' })
    @IsString()
    @IsOptional()
    @MaxLength(MAX_ORT_LENGTH)
    readonly ort?: string;
}
