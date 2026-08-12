const menuBtn=document.getElementById("menuBtn");
const nav=document.getElementById("nav");
menuBtn.addEventListener("click",()=>nav.classList.toggle("open"));
document.querySelectorAll("nav a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));

const observer=new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{if(entry.isIntersecting) entry.target.classList.add("visible")});
},{threshold:.12});
document.querySelectorAll(".reveal").forEach(el=>observer.observe(el));

const topBtn=document.getElementById("topBtn");
window.addEventListener("scroll",()=>topBtn.classList.toggle("show",window.scrollY>600));
topBtn.addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"}));

document.getElementById("year").textContent=new Date().getFullYear();
