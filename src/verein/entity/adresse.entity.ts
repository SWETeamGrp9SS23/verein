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

    @ApiProperty({ example: '76351', type: String })
    @Column({ name: 'postleitzahl', type: 'varchar', length: 10 })
    readonly plz: string | undefined;

    @ApiProperty({ example: 'Linkenheim-Hochstetten', type: String })
    @Column({ name: 'ort', type: 'varchar', length: 100, nullable: true })
    readonly ort: string | undefined;

    @ApiProperty({
        type: () => Verein,
        description: 'Der Verein, dem diese Adresse zugeordnet ist.',
    })
    @OneToOne(() => Verein, (verein) => verein.adresse)
    @JoinColumn({ name: 'verein_id' })
    verein: Verein | undefined;
}
