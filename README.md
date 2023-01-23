# nostr-service

NodeJS library for interacting with Nostr. 


Getting started

1) Inititialize the Service with your private key. 

```
const nostr = new NostrService({ nostrPrivKey: <your_priv_key> })
console.log(`Nostr PublicKey = ${nostr.publicKey()}`)
```

2) Connect to relays with comma sperated list of URLs 

```
nostr.connect(["wss://relay.damus.io", "wss://relay.nostr.info"])
  .then(() => console.log(`Connected Relays: ${JSON.stringify(nostr.connectedRelays())})`)
 ```
 Note, reference [registry](https://nostr-registry.netlify.app/) for info about active relays
 
 3) Publish event by defining `kind`, `content` and `tags`: 
 
 ```
 nostr.publishEvent({
  kind: 1,
  tags: [],
  content: `This is a basic text note`,
})
```
