import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as lancedb from '@lancedb/lancedb';
import { Connection, Table } from '@lancedb/lancedb';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LanceClientProvider implements OnModuleInit {
  private readonly logger = new Logger(LanceClientProvider.name);
  private connection: Connection | null = null;
  private table: Table | null = null;
  private isSimulation = false;

  readonly tableName = 'executive_reports';
  readonly vectorDimensions = 1536;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const dbPath = this.configService.get<string>('LANCE_DB_PATH') || './data/lancedb';
    const resolvedPath = path.resolve(dbPath);

    try {
      fs.mkdirSync(resolvedPath, { recursive: true });
      this.logger.log(`Connecting to LanceDB at ${resolvedPath}...`);
      this.connection = await lancedb.connect(resolvedPath);

      const tableNames = await this.connection.tableNames();
      if (tableNames.includes(this.tableName)) {
        this.table = await this.connection.openTable(this.tableName);
        this.logger.log(`LanceDB table "${this.tableName}" opened successfully.`);
      } else {
        this.table = await this.connection.createTable(this.tableName, [
          {
            id: '__init__',
            text: '',
            vector: new Array(this.vectorDimensions).fill(0),
            metadata: '{}',
          },
        ]);
        await this.table.delete("id = '__init__'");
        this.logger.log(`LanceDB table "${this.tableName}" created successfully.`);
      }
    } catch (err) {
      this.logger.error(`Failed to initialize LanceDB: ${err.message}. Enabling in-memory fallback.`);
      this.isSimulation = true;
    }
  }

  getTable(): Table | null {
    return this.table;
  }

  isSimulationMode(): boolean {
    return this.isSimulation;
  }
}
