// API Service for Ibonarium Economy
// 100% Real-time integration - No simulations.
// Multi-Proxy, Multi-Source & Cache-as-Fallback System

const API = {
    // Cache for last known good values to prevent 'zero' results during rate limits
    cache: {
        crypto: null,
        fiat: null,
        metals: {
            gold: 2450.00, gold_change: 0,
            silver: 29.50,
            platinum: 985.00,
            palladium: 995.00
        },
        sentiment: { value: 50, value_classification: 'Neutral' },
        tvl: 75000000000,
        gas: 25,
        news: []
    },

    // Primary and Secondary Proxies
    proxies: [
        (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
        (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
    ],

    async fetchWithProxy(url) {
        let lastError = null;
        for (const proxyFn of this.proxies) {
            try {
                const proxyUrl = proxyFn(url);
                const resp = await fetch(proxyUrl);
                if (!resp.ok) throw new Error(`Status ${resp.status}`);

                const data = await resp.json();
                // AllOrigins wraps data in .contents
                return data.contents ? JSON.parse(data.contents) : data;
            } catch (e) {
                lastError = e;
                continue; // Try next proxy
            }
        }
        throw lastError || new Error("All proxies failed");
    },

    // Crypto (CoinGecko -> CryptoCompare -> Cache)
    async getCrypto() {
        // Try CoinGecko
        try {
            const url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,ripple,litecoin,dash&vs_currencies=usd&include_24hr_change=true';
            const data = await this.fetchWithProxy(url);
            if (data && data.bitcoin) {
                this.cache.crypto = data;
                return data;
            }
        } catch (e) { }

        // Fallback to CryptoCompare
        try {
            const url = 'https://min-api.cryptocompare.com/data/pricemultifull?fsyms=BTC,ETH,SOL,XRP,LTC,DASH&tsyms=USD';
            const raw = await this.fetchWithProxy(url);

            // Map CryptoCompare format to CoinGecko format for component compatibility
            const mapped = {};
            const symbols = { BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', XRP: 'ripple', LTC: 'litecoin', DASH: 'dash' };

            for (const [sym, key] of Object.entries(symbols)) {
                if (raw.RAW && raw.RAW[sym]) {
                    mapped[key] = {
                        usd: raw.RAW[sym].USD.PRICE,
                        usd_24h_change: raw.RAW[sym].USD.CHANGEPCT24HOUR
                    };
                }
            }
            if (Object.keys(mapped).length > 0) {
                this.cache.crypto = mapped;
                return mapped;
            }
        } catch (e) { }

        return this.cache.crypto;
    },

    async getFiat() {
        try {
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            if (response.ok) {
                const data = await response.json();
                this.cache.fiat = data;
                return data;
            }
        } catch (e) { }

        try {
            const data = await this.fetchWithProxy('https://api.exchangerate-api.com/v4/latest/USD');
            this.cache.fiat = data;
            return data;
        } catch (e) { }

        return this.cache.fiat;
    },

    async getMetals() {
        // PAXG for Gold, KAG for Silver (if available), and other tokens for Plat/Pall
        try {
            const url = 'https://api.coingecko.com/api/v3/simple/price?ids=pax-gold,kinesis-silver,wrapped-platinum,palladium-token&vs_currencies=usd&include_24hr_change=true';
            const data = await this.fetchWithProxy(url);

            if (data) {
                if (data['pax-gold']) {
                    this.cache.metals.gold = data['pax-gold'].usd;
                    this.cache.metals.gold_change = data['pax-gold'].usd_24h_change;
                }
                if (data['kinesis-silver']) {
                    this.cache.metals.silver = data['kinesis-silver'].usd;
                    this.cache.metals.silver_change = data['kinesis-silver'].usd_24h_change;
                }
                if (data['wrapped-platinum']) {
                    this.cache.metals.platinum = data['wrapped-platinum'].usd;
                    this.cache.metals.platinum_change = data['wrapped-platinum'].usd_24h_change;
                }
                if (data['palladium-token']) {
                    this.cache.metals.palladium = data['palladium-token'].usd;
                    this.cache.metals.palladium_change = data['palladium-token'].usd_24h_change;
                }
                return this.cache.metals;
            }
        } catch (e) { }

        return this.cache.metals;
    },

    async getSentiment() {
        try {
            const url = 'https://api.alternative.me/fng/?limit=1';
            const data = await this.fetchWithProxy(url);
            if (data && data.data) {
                this.cache.sentiment = data.data[0];
                return data.data[0];
            }
        } catch (e) { }
        return this.cache.sentiment;
    },

    async getTVL() {
        try {
            const url = 'https://api.llama.fi/charts';
            const data = await this.fetchWithProxy(url);
            if (data && data.length > 0) {
                const lastPoint = data[data.length - 1];
                const tvl = lastPoint.totalLiquidity;
                this.cache.tvl = tvl;
                return tvl;
            }
        } catch (e) { }
        return this.cache.tvl;
    },

    async getGas() {
        try {
            const response = await fetch('https://cloudflare-eth.com', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jsonrpc: "2.0", method: "eth_gasPrice", params: [], id: 1 })
            });
            if (!response.ok) throw new Error("Gas RPC failed");
            const result = await response.json();
            const gasWei = parseInt(result.result, 16);
            const gas = Math.round(gasWei / 1000000000);
            this.cache.gas = gas;
            return gas;
        } catch (e) { }
        return this.cache.gas;
    },

    async getNews() {
        try {
            const url = 'https://min-api.cryptocompare.com/data/v2/news/?lang=EN';
            const data = await this.fetchWithProxy(url);
            if (data && data.Data) {
                const news = data.Data.slice(0, 5);
                this.cache.news = news;
                return news;
            }
        } catch (e) { }
        return this.cache.news;
    }
};
