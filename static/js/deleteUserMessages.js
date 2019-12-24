document.addEventListener('DOMContentLoaded',function  () {
  
    if( ! localStorage.getItem("email")){
        
    window.location.replace("/");
 }
 const del=document.querySelector("#del");
 const banner=document.querySelector("h1");
 del.addEventListener("click",async function(event){
     event.preventDefault();
     const mail=document.querySelector("#mail").value;
     const password=document.querySelector("#password").value;
     if (mail !== localStorage.getItem("email") || password.length<6){
         alert("something wrong with the email or the password");
         return false;
     }
     const data=new FormData();
     data.append("mail",mail);
     data.append("password",password);
     let res=await fetch("/confirm_messages_delete",{body:data,method:"POST"});
     res=await res.json();
     if(! res.done){
          banner.innerHTML=data.not_valid;
          return;
     }
     else{
         banner.innerHTML="all the messages are deleted";
     }

 });
})