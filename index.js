import express from 'express'
import bodyParser from 'body-parser'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import connectMongo from 'connect-mongo'
import cors from 'cors'
import session from 'express-session'

import routerUser from './routes/users.js'
import routerProduct from './routes/products.js'
import routerForm from './routes/forms.js'
import bannersForm from './routes/banners.js'
import newsForm from './routes/news.js'
// import routerProduct from './routes/productss.js'

dotenv.config()

mongoose.connect(process.env.DBURL, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })

const app = express()

app.use(bodyParser.json())

// 跨域設定
app.use(cors({
  origin (origin, callback) {
    // 如果是 Postman 之類的後端, 允許
    if (origin === undefined) {
      callback(null, true)
    } else {
      if (process.env.DEV === 'true') {
        // 如果是本機開發, 接受所有請求
        callback(null, true)
      } else if (origin.includes('github')) {
        // 如果不是本機開發, 但是是從 github 過來的請求, 允許
        callback(null, true)
      } else {
        // 如果不是本機開發, 也不是從 github 過來, 拒絕
        callback(new Error('Not allowed'), false)
      }
    }
  },
  credentials: true
}))

const MongoStore = connectMongo(session)

const sessionSettings = {
  secret: 'dabei',
  store: new MongoStore({ mongooseConnection: mongoose.connection }),
  cookie: {
    maxAge: 1000 * 60 * 30
  },
  saveUninitialized: false,
  rolling: true,
  resave: true
}

if (process.env.DEV === 'false') {
  // 如果不是本機的開發環境，允許不同網域的認證
  sessionSettings.cookie.sameSite = 'none'
  // 如果是不同網域的認證，一定要設定 secure
  sessionSettings.cookie.secure = true
}

app.use(session(sessionSettings))

// 部署上 heroku 一定要設定
app.set('trust proxy', 1)

app.use('/users', routerUser)
app.use('/products', routerProduct)
app.use('/forms', routerForm)
app.use('/banners', bannersForm)
app.use('/news', newsForm)

// bodyparser cors 之類的套件`發生錯誤時的處理
// app.use((err, req, res, next) => {})
// err 發生的錯誤
// next 繼續到下一個 middleware，因為這是最後一個所以不需要
// _ 代表不使用 function 的參數
app.use((_, req, res, next) => {
  res.status(500).send({ success: false, message: '伺服器錯誤' })
})

app.listen(process.env.PORT, () => {
  console.log('伺服器啟動')
})
