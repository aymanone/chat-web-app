document.addEventListener('DOMContentLoaded',function(){
	if(localStorage.getItem("email")){
		let path=localStorage.getItem("path");
		if(path !== null){
			if(localStorage.getItem("error")!==null){
				localStorage.removeItem("error");
				localStorage.setItem("path","/channels");
				window.location.replace("/channels");
				return;
			}
			window.location.replace(path);
			return;
		}
		
		window.location.replace("/channels");
		return;
	}
 
});
function flib(toSHow,toHide){

	let show=document.querySelector(toSHow);
	let hide=document.querySelector(toHide);
	hide.style.display="none";
	show.style.display="block";
}
function signIn(event){
	event.preventDefault();
	const mail=document.querySelector("#signin-mail").value;
	const password=document.querySelector("#signin-password").value;
	
	if (mail.indexOf("@")==-1 || mail.indexOf(".")==-1 || password.length<6){
		document.querySelector("h2").innerHTML="unvalid mail  password";
		return false;
	}
    const request= new XMLHttpRequest();
	request.open("POST","/sign_in");
	request.onload=function(){
		const data=JSON.parse(request.responseText);
		if (data.done){
			localStorage.setItem("email",mail);
			localStorage.setItem("name",data.name);
			localStorage.setItem("path","/channels");
		   document.querySelector("h2").innerHTML="success";
			window.location.replace("/channels");
			return true;
		}
		document.querySelector("h2").innerHTML=data.not_valid;
   
		return false;

	}
	const data = new FormData();
        data.append('mail', mail);
		data.append("password",password);
        // Send request
        request.send(data);
        return false;
}
function add_user(event){
	event.preventDefault();
	const mail=document.querySelector("#mail").value;

	const name=document.querySelector("#name").value;
	const password=document.querySelector("#password").value;
   const reg=/[@_!#$%^&*()<>?/\|}{~:]/;
 
	if (mail.indexOf("@")==-1 || mail.indexOf(".")==-1 || name.length<2 || password.length<6){
		document.querySelector("h1").innerHTML="unvalid mail or name or password";
		return false;
	}
	if(name.match(reg)!==null){
		document.querySelector("h1").innerHTML="don't include special characters";
		return false;
	}

	const request= new XMLHttpRequest();
	request.open("POST","/add_user");
	request.onload=function(){
		
		const data=JSON.parse(request.responseText);
	
		if (data.done){
			localStorage.setItem("email",mail);
			localStorage.setItem("name",name);
			localStorage.setItem("path","/channels");
		   document.querySelector("h1").innerHTML="success";
			window.location.replace("/channels");
			return true;
		}
	    
		 document.querySelector("h1").innerHTML=data.not_valid;
   
		return false;


	}
	  const data = new FormData();
        data.append('mail', mail);
		data.append("name",name);
		data.append("password",password);

        // Send request
        request.send(data);
        
        return false;


}
