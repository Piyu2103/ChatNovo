const socket = io();

const $messageForm = document.querySelector("#SendMessage");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $SendLocationButton=document.querySelector('#SendLocation');
const $messages=document.querySelector('#messages');

//Templates
const messageTemplate=document.querySelector('#message-template').innerHTML
const locationTemplate=document.querySelector('#location-template').innerHTML
const sidebarTemplate=document.querySelector('#sidebar-template').innerHTML
//options
const {username,room}=Qs.parse(location.search,{ignoreQueryPrefix:true});

const autoscroll=()=>{
    //New message element
    const $newMessage=$messages.lastElementChild
    
    //Height of the new message
    const newMessageStyles=getComputedStyle($newMessage)
    const newMessageMargin=parseInt(newMessageStyles.marginBottom)
    const newMessageHeight=$newMessage.offsetHeight + newMessageMargin
    
   //Visible Height
   const visibleHeight=$messages.offsetHeight

   //Heights of messages container
   const containerHeight=$messages.scrollHeight

   //How far have I scrolled
   const scrollOffset=$messages.scrollTop+visibleHeight

   if(containerHeight-newMessageHeight<=scrollOffset){
        $messages.scrollTop=$messages.scrollHeight
   }
}

socket.on("message", (message) => {
    console.log(message);
    const html=Mustache.render(messageTemplate,{
      username:message.username,
      message:message.text,
      createdAt:moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html);
    autoscroll()
});
socket.on("locationMessage",(URL) => {
  console.log(URL);
  const html=Mustache.render(locationTemplate,{
    username:URL.username,
    url:URL.url,
    createdAt:moment(URL.createdAt).format('h:mm a')
  })
  $messages.insertAdjacentHTML('beforeend',html);
  autoscroll()
})

socket.on('roomData',({room,users})=>{
  const html =Mustache.render(sidebarTemplate,{
    room,
    users
  })
  document.querySelector('#sidebar').innerHTML=html
})
$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();

  $messageFormButton.setAttribute("disabled", "disabled");

  const message = e.target.elements.message.value;

  socket.emit("sendmessage", message, (error) => {
    $messageFormButton.removeAttribute("disabled");
    $messageFormInput.value = "";
    $messageFormInput.focus();
    if (error) {
      return console.log(error);
    }
    console.log("The message was delivered");
  });
});

$SendLocationButton.addEventListener("click", () => {
  if (!navigator.geolocation)
    return alert("Geolocation is not supported by your browser");
  $SendLocationButton.setAttribute("disabled", "disabled");
  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      "sendlocation",
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      () => {
        console.log("Location Shared");
        $SendLocationButton.removeAttribute("disabled");
      }
    );
  });
});

socket.emit('join',{username,room},(error) => {
      if(error){
        alert(error);
        location.href='/'
      }
});