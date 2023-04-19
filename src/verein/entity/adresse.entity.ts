import {
    Column,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Verein } from './verein.entity.js';

@Entity()
export class Adresse {
    @Column('int')
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @Column('Postleitzahl')
    @ApiProperty({ example: '76351' })
    readonly plz: String | undefined;

    @Column('Ort')
    @ApiProperty({ example: 'Linkenheim-Hochstetten' })
    readonly ort: String | undefined;

    @OneToOne(() => Verein, (verein) => verein.adresse)
    @JoinColumn({ name: 'verein_id' })
    verein: Verein | undefined;
}
