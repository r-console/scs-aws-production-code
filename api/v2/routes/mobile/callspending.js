const express = require("express")
const router = express.Router()
const { Console } = require("console")
const fs = require("fs")
const pool = require("../../mysqlConfig")

router.get("/:id", (req, res) => {
  try {
    console.log("/callspending/:id url called")
    pool.getConnection((err, connection) => {
      if (err) throw err

      connection.query(
        `SELECT b.* FROM bills as b 
        JOIN callspending_update as c 
        ON c.bill_id = b.id 
        AND b.employee_id = ?
        AND payment_method = 'Calls Pending'
        AND status = 'pending'
        ORDER BY id DESC`,
        [req.params.id],
        (err, rows) => {
          connection.release() //return the connection to the pool

          if (!err) {
            res.send(rows)
          } else {
            console.log(err)
          }
        }
      )
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({ status: 300 })
  }
})

router.put("/done", (req, res) => {
  try {
    console.log("/:id url called")
    pool.getConnection((err, connection) => {
      if (err) throw err

      const id = req.body.bill_id

      connection.query(
        `UPDATE callspending_update SET status = 'done' WHERE bill_id = ?`,
        [id],
        (err, rows) => {
          connection.release() //return the connection to the pool

          if (!err) {
            res.send(rows)
          } else {
            console.log(err)
          }
        }
      )
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({ status: 300 })
  }
})

module.exports = router
