import { ConnectionOptions } from 'typeorm';

const config: ConnectionOptions = {
  type: 'postgres',
  host: 'db-postgres',
  port: Number(process.env.POSTGRES_DB_PORT),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  entities: [`${__dirname}/entities/*{.ts,.js}`],

  // We are using migrations, synchronize should be set to false.
  synchronize: true,

  // Run migrations automatically,
  // you can disable this if you prefer running migration manually.
  migrationsRun: false,
  logging: true,
  logger: 'file',
  // Allow both start:prod and start:dev to use migrations
  // __dirname is either dist or src folder, meaning either
  // the compiled js in prod or the ts in dev.
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
  cli: {
    entitiesDir: 'src/entities',
    migrationsDir: 'src/migrations',
  },
};

export = config;
