const socket=io()


const $messageForm=document.querySelector("#message-form")
const $messageFormInput=document.querySelector("input")
const $messageFormbutton=document.querySelector("button")
const $locationButton=document.querySelector("#send-location")
const $messages=document.querySelector("#messages")


//Templates
const $messageTemplate=document.querySelector("#message-template").innerHTML
const $locationTemplate=document.querySelector("#location-template").innerHTML
const $sidebarTemplate=document.querySelector("#sidebar-template").innerHTML

//Options
const {username,room}=Qs.parse(location.search,{ignoreQueryPrefix:true})

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}



socket.on("message",(message)=>{
console.log(message)
const html=Mustache.render($messageTemplate,{
    username:message.username,
    message:message.text,
    createdAt: new Date(message.createdAt).toLocaleTimeString()

})
$messages.insertAdjacentHTML("beforeend",html)
autoscroll()
})


socket.on("locationMessage",(message)=>{
    console.log(message)
    const html=Mustache.render($locationTemplate,{
        username:message.username,
        url:message.url,
        createdAt:new Date(message.createdAt).toLocaleTimeString()
    })
    $messages.insertAdjacentHTML("beforeend",html)
    autoscroll()
})

socket.on("roomData",({room,users})=>{
    const html=Mustache.render($sidebarTemplate,{
        room,
        users
    })
    document.querySelector("#sidebar").innerHTML=html
})


$messageForm.addEventListener("submit",(e)=>{
    e.preventDefault()
    $messageFormbutton.setAttribute("disabled","disabled")

    socket.emit("user message",e.target.elements.message.value,(error)=>{
        $messageFormbutton.removeAttribute("disabled")
        $messageFormInput.value=""
        $messageFormInput.focus()
        if(error){
            return console.log(error)
        }
        
        console.log("Message is delivered!")
    })
})

$locationButton.addEventListener("click",()=>{
    if(!navigator.geolocation){
        return alert("Your browser doesn't support geolocation")
    }
    $locationButton.setAttribute("disabled","disabled")

    navigator.geolocation.getCurrentPosition((position)=>{
    socket.emit("location", {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
    },()=>{
        $locationButton.removeAttribute("disabled")
        console.log("Location shared!")
    })
})
})

socket.emit("join",{username,room},(error)=>{
    if(error){
    alert(error)
    location.href="/"  
    }
})

