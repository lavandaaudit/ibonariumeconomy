
// App Initialization & Logic

function getTradingSession() {
    // Simple UTC based session logic
    // ASIA: 00:00 - 09:00 UTC
    // EU: 07:00 - 16:00 UTC
    // US: 13:00 - 22:00 UTC
    const hour = new Date().getUTCHours();

    if (hour >= 23 || hour < 8) return "ASIA (TOKYO)";
    if (hour >= 8 && hour < 13) return "EUROPE (LONDON)";
    if (hour >= 13 && hour < 22) return "USA (NY)";
    return "GLOBAL / CLOSE";
}

// Clock & Session
function startClock() {
    const el = document.getElementById('clock');
    const sessionEl = document.getElementById('session-indicator');

    setInterval(() => {
        const now = new Date();
        el.innerText = now.toISOString().split('T')[1].split('.')[0] + " UTC";

        if (sessionEl) {
            sessionEl.innerText = getTradingSession();
        }
    }, 1000);
}

// Logic Engine
const Logic = {
    getRegionalAnalysis() {
        // Return status of zones based on current UTC time
        const hour = new Date().getUTCHours();

        const regions = [
            { name: "USA", status: (hour >= 13 && hour < 22) ? 'OPEN' : 'CLOSED', trend: 'UP', description: 'PRE-MARKET POSITIVE' },
            { name: "EUROPE", status: (hour >= 8 && hour < 16) ? 'OPEN' : 'CLOSED', trend: 'DOWN', description: 'MIXED / DAX WEAK' },
            { name: "ASIA", status: (hour >= 0 && hour < 9) ? 'OPEN' : 'CLOSED', trend: 'NEUTRAL', description: 'CONSOLIDATION' }
        ];

        // Simulate some dynamic change if needed based on "simulated" data
        return regions;
    },

    analyze(crypto, fiat, metals) {
        if (!crypto || !metals) return null;

        // 1. Calculate Crypto Trends
        let totalChange = 0;
        let count = 0;
        for (const key in crypto) {
            totalChange += crypto[key].usd_24h_change;
            count++;
        }
        const avgChange = (totalChange / count);

        // 2. Risk Core Logic
        // If crypto dumps > 2% avg, risk is HIGH. If Pumps > 2%, Risk ON.
        let riskLevel = 'СЕРЕДНІЙ';
        let volatility = 'НОРМА';
        let sentiment = 'НЕЙТРАЛЬНО';

        if (avgChange < -1.5) { riskLevel = 'ВИСОКИЙ'; sentiment = 'СТРАХ'; }
        else if (avgChange > 1.5) { riskLevel = 'НИЗЬКИЙ'; sentiment = 'ЖАДІБНІСТЬ'; }

        if (Math.abs(avgChange) > 3) volatility = 'ВИСОКА';

        // 3. Crypto State Phase
        let phase = 'НАКОПИЧЕННЯ'; // Default
        if (avgChange > 2) phase = 'ЗРОСТАННЯ';
        else if (avgChange < -2) phase = 'КАПІТУЛЯЦІЯ';
        else if (avgChange > 0.5) phase = 'ВІДНОВЛЕННЯ';

        // 4. Inflation / Materials
        // Gold > 2050 implies higher inflation fear
        const goldPrice = metals.gold;
        let inflationRisk = goldPrice > 2050 ? 'ВИСОКА' : 'НИЗЬКА';
        let goldTrend = goldPrice > 2040 ? 'ТРЕНД ВГОРУ' : 'НЕЙТРАЛЬНО';

        // 5. Liquidity (Simulated logic using Dollar proxy)
        // If USD/EUR is high (Euro weak), liquidity might be tightening.
        // For simplicity, we assume if Markets (Crypto) are Green, Liquidity is expanding.
        let liquidityStatus = avgChange > 0 ? 'РОЗШИРЕННЯ' : 'ЗВУЖЕННЯ';
        let flow = avgChange > 0 ? 'ПРИПЛИВ' : 'ВІДТІК';

        // 6. Ibonarium Global Index (IGI) Calculation
        // Base 50. Crypto Trend impacts +/- 20. Gold Stability +/- 10. Risk removes points.
        let igiScore = 50;
        igiScore += (avgChange * 2); // +/- depending on market direction
        if (goldTrend === 'ТРЕНД ВГОРУ') igiScore += 5;
        if (riskLevel === 'ВИСОКИЙ') igiScore -= 15;
        if (riskLevel === 'НИЗЬКИЙ') igiScore += 10;

        // Clamp 0-100
        igiScore = Math.max(0, Math.min(100, igiScore));

        // 7. Anomaly Detection
        // Find specific coins deviating significantly from the average
        let anomalies = [];
        for (const key in crypto) {
            const coinChange = crypto[key].usd_24h_change;
            const deviation = Math.abs(coinChange - avgChange);
            if (deviation > 3.0) { // Deviation > 3% from avg is an anomaly
                anomalies.push({
                    asset: key.toUpperCase(),
                    type: coinChange > avgChange ? 'PUMP' : 'DUMP',
                    value: Math.abs(coinChange).toFixed(1) + '%'
                });
            }
        }
        if (anomalies.length === 0) anomalies.push({ asset: 'NONE', type: 'NORMAL', value: '' });

        // 8. Expectations Summary
        let summary = "РИНОК СТАБІЛЬНИЙ. ОЧІКУВАННЯ ПОДІЙ.";
        if (phase === 'КАПІТУЛЯЦІЯ') summary = "ВИЯВЛЕНО ВИСОКУ ВОЛАТИЛЬНІСТЬ. АКТИВИ ПІД ТИСКОМ. РЕКОМЕНДОВАНО ЗАХИСТ КАПІТАЛУ.";
        else if (phase === 'ЗРОСТАННЯ') summary = "ПОЗИТИВНИЙ ІМПУЛЬС. ФІКСУЄТЬСЯ ПРИПЛИВ ЛІКВІДНОСТІ У РИЗИКОВІ АКТИВИ.";
        else if (phase === 'ВІДНОВЛЕННЯ') summary = "ЛОКАЛЬНИЙ ВІДСКІК. СПОСТЕРІГАЙТЕ ЗА РІВНЯМИ ОПОРУ.";
        else summary = "НИЗЬКА ВОЛАТИЛЬНІСТЬ. ФАЗА КОНСОЛІДАЦІЇ. МОНІТОРИНГ КЛЮЧОВИХ РІВНІВ.";

        return {
            risk: { riskLevel, volatility, sentiment },
            liquidity: { usdStrength: 'СТАБІЛЬНА', status: liquidityStatus, flow },
            materials: { goldTrend, inflationRisk },
            cryptoState: { phase, avgChange: avgChange.toFixed(2) },
            expectations: { summary },
            igi: Math.round(igiScore),
            anomalies: anomalies,
            regions: this.getRegionalAnalysis()
        };
    }
};

// TradingView Widget
function initTradingView() {
    new TradingView.widget({
        "autosize": true,
        "symbol": "BINANCE:BTCUSDT",
        "interval": "D",
        "timezone": "Etc/UTC",
        "theme": "dark",
        "style": "1",
        "locale": "uk",
        "toolbar_bg": "#f1f3f6",
        "enable_publishing": false,
        "allow_symbol_change": true,
        "container_id": "tradingview_b82a7",
        "details": true,
        "hotlist": true,
        "calendar": true
    });
}

// Data Loop
async function refreshData() {
    // Parallel fetch for all real-time sources
    const [
        cryptoData,
        fiatData,
        metalsData,
        sentimentData,
        tvlData,
        gasData,
        newsData
    ] = await Promise.all([
        API.getCrypto(),
        API.getFiat(),
        API.getMetals(),
        API.getSentiment(),
        API.getTVL(),
        API.getGas(),
        API.getNews()
    ]);

    // Render Basic & Specialized Widgets
    // We call these always so they can handle null/error states internally
    Components.renderCryptoTicker(cryptoData);
    Components.renderFiat(fiatData);
    Components.renderMetals(metalsData);
    Components.renderSentiment(sentimentData);

    // Analyze & Render Advanced (IGI, Risk, etc)
    const analysis = Logic.analyze(cryptoData, fiatData, metalsData);

    // Even if analysis is null, we call these to reset UI if needed
    Components.renderIGI(analysis ? analysis.igi : null);
    Components.renderAnomalies(analysis ? analysis.anomalies : []);
    Components.renderRegions(analysis ? analysis.regions : []);
    Components.renderRiskCore(analysis ? analysis.risk : null);
    Components.renderLiquidity(analysis ? analysis.liquidity : null);
    Components.renderMaterials(analysis ? analysis.materials : null);
    Components.renderCryptoState(analysis ? analysis.cryptoState : null);
    Components.renderExpectations(analysis ? analysis.expectations : null);
}

// Start
document.addEventListener('DOMContentLoaded', () => {
    startClock();
    initTradingView();
    refreshData();
    setInterval(refreshData, 30000); // 30s main loop
});
