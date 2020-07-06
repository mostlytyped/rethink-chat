var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var rethink = require('rethinkdb');
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const rdbHost = process.env.RETHINKDB_HOST;
const rdbPort = process.env.RETHINKDB_PORT;
const rdbName = process.env.RETHINKDB_NAME;
const rdbUser = process.env.RETHINKDB_USERNAME;
const rdbPass = process.env.RETHINKDB_PASSWORD;

const listenPort = process.env.PORT || "3000";

rethink.connect({ host: rdbHost, port: rdbPort, username: rdbUser, password: rdbPass, db: rdbName }, function (err, conn) {
    if (err) throw err;

    app.get('/', (req, res) => {
        res.sendFile(__dirname + '/index.html');
    });

    app.get('/chats', (req, res) => {
        rethink.table('chats').orderBy('ts').run(conn, (err, cursor) => {
            if (err) throw err;
            cursor.toArray((err, result) => {
                if (err) throw err;
                res.json(result);
            })
        });
    })

    rethink.table('chats').changes().run(conn, (err, cursor) => {
        if (err) throw err;
        cursor.each((err, row) => {
            console.log(row.new_val);
            io.emit('chat message', row.new_val);
        });
    });

    io.on('connection', (socket) => {
        console.log('a user connected');

        socket.on('chat message', (msg) => {
            rethink.table('chats').insert({ msg: msg.msg, user: msg.user, ts: Date.now() }).run(conn, function (err, res) {
                if (err) throw err;
            });
        });

        socket.on('disconnect', () => {
            console.log('user disconnected');
        });
    });

    http.listen(listenPort, () => {
        console.log('listening on *:' + listenPort);
    });
});