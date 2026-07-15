const apiKey = "421d75ef-ddc9-441e-a2e1-9ac5bee5845d";
fetch("https://api.vapi.ai/call?limit=3", {
  headers: { "Authorization": "Bearer " + apiKey }
})
.then(res => res.json())
.then(data => console.log(JSON.stringify(data, null, 2)))
.catch(err => console.error(err));
