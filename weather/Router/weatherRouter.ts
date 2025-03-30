import express from 'express'
import { getWeather } from '../controller/weatherController'
const weatherRouter = express.Router()
weatherRouter.get('/weather', getWeather)
export default weatherRouter