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

    @Column({ name: 'postleitzahl', type: 'varchar', length: 10 })
    @ApiProperty({ example: '76351', type: String })
    readonly plz: string | undefined;

    @Column({ name: 'ort', type: 'varchar', length: 100, nullable: true })
    @ApiProperty({ example: 'Linkenheim-Hochstetten', type: String })
    readonly ort: string | undefined;

    @OneToOne(() => Verein, (verein) => verein.adresse)
    @JoinColumn({ name: 'verein_id' })
    verein: Verein | undefined;
}
