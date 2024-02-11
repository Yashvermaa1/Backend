import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({limit:"16kb"}))
app.use(express.static("Public"))
app.use(cookieParser())



//Routes implementations 

import userRouter from './routes/user.routes.js'
import videoRouter from './routes/video.routes.js'
import subscriptionRouter from './routes/subscription.routes.js'
import playlistRouter from './routes/playlist.routes.js'
import likeRouter from './routes/like.routes.js'
import commentsRouter from './routes/comments.routes.js'
app.use('/api/v1/users', userRouter)
app.use('/api/v1/video', videoRouter)
app.use('/api/v1/subscription', subscriptionRouter)
app.use('/api/v1/playlist', playlistRouter)
app.use('/api/v1/like', likeRouter)
app.use('/api/v1/comments', commentsRouter)


export {app} 