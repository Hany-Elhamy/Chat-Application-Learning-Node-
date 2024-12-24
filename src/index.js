const express=require("express")
const path=require("path")
const http=require("http")
const socketio=require("socket.io")
const Filter=require("bad-words")
const {generateMessage,generateLocationMessage}=require("./utils/messages")
const { addUser, removeUser,getUser,getUsersInRoom } = require("./utils/users")

const app=express()
const server=http.createServer(app)
const io=socketio(server)
const port=process.env.Port || 3000

const publicDirectoryPath=path.join(__dirname,"../public")
app.use(express.static(publicDirectoryPath))


io.on("connection",(socket)=>{
    console.log("new WebSocket connection")
    socket.on("join",(options,callback)=>{
    const {error,user}=addUser({id:socket.id,...options})
    if(error){
        return callback(error)
    }
    socket.join(user.room)
    socket.timeout(5000).emit("message",generateMessage("Admin","Welcome!"))
    socket.broadcast.to(user.room).timeout(5000).emit("message", generateMessage("Admin",`${user.username} has joined!`))
    io.to(user.room).timeout(5000).emit("roomData",{
        room:user.room,
        users:getUsersInRoom(user.room)})
    callback()
    })


    socket.on("user message",(message,callback)=>{
        const user=getUser(socket.id)
        const filter=new Filter()
        if(filter.isProfane(message)){
            return callback("Profanity is not allowed")
        }
        io.to(user.room).timeout(5000).emit("message",generateMessage(user.username,message))
        callback()
    })


    socket.on("disconnect",()=>{
        const user=removeUser(socket.id)
        if(user){
        io.to(user.room).timeout(5000).emit("message",generateMessage("Admin",`${user.username} has left!`))
        io.to(user.room).timeout(5000).emit("roomData",{
            room:user.room,
            users:getUsersInRoom(user.room)
        })
        }
    })


    socket.on("location",(coords,callback)=>{
        const user=getUser(socket.id)
        io.to(user.room).timeout(5000).emit("locationMessage",generateLocationMessage(user.username,`https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })
})

server.listen(port,()=>{
    console.log("Server is up and running on ",port)  
})