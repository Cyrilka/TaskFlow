export const saveToStorage=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
export const loadFromStorage=(k)=>{try{return JSON.parse(localStorage.getItem(k))}catch{return null}};