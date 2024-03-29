
require('dotenv').config()
const DB_URL = process.env.NODE_ENV=='production'?
process.env.DATABASE_URL:process.env.DEV_DATABASE_URL
const config = {
  development: {
    url: DB_URL,
    dialect: 'postgres'
  },
  production: {
    url: DB_URL,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
};

module.exports= config;