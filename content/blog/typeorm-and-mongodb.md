---
title: TypeORM and MongoDB
date: 2020-06-23T12:55:09.013Z
subtitle: Few hints about config and migrations
tags: typeorm,mongodb,mongo,pain,nestjs,typescript
---
## TypeORM configuration

```typescript
const isTsNode = Boolean(process[Symbol.for('ts-node.register.instance')]);
const migrationDir = 'migration';

export const typeOrmConfig: TypeOrmModuleOptions & MongoConnectionOptions = {
  type: 'mongodb',
  host: getEnvConfigs().MONGODB_HOST,
  port: 27017,
  retryDelay: 5000,
  database: 'portal-db',
  useUnifiedTopology: true,
  entities: [__dirname + '/../**/*.entity.{ts,js}'],
  migrationsRun: true,
  migrations: [
    path.resolve(
      isTsNode ? `${migrationDir}/*.ts` : `dist/${migrationDir}/*.js`,
    ),
  ],
  cli: {
    migrationsDir: migrationDir,
  },
  synchronize: false,
  logging: true,
};

```



* **migrations** - as we might have our migrations running in a local environment (testing, developing) we need to check for a current node instance. From this [GH topic](https://github.com/typeorm/typeorm/issues/5103). After build our migrations will be transpiled as *.*js* in a /dist directory
* **cli/migrationsDir** - location where `typeorm-cli` should create migrations files
* **migrationsRun** - after connection with database TypeORM checks for a new migration in a **migrations** directory location. After each successful run a migration name is saved in a database inside the migration table that was created automatically after the first run



## TypeORM CLI scripts

```json
{
  "scripts": {
    "typeorm:cli": "ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli -f src/config/ormconfig.ts",
    "db:migration:create": "npm run typeorm:cli migration:create --",
    "db:migration:generate": "npm run typeorm:cli migration:generate --",
    "db:migration:run": "npm run typeorm:cli migration:run",
    "db:migration:show": "npm run typeorm:cli migration:show"
  }
}
```

* `typeorm:cli` - We need a ts-node in order to run the node environment with typescript. 
* `db:migration:create` - creates our an empty migration with provided parameters

  *  we need to call those scripts: `npm run db:migration:create -- -n TestMigration`
  * `--` in order to pass next bash arguments into the called script
* `db:migration:generate` - creates new migration based on a schema change - did not work with that yet.
* `db:migration:run` - runs all the migrations that are no saved in **migrations** table/collection
* `db:migration:show` - shows all the migrations and information whether they were resolved, failed or not initialized yet

## Example migrations

#### Removing duplicated users

```typescript
import { getRepository, MigrationInterface } from 'typeorm';
import { User } from '../src/users/user.entity';
import { chain } from 'lodash';
import { Dashboard } from '../src/dashboards/dashboard.entity';
import { Folder } from '../src/folders/folder.entity';

export class RemoveDuplicateUsers1592828054887 implements MigrationInterface {
  public async up(): Promise<any> {
    const repositoryUsers = await getRepository(User);
    const repositoryDashboards = await getRepository(Dashboard);
    const repositoryFolders = await getRepository(Folder);
    const users = await repositoryUsers.find();

    const duplicates = chain(users)
      .groupBy('email')
      .map(value => value)
      .filter(users => users.length > 1)
      .value();

    for (const duplicatedUserEntities of duplicates) {
      const targetUser = duplicatedUserEntities.pop(); // latest user
      const targetUserId = targetUser.id.toHexString();

      for (const toRemoveUser of duplicatedUserEntities) {
        const dashboards = await repositoryDashboards.find({
          where: { ownerId: toRemoveUser.id.toHexString() },
        });
        for (const dashboard of dashboards) {
          dashboard.ownerId = targetUserId;
          await dashboard.update({ ownerId: targetUserId });
        }

        const folders = await repositoryFolders.find({
          where: { ownerId: toRemoveUser.id.toHexString() },
        });

        for (const folder of folders) {
          folder.ownerId = targetUserId;
          await folder.update({ ownerId: targetUserId });
        }
      }

      await repositoryUsers.remove(duplicatedUserEntities);
    }
  }

  public async down(): Promise<any> {
    console.log('Migration down.');
  }
}

```

We can use `queryRunner` or external methods provided by `typeorm` to access specific repositories in our database. In this example, we are finding all the possible users duplicates by email and removing the oldest one. During that, we find all the folders and dashboards that belong to duplicated users and then assign them to the ones that will persist. We have a strong believe this operation will succeed - the reason why there is no `down` implementation :)

#### Adding a unique index to the collection

```typescript
import { MigrationInterface } from 'typeorm';
import { MongoQueryRunner } from 'typeorm/driver/mongodb/MongoQueryRunner';

export class UserEmailUniqueIndex1592912423367 implements MigrationInterface {
  public async up(queryRunner: MongoQueryRunner): Promise<any> {
    const indexExists = await queryRunner.collectionIndexExists(
      'users',
      'IDX_USER_EMAIL',
    );

    if (!indexExists) {
      await queryRunner.createCollectionIndex('users', 'email', {
        unique: true,
        name: 'IDX_USER_EMAIL',
      });
    }
  }

  public async down(): Promise<any> {
    console.log('Migration down.');
  }
}

```

Here, on the other hand, we are using `queryRunner` to add a unique index to the already existing column. Firstly, we verify if the index exists, and if not we add it to the collection. We check it in case our `NestJS` decorator in `user.entity.ts` adds this on its own.



## Running migrations

After a release to the production branch and after TypeORM initial connection with the database our migrations will run automatically thank the **migrationsRun.**