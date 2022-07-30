// version2
const express = require('express');
const morgan = require('morgan')
const app = express();

app.use(morgan('dev'));

// routes
const authRoutes = require('../routes/mobile/auth');
const creditBillRoutes = require('../routes/mobile/creditBills');

app.use('/auth', authRoutes);
app.use('/creditBill', creditBillRoutes);

module.exports = app;