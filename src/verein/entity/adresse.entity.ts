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
    id!: number;

    @Column({ name: 'postleitzahl', type: 'varchar', length: 10 })
    readonly plz!: string;

    @Column({ name: 'ort', type: 'varchar', length: 100, nullable: true })
    readonly ort?: string;

    @OneToOne(() => Verein, (verein) => verein.adresse)
    @JoinColumn({ name: 'verein_id' })
    verein?: Verein;
}
