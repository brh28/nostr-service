const {
  relayInit,
  validateEvent,
  verifySignature,
  signEvent,
  getEventHash,
  getPublicKey
} = require('nostr-tools');
require('websocket-polyfill');

class NostrService {
	constructor({ nostrPrivKey }) {
		this.privKey = nostrPrivKey
		this.pubKey = getPublicKey(nostrPrivKey);
		this.relays = [];
	}

	async connect(relayUrls) {
		const relays = relayUrls.map(url => new Promise(async (resolve, reject) => {
			try {
				const relay = relayInit(url)
				await relay.connect()

				relay.on('connect', async () => {
				  	resolve(relay);
				})
				relay.on('error', () => {
					reject(`failed to connect to ${relay.url}`); 
				})
			} catch (err) {
				reject(`failed to connect to ${url}`);
			}
		}))

		return Promise.allSettled(relays)
			.then(relays => {
				return relays.filter(r => r.status === 'fulfilled').map(r => r.value)
			})
			.then((connectedRelays) => {
				this.relays = connectedRelays;
			})
			.catch((err) => {
				throw new Error('relays failed to connect')
			});
	}

	publicKey() {
		return this.pubKey;
	}

	connectedRelays() {
		return this.relays.map(r => r.url);
	}

	async publishEvent(event) {
		// assert kind
		// assert content
		event.tags = event.tags || []
		event.pubkey = this.pubKey
		event.created_at = Math.floor(Date.now() / 1000)
		event.id = getEventHash(event)
		event.sig = signEvent(event, this.privKey)

		// TODO
		const ok = validateEvent(event)
		const veryOk = verifySignature(event)
		
		const responses = this.relays.map(relay => {
			return new Promise(async (resolve, reject) => {
				const pub = relay.publish(event)
				// pub.on('ok', () => {
				//   	console.log(`${relay.url} has accepted our event`)
				// })
				pub.on('seen', () => {
				  	resolve({ status: 'seen', id: event.id, url: relay.url})
				})
				pub.on('failed', reason => {
				  	reject({ status: 'failed', id: event.id, url: relay.url, reason: reason});
				})
			});
		});

		return Promise.any(responses)
	}
}

module.exports = NostrService;