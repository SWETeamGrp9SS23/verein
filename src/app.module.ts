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
import {
    type MiddlewareConsumer,
    Module,
    type NestModule,
} from '@nestjs/common';
import { type ApolloDriverConfig } from '@nestjs/apollo';
import { AuthModule } from './security/auth/auth.module.js';
import { DevModule } from './config/dev/dev.module.js';
import { VereinGetController } from './verein/rest/verein-get.controller.js';
import { VereinModule } from './verein/verein.module.js';
import { VereinWriteController } from './verein/rest/verein-write.controller.js';
import { GraphQLModule } from '@nestjs/graphql';
import { HealthModule } from './health/health.module.js';
import { LoggerModule } from './logger/logger.module.js';
import { RequestLoggerMiddleware } from './logger/request-logger.middleware.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { graphQlModuleOptions } from './config/graphql.js';
import { typeOrmModuleOptions } from './config/db.js';

@Module({
    imports: [
        AuthModule,
        VereinModule,
        DevModule,
        GraphQLModule.forRoot<ApolloDriverConfig>(graphQlModuleOptions),
        LoggerModule,
        HealthModule,
        TypeOrmModule.forRoot(typeOrmModuleOptions),
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        // Middleware `RequestLoggerMiddleware` wird auf die folgenden Routen angewendet
        consumer
            .apply(RequestLoggerMiddleware)
            .forRoutes(
                VereinGetController,
                VereinWriteController,
                'auth',
                'graphql',
            );
    }
}
