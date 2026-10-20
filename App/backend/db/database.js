import 'dotenv/config';
import pg from 'pg';
import { AsyncLocalStorage } from 'node:async_hooks';

const { Pool, types } = pg;
types.setTypeParser(20, (value) => Number(value));
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL est requise pour se connecter à Supabase.');
}

const pool = new Pool({
  connectionString,
  max: Number(process.env.DB_POOL_MAX || 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000
});
const transactionContext = new AsyncLocalStorage();

pool.on('error', (error) => {
  console.error('Erreur inattendue du pool PostgreSQL :', error);
});

function bindParameters(sql, args) {
  if (args.length === 1 && args[0] && typeof args[0] === 'object' && !Array.isArray(args[0])) {
    const values = [];
    const indexes = new Map();
    const text = sql.replace(/@([a-zA-Z_][a-zA-Z0-9_]*)/g, (_match, name) => {
      if (!(name in args[0])) throw new Error(`Paramètre SQL manquant : ${name}`);
      if (!indexes.has(name)) {
        indexes.set(name, values.length + 1);
        values.push(args[0][name]);
      }
      return `$${indexes.get(name)}`;
    });
    return { text, values };
  }

  let index = 0;
  const text = sql.replace(/\?/g, () => `$${++index}`);
  return { text, values: args };
}

function createDatabase(queryable) {
  return {
    prepare(sql) {
      const execute = async (method, args) => {
        let { text, values } = bindParameters(sql, args);
        if (method === 'run' && /^\s*INSERT\b/i.test(text) && !/\bRETURNING\b/i.test(text)) {
          text = `${text} RETURNING id`;
        }
        const result = await queryable.query(text, values);
        if (method === 'all') return result.rows;
        if (method === 'get') return result.rows[0];
        return {
          changes: result.rowCount,
          lastInsertRowid: result.rows[0]?.id
        };
      };

      return {
        all: (...args) => execute('all', args),
        get: (...args) => execute('get', args),
        run: (...args) => execute('run', args)
      };
    },
    async exec(sql) {
      return queryable.query(sql);
    },
    transaction(callback) {
      return async (...args) => {
        const client = await pool.connect();
        let transactionStarted = false;
        try {
          await client.query('BEGIN');
          transactionStarted = true;
          const result = await transactionContext.run(client, () => callback(...args));
          await client.query('COMMIT');
          transactionStarted = false;
          return result;
        } catch (error) {
          if (transactionStarted) await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      };
    }
  };
}

const database = createDatabase({
  query: (...args) => {
    const client = transactionContext.getStore();
    return (client || pool).query(...args);
  }
});

await pool.query('SELECT 1');
console.log('Connecté à Supabase (PostgreSQL).');

export default database;
