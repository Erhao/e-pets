const test = require('node:test');
const assert = require('node:assert/strict');
const { createMessageServer } = require('../src/message-server');
test('message lifecycle over HTTP', async (t) => {
  const items=[]; const store={list:()=>items.filter(x=>!x.acknowledgedAt),add:b=>{const x={...b,id:'1',createdAt:new Date().toISOString(),acknowledgedAt:null};items.push(x);return x},acknowledge:id=>{const x=items.find(i=>i.id===id);if(x)x.acknowledgedAt=new Date().toISOString();return x}};
  const server=createMessageServer({store,config:{apiKey:''},onChange:()=>{}}); await new Promise(r=>server.listen(0,'127.0.0.1',r)); t.after(()=>server.close());
  const base=`http://127.0.0.1:${server.address().port}`;
  let response=await fetch(`${base}/api/messages`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({text:'喝水时间到'})}); assert.equal(response.status,201);
  response=await fetch(`${base}/api/messages`); assert.equal((await response.json()).messages.length,1);
  response=await fetch(`${base}/api/messages/1/ack`,{method:'POST'}); assert.equal(response.status,200); assert.equal(store.list().length,0);
});
