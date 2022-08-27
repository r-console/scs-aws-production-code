const express = require("express")
const router = express.Router()
const { Console } = require("console")
const fs = require("fs")
const pool = require("../../mysqlConfig")

// get bills by branch
router.post("/getbranchbills", (req, res) => {
  try {
    pool.getConnection((err, connection) => {
      if (err) throw err

      const params = req.body
      console.log(req.body)
      if (params.searchType != "ALL") {
        if (
          params.searchText != "" &&
          params.date1 != null &&
          params.date2 != null
        ) {
          connection.query(
            `SELECT bills.*, employee.employee_name FROM bills 
                                JOIN employee ON (bills.employee_id = employee.id) 
                                AND (employee.branch_id = ? AND (bills.bill_date >= ? AND bills.bill_date <= ?)) 
                                AND (bills.customer_name = ? OR bills.invoice_id = ? OR bills.customer_phoneno = ? OR employee.employee_name=?)
                                AND payment_status = ?
                                ORDER by bills.bill_date DESC`,
            [
              params.branch_id,
              params.date1,
              params.date2,
              params.searchText,
              params.searchText,
              params.searchText,
              params.searchText,
              params.searchType,
            ],
            (err, rows) => {
              connection.release() //return the connection to the pool

              if (!err) {
                res.send({ bills: rows, status: 200 })
              } else {
                console.log(err)
                res.send({ status: 300 })
              }
            }
          )
        } else if (
          params.searchText == "" &&
          params.date2 != null &&
          params.date2 != null
        ) {
          connection.query(
            `SELECT bills.*, employee.employee_name FROM bills 
                                JOIN employee ON (bills.employee_id = employee.id) 
                                AND (employee.branch_id = ? AND (bills.bill_date >= ? AND bills.bill_date <= ?))
                                AND payment_status = ?
                                ORDER by bills.bill_date DESC`,
            [params.branch_id, params.date1, params.date2, params.searchType],
            (err, rows) => {
              connection.release() //return the connection to the pool

              if (!err) {
                res.send({ bills: rows, status: 200 })
              } else {
                console.log(err)
                res.send({ status: 300 })
              }
            }
          )
        } else {
          connection.query(
            `SELECT bills.*, employee.employee_name FROM bills 
                                JOIN employee ON (bills.employee_id = employee.id) 
                                AND (employee.branch_id = ? AND (bills.customer_name = ? OR bills.customer_phoneno = ? OR bills.invoice_id = ? OR employee.employee_name=?))
                                AND payment_status = ?
                                ORDER by bills.bill_date DESC`,
            [
              params.branch_id,
              params.searchText,
              params.searchText,
              params.searchText,
              params.searchText,
              params.searchType,
            ],
            (err, rows) => {
              connection.release() //return the connection to the pool

              if (!err) {
                res.send({ bills: rows, status: 200 })
              } else {
                console.log(err)
                res.send({ status: 300 })
              }
            }
          )
        }
      } else {
        if (
          params.searchText != "" &&
          params.date1 != null &&
          params.date2 != null
        ) {
          connection.query(
            `SELECT bills.*, employee.employee_name FROM bills 
                                JOIN employee ON (bills.employee_id = employee.id) 
                                AND (employee.branch_id = ? AND (bills.bill_date >= ? AND bills.bill_date <= ?)) 
                                AND (bills.customer_name = ? OR bills.invoice_id = ? OR bills.customer_phoneno = ? OR employee.employee_name=?)
                                ORDER by bills.bill_date DESC`,
            [
              params.branch_id,
              params.date1,
              params.date2,
              params.searchText,
              params.searchText,
              params.searchText,
              params.searchText,
            ],
            (err, rows) => {
              connection.release() //return the connection to the pool

              if (!err) {
                res.send({ bills: rows, status: 200 })
              } else {
                console.log(err)
                res.send({ status: 300 })
              }
            }
          )
        } else if (
          params.searchText == "" &&
          params.date2 != null &&
          params.date2 != null
        ) {
          connection.query(
            `SELECT bills.*, employee.employee_name FROM bills 
                                JOIN employee ON (bills.employee_id = employee.id) 
                                AND (employee.branch_id = ? AND (bills.bill_date >= ? AND bills.bill_date <= ?))
                                ORDER by bills.bill_date DESC`,
            [params.branch_id, params.date1, params.date2],
            (err, rows) => {
              connection.release() //return the connection to the pool

              if (!err) {
                res.send({ bills: rows, status: 200 })
              } else {
                console.log(err)
                res.send({ status: 300 })
              }
            }
          )
        } else {
          connection.query(
            `SELECT bills.*, employee.employee_name FROM bills 
                                JOIN employee ON (bills.employee_id = employee.id) 
                                AND (employee.branch_id = ? AND (bills.customer_name = ? OR bills.customer_phoneno = ? OR bills.invoice_id = ? OR employee.employee_name=?))
                                ORDER by bills.bill_date DESC`,
            [
              params.branch_id,
              params.searchText,
              params.searchText,
              params.searchText,
              params.searchText,
            ],
            (err, rows) => {
              connection.release() //return the connection to the pool

              if (!err) {
                res.send({ bills: rows, status: 200 })
              } else {
                console.log(err)
                res.send({ status: 300 })
              }
            }
          )
        }
      }
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({ status: 300 })
  }
})

// get all bills admin account
router.post("/allbills", (req, res) => {
  try {
    pool.getConnection((err, connection) => {
      if (err) throw err

      const params = req.body

      if (params.searchType != "ALL") {
        if (
          params.searchText != "" &&
          (params.date1 != null || params.date2 != null)
        ) {
          console.log("first called")
          console.log(
            params.date1,
            params.date2,
            params.searchText,
            params.searchText,
            params.searchText,
            params.searchType
          )
          connection.query(
            `SELECT bills.*, employee.employee_name FROM bills 
                                JOIN employee ON (bills.employee_id = employee.id) 
                                AND (bills.bill_date >= ? AND bills.bill_date <= ?)
                                AND (bills.customer_name = ? OR bills.invoice_id = ? OR bills.customer_phoneno = ?)
                                AND payment_status = ?`,
            [
              params.date1,
              params.date2,
              params.searchText,
              params.searchText,
              params.searchText,
              params.searchType,
            ],
            (err, rows) => {
              connection.release() //return the connection to the pool

              if (!err) {
                res.send({ bills: rows, status: 200 })
              } else {
                console.log(err)
                res.send({ status: 300 })
              }
            }
          )
        } else if (
          params.searchText == "" &&
          (params.date2 != null || params.date2 != null)
        ) {
          console.log("second called")
          connection.query(
            `SELECT bills.*, employee.employee_name FROM bills 
                                JOIN employee ON (bills.employee_id = employee.id) 
                                AND bills.bill_date >= ? AND bills.bill_date <= ?
                                AND payment_status = ?`,
            [params.date1, params.date2, params.searchType],
            (err, rows) => {
              connection.release() //return the connection to the pool

              if (!err) {
                res.send({ bills: rows, status: 200 })
              } else {
                console.log(err)
                res.send({ status: 300 })
              }
            }
          )
        } else {
          console.log("third called")
          connection.query(
            `SELECT bills.*, employee.employee_name FROM bills 
                                JOIN employee ON (bills.employee_id = employee.id) 
                                AND (bills.customer_name = ? OR bills.customer_phoneno = ? OR bills.invoice_id = ? )
                                AND payment_status = ?`,
            [
              params.searchText,
              params.searchText,
              params.searchText,
              params.searchType,
            ],
            (err, rows) => {
              connection.release() //return the connection to the pool

              if (!err) {
                res.send({ bills: rows, status: 200 })
              } else {
                console.log(err)
                res.send({ status: 300 })
              }
            }
          )
        }
      } else {
        console.log("fourth called")
        if (
          params.searchText != "" &&
          (params.date1 != null || params.date2 != null)
        ) {
          connection.query(
            `SELECT bills.*, employee.employee_name FROM bills 
                                JOIN employee ON (bills.employee_id = employee.id) 
                                AND (bills.bill_date >= ? AND bills.bill_date <= ?)
                                AND (bills.customer_name = ? OR bills.invoice_id = ? OR bills.customer_phoneno = ?)`,
            [
              params.date1,
              params.date2,
              params.searchText,
              params.searchText,
              params.searchText,
            ],
            (err, rows) => {
              connection.release() //return the connection to the pool

              if (!err) {
                res.send({ bills: rows, status: 200 })
              } else {
                console.log(err)
                res.send({ status: 300 })
              }
            }
          )
        } else if (
          params.searchText == "" &&
          (params.date2 != null || params.date2 != null)
        ) {
          console.log("fifth called")
          connection.query(
            `SELECT bills.*, employee.employee_name FROM bills 
                                JOIN employee ON (bills.employee_id = employee.id) 
                                AND bills.bill_date >= ? AND bills.bill_date <= ?`,
            [params.date1, params.date2],
            (err, rows) => {
              connection.release() //return the connection to the pool

              if (!err) {
                res.send({ bills: rows, status: 200 })
              } else {
                console.log(err)
                res.send({ status: 300 })
              }
            }
          )
        } else {
          console.log("sixth called")
          connection.query(
            `SELECT bills.*, employee.employee_name FROM bills 
                                JOIN employee ON (bills.employee_id = employee.id) 
                                AND (bills.customer_name = ? OR bills.customer_phoneno = ? OR bills.invoice_id = ? )`,
            [params.searchText, params.searchText, params.searchText],
            (err, rows) => {
              connection.release() //return the connection to the pool

              if (!err) {
                res.send({ bills: rows, status: 200 })
              } else {
                console.log(err)
                res.send({ status: 300 })
              }
            }
          )
        }
      }
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({ status: 300 })
  }
})

router.get("/getmachinedetails/:id", (req, res) => {
  try {
    console.log("/getmachinedetails/:id url called")
    pool.getConnection((err, connection) => {
      if (err) throw err

      connection.query(
        "SELECT * FROM machine WHERE bill_id = ?",
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

// get mobile app users billing locations
router.post("/getlocations", (req, res) => {
  try {
    console.log("/getlocations url called")
    const { searchDate, searchEmpId } = req.body
    console.log(req.body)

    pool.getConnection((err, connection) => {
      if (err) throw err

      connection.query(
        `SELECT b.bill_date, b.customer_address, loc.* FROM billing_locations as loc
            JOIN bills as b ON loc.bill_id = b.id AND loc.emp_id = ? AND cast (b.bill_date as date) = ?`,
        [searchEmpId, searchDate],
        (err, rows) => {
          connection.release() //return the connection to the pool

          if (!err) {
            console.log(rows)
            for (let i = 0; i < rows.length; i++) {
              rows[i].id = i + 1
            }
            res.status(200).send(rows)
          } else {
            console.log("error")
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
