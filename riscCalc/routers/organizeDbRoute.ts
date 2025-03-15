import express from 'express'
import { organizeDb } from '../controllers/riscController'
const organizeDbRoute = express.Router()
organizeDbRoute.get('/organizeDb', organizeDb)

export default organizeDbRoute
