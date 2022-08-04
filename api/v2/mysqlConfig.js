const mysql = require('mysql')

const pool = mysql.createPool({
    connectionLimit: 100,
    host:'scs-appservice-database.cuies1xmg40c.ap-south-1.rds.amazonaws.com',
    user:'scs2021admin',
    password:'nodejs#$#878',
    database:'scsappdbservices'
})

module.exports = pool;