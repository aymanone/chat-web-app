document.addEventListener('DOMContentLoaded',function  () {
  
   if( ! localStorage.getItem("email")){

   window.location.replace("/");
}
else{
   localStorage.setItem("path","/channels");
}
// Connect to websocket
const socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port+'/channels');


// When connected, configure buttons
socket.on('connect', function () {

   

   document.querySelector("#create").onclick=function (){
       
       const new_channel=document.querySelector("#new_channel").value;
       const channels_list=document.querySelector("#channels");
       const list=channels_list.querySelectorAll("li");
       
       for (let i=0; i<list.length;i++){
           if(list[i].innerText==new_channel){
           
              document.querySelector("h1").innerHTML="this channel allready here";
               return false;
         }
       }
       socket.emit('add_channel', {'channel': new_channel});
       
       
       //
       

       return false;
   
}});

// When a new vote is announced, add to the unordered list
socket.on('new_one', function(data) {
   if(data.error!==undefined){
      
      document.querySelector("h1").innerHTML="this channel allready here";
      return false;
   }
   
   const li = document.createElement('li');
   li.innerHTML = ` <a href="/channels/${data.channel}">${data.channel}</a>`;
   document.querySelector('#channels').append(li);
   document.querySelector("h1").innerHTML="new channel";
   
});

});