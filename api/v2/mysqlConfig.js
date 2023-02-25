const mysql = require("mysql")

const pool = mysql.createPool({
  connectionLimit: 100,
  // host: "scs-appservice-database.cuies1xmg40c.ap-south-1.rds.amazonaws.com",
  // user: "scs2021admin",

  // new aws rds connection 2023 feb
  host: "scsbillsdb2.c4cket3gy2ao.ap-south-1.rds.amazonaws.com",
  user: "scs2023admin",
  password: "nodejs#$#878",
  database: "scsappdbservices",

  // host: "localhost",
  // user: "root",
  // password: "root",
  // database: "SCSbilling",
})

module.exports = pool
