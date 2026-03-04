const router = require('express').Router()

const authRouter        = require('./auth')
const productRouter     = require('./products')
const transactionRouter = require('./transactions')
const reportRouter      = require('./reports')
const { debtRouter, branchRouter, categoryRouter, teamRouter } = require('./others')

router.use('/auth',         authRouter)
router.use('/products',     productRouter)
router.use('/transactions', transactionRouter)
router.use('/reports',      reportRouter)
router.use('/debts',        debtRouter)
router.use('/branches',     branchRouter)
router.use('/categories',   categoryRouter)
router.use('/team',         teamRouter)

module.exports = router
