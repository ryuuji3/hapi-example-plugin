import hapi from 'hapi'
import { v4 as uuid } from 'uuid'

const server = new hapi.Server({
    port: 3000,
})

const ONE_WEEK_MS = 1000 * 60 * 60 * 24 * 7

await server.register({
    plugin: {
        name: 'session',
        register: async function (server) {
            server.state('session', {
                ttl: ONE_WEEK_MS,
                isSecure: true,
                isHttpOnly: true,
                encoding: 'base64json',
                clearInvalid: true,
                strictHeader: true,
            })
        
            server.ext('onPreResponse', (request, h) => {
                let session = request.state.session
        
                if (!session) {
                    session = { id: uuid() }
                }
        
                session.ttl = Date.now() + ONE_WEEK_MS // extend session
        
                h.state('session', session)

                return h.continue
            })
        }
    }
})

server.route({
    path: '/',
    method: 'GET',
    handler: (request, h) => {
        const session = request.state.session;

        return h.response({
            greeting: `Hello, ${request.query.name ?? stranger}!`,
            ...(session && {
                sessionID: session.id,
                ttl: session.ttl,
            })
        }).code(200)
    }
})

await server.start()