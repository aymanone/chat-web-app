//import { request } from "https";

document.addEventListener('DOMContentLoaded',function  () {
  
    if( ! localStorage.getItem("email")){
        
    window.location.replace("/");
 }
 else{
        localStorage.setItem("path",window.location.pathname);  
 }
 // Connect to websocket
 let channel=window.location.pathname.split("/").pop();
 const socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port+'/channels/channel');
 socket.on("connect",function(){
     console.log("connect done");
 });
 let last=document.querySelector("#msgs-container>div:last-child");
 if(last !==null){last.scrollIntoView();}
 const msgForm=document.querySelector("#msg-form");
 const msgSender=document.querySelector("#msg-sender");
 const msgText=document.querySelector("#msg-text");
 const msgsArea=document.querySelector("#msgs-container");
 const fileForm=document.querySelector("#file-form");
 const fileName=document.querySelector("#file-name");
 const fileSubmit=document.querySelector("#file-submit");
 const errorArea=document.querySelector("#error-area");
 const maxSizeOfFile=2097152;
 function safe_msgs(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') ;
}
 msgForm.onsubmit=function(event){
       
       event.preventDefault();
      // event.stopImmediatePropagation();
       let msg=msgText.value;
       if (msg.length===0){alert('you must type something');}
       let senderMail=localStorage.getItem("email");
       let data={"msg":msg,"senderMail":senderMail,"channel":channel};
       socket.emit("add_msg",data);
       msgText.value="";
       return false;
 };
 socket.on(`${channel} new_msg`,function(data){
     data.message=(data.isMarkUp)?data.message:safe_msgs(data.message);
    const div = document.createElement('div');
    div.classList.add("msg-area");
    div.innerHTML= `<p><h1>${data.sender}</h1></p>
     <p>${data.message}</p>
    `;
    console.log("msgDone");
    msgsArea.append(div);
    if(data.mail ===localStorage.getItem("email")){
        
        let last=document.querySelector("#msgs-container>div:last-child");
        
        last.scrollIntoView();
    }
 });
 fileForm.onsubmit=function(event){
     event.preventDefault();
     let data=new FormData(fileForm);
     let file=data.get("file");
     if( file && file.size && file.size>maxSizeOfFile){
        errorArea.innerHTML="the file size is too big";
        errorArea.classList="fail";
        return ;
     }
     data.append("email",localStorage.getItem("email"));
     data.append("channel",channel);
     const req=new XMLHttpRequest();
     req.open("POST","/uploader");
     req.onload=function(data){
         if( data.done && ! data.done){
             errorArea.innerHTML=data.not_valid;
             errorArea.classList="fail";
             return;
         }
         else{
             errorArea.innerHTML="file uploaded";
             errorArea.classList="success";
             return;
         }

     }
     req.send(data);
     return false;
 }
 socket.on(`${channel} new_file`,function(data){
     alert("hello");
 });

 
 
 });