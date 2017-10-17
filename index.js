if (process.env.TRACE) {
    require('./libs/trace');
}

const Koa = require('koa');
const sqlite3 = require('co-sqlite3');
const app = new Koa();

const config = require('config');

// keys for in-koa KeyGrip cookie signing (used in session, maybe other modules)
app.keys = [config.secret];

const path = require('path');

const fs = require('fs');

const handlers = fs.readdirSync(path.join(__dirname, 'handlers')).sort();

handlers.forEach(handler => require('./handlers/' + handler).init(app));

// ---------------------------------------

const Router = require('koa-router');

const router = new Router();
let db;
sqlite3('ChatDB.db').then(function (dbb) {
    db = dbb;
    db.run("CREATE TABLE IF NOT EXISTS chatUser (id INTEGER PRIMARY KEY AUTOINCREMENT, user VARCHAR(50),message VARCHAR(50))");
});

let clients = [];
router.get('/subscribe/oldMessages', async(ctx, next) => {
    ctx.set('Cache-Control', 'no-cache,must-revalidate');
    let rows = await db.all('SELECT * FROM chatUser');
    let messages = rows.map((el)=> {delete el.id; return el});
    console.log('messages' + messages);
    ctx.body = messages;
});
router.get('/subscribe', async(ctx, next) => {
    ctx.set('Cache-Control', 'no-cache,must-revalidate');

    const promise = new Promise((resolve, reject) => {
        clients.push(resolve);

        ctx.res.on('close', function () {
            clients.splice(clients.indexOf(resolve), 1);
            const error = new Error('Connection closed');
            error.code = 'ECONNRESET';
            reject(error);
        });

    });

    let message;

    try {
        message = await promise;
    } catch (err) {
        if (err.code === 'ECONNRESET') return;
        throw err;
    }
    ctx.body = message;

});

router.post('/publish', async(ctx, next) => {
    const user = ctx.request.body.user;
    const message = ctx.request.body.message;
    console.log('message:' + message);
    if (!message) {
        ctx.throw(400);
    }
    let stmt = await db.prepare('INSERT INTO chatUser (user, message) VALUES( ?, ?)');
    let x = await stmt.run(user, message);
    console.log('x  ' + x.id);
    await stmt.finalize();


    clients.forEach(function (resolve) {
        resolve([{user, message}]);
    });

    clients = [];
    ctx.body = 'ok';

});

app.use(router.routes());

app.listen(config.get('port'));
