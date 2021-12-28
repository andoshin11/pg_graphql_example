import * as express from 'express'
import * as logger from 'morgan'
import * as bodyParser from 'body-parser'
import * as cookieParser from 'cookie-parser'
import { Client } from 'pg'
import { buildClientSchema, getIntrospectionQuery, IntrospectionQuery, printSchema } from 'graphql'

const CONNECTION_RETRY_INTERVAL = 5000

const CORSMiddleware: express.Handler = (req, res, next) => {
  const whitelist = ['http://127.0.0.1:7000', 'http://localhost:7000/']
  const origin = req.headers.origin
  if (typeof origin === 'string' && whitelist.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin)
  } else {
    res.header('Access-Control-Allow-Origin', '*')
  }
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, authorization')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTION') {
    res.status(200).send()
  }

  next()
}

async function main() {
  try {
    let pgClient = new Client({
      database: process.env.POSTGRES_DB,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT!, 10)
    })
    
    await pgClient.connect()

    pgClient.on('error', (err: any) => {
      if(err.code && err.code.startsWith('5')) {
        try_reconnect();
      }
    })

    function try_reconnect(){
      setTimeout( function(){
        console.log( 'reconnecting...' );
        pgClient = new Client({
          database: process.env.POSTGRES_DB,
          user: process.env.POSTGRES_USER,
          password: process.env.POSTGRES_PASSWORD,
          host: process.env.POSTGRES_HOST,
          port: parseInt(process.env.POSTGRES_PORT!, 10)
        })

        pgClient.on('error', (err: any) => {
          if(err.code && err.code.startsWith('5')) {
            try_reconnect();
          }
        })
      },CONNECTION_RETRY_INTERVAL);
    }

    const app = express()

    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: true }))
    app.use(cookieParser())
    app.use(logger('dev'))
    app.use(CORSMiddleware)

    app.post('/graphql', async (req, res) => {
      const { query, variables } = req.body as { query: string; variables?: string }
      const response = await pgClient.query({
        text: 'select gql.resolve($1, $2)',
        values: [query, variables]
      })
      const result = response.rows[0]['resolve']
      res.json(result)
    })

    app.get('/schema.graphql', async (req, res) => {

      const { rows } = await pgClient.query('select gql.resolve($1)', [getIntrospectionQuery()])
      const { resolve } = rows[0] as { resolve: { data: IntrospectionQuery } }
      const schema = buildClientSchema(resolve.data)

      res.setHeader('content-Type', 'application/octet-stream')
      res.setHeader('cache-control', 'public, max-age=604800')
      res.send(printSchema(schema))
    })

    const port = process.env.SERVER_PORT || 3010
    app.listen(port, () => {
      console.log(`Express started on port ${port}!`)
    })
    

  } catch (e) {
    console.log(e)
  }
}

main()
