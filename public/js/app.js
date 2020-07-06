var socket = io();
var app = new Vue({
    el: '#app',
    data: {
        chats: [],
        username: Math.random().toString(36).substring(2, 8),
        message: "",
    },
    async created() {
        const chatsResp = await fetch('/chats');
        this.chats = await chatsResp.json();
        socket.on('chat message', msg => {
            this.chats.push(msg)
        });
    },
    beforeDestroy() {
        socket.off('chat message');
    },
    methods: {
        sendMessage() {
            socket.emit('chat message', { msg: this.message, user: this.username });
            this.message = "";
        }
    }
});
