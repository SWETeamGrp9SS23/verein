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
}

export class VereinDTO extends VereinDtoOhneRef {
    @ValidateNested()
    @Type(() => AdresseDTO)
    @ApiProperty({ example: 'Die Adresse', type: String })
    readonly adresse!: AdresseDTO;
}
