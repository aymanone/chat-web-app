document.querySelector("#logout").addEventListener("click", (event)=>{
    event.preventDefault();
    localStorage.clear();
    window.location.replace("/");
  
    
});