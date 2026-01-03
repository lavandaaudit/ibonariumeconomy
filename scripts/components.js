
// Rendering Components -- Updated with Analytics (Ukrainian) + IGI

const Components = {
    // Helper for badges
    createBadge(text, color, glow = false) {
        const style = `
            display: inline-block;
            padding: 2px 8px;
            border: 1px solid ${color};
            color: ${color};
            font-size: 0.9em;
            text-transform: uppercase;
            ${glow ? `box-shadow: 0 0 5px ${color};` : ''}
        `;
        return `<span style="${style}">${text}</span>`;
    },

    createRow(label, valueHtml) {
        return `<div style="display:flex; justify-content:space-between; align-items: center; margin-bottom:5px; width: 100%;">
            <span style="opacity:0.8; white-space: nowrap; margin-right: 10px;">${label}</span>
            <span style="text-align: right; flex-grow: 1;">${valueHtml}</span>
        </div>`;
    },

    renderIGI(score) {
        const valEl = document.getElementById('igi-value');
        const barEl = document.getElementById('igi-bar');
        if (!valEl || !barEl) return;

        if (score === null || score === undefined || isNaN(score)) {
            valEl.innerText = '--';
            valEl.style.color = '#555';
            barEl.style.width = '0%';
            return;
        }

        valEl.innerText = score.toString();
        barEl.style.width = score + '%';

        let color = 'var(--primary-accent)';
        if (score < 40) color = 'var(--status-err)';
        if (score > 60) color = 'var(--status-ok)';

        valEl.style.color = color;
        barEl.style.backgroundColor = color;
    },

    renderAnomalies(list) {
        const container = document.getElementById('anomaly-widget');
        if (!container) return;
        if (!list || list.length === 0) {
            container.innerHTML = '<span style="opacity:0.3">ОЧІКУВАННЯ ДАНИХ...</span>';
            return;
        }

        if (list[0].asset === 'NONE') {
            container.innerHTML = '<span style="opacity:0.5; font-size:0.9em">АНОМАЛІЙ НЕ ВИЯВЛЕНО (NORMAL)</span>';
            return;
        }

        let html = '';
        list.forEach(item => {
            const color = item.type === 'PUMP' ? 'var(--status-ok)' : 'var(--status-err)';
            html += `
            <div style="border-left:2px solid ${color}; padding-left:8px; margin-bottom:4px;">
                <div style="font-weight:bold; color:#fff">${item.asset}</div>
                <div style="font-size:0.8em; color:${color}">${item.type} (${item.value})</div>
            </div>`;
        });
        container.innerHTML = html;
    },

    renderRiskCore(state) {
        const container = document.getElementById('risk-widget');
        if (!container) return;
        if (!state) {
            container.innerHTML = '<div style="text-align:center; opacity:0.3">ПОМИЛКА АНАЛІЗУ</div>';
            return;
        }

        let levelHtml = '';
        if (state.riskLevel === 'ВИСОКИЙ') {
            levelHtml = this.createBadge('КРИТИЧНА ЗАГРОЗА / RISK OFF', 'var(--status-err)', true);
        } else if (state.riskLevel === 'СЕРЕДНІЙ') {
            levelHtml = this.createBadge('НЕЙТРАЛЬНО', 'orange');
        } else {
            levelHtml = this.createBadge('БЕЗПЕЧНО / RISK ON', 'var(--status-ok)', true);
        }

        container.innerHTML = `
            <div style="text-align:center; margin-bottom:10px;">${levelHtml}</div>
            ${this.createRow('ВОЛАТИЛЬНІСТЬ', `<span class="${state.volatility === 'ВИСОКА' ? 'blink' : ''}">${state.volatility}</span>`)}
            ${this.createRow('НАСТРІЙ', state.sentiment)}
        `;
    },

    renderLiquidity(state) {
        const container = document.getElementById('liquidity-widget');
        if (!container) return;
        if (!state) {
            container.innerHTML = '<div style="opacity:0.3">ОБЧИСЛЕННЯ...</div>';
            return;
        }

        container.innerHTML = `
            ${this.createRow('СИЛА ДОЛАРА', state.usdStrength)}
            ${this.createRow('ПОТІК', state.flow === 'ПРИПЛИВ' ? '<span style="color:var(--status-ok)">ПРИПЛИВ</span>' : '<span style="color:var(--status-err)">ВІДТІК</span>')}
            ${this.createRow('СТАТУС', state.status)}
        `;
    },

    renderMaterials(state) {
        const container = document.getElementById('materials-widget');
        if (!container) return;
        if (!state) {
            container.innerHTML = '<div style="opacity:0.3">НЕМАЄ ДАНИХ</div>';
            return;
        }

        container.innerHTML = `
            ${this.createRow('ЗОЛОТО ТРЕНД', state.goldTrend)}
            ${this.createRow('ІНФЛЯЦІЯ', state.inflationRisk === 'ВИСОКА' ? '<span style="color:var(--status-err)">ПІДВИЩЕНА</span>' : 'СТАБІЛЬНА')}
        `;
    },

    renderCryptoState(state) {
        const container = document.getElementById('crypto-state-widget');
        if (!container) return;
        if (!state) {
            container.innerHTML = '<div style="text-align:center; border:1px solid #222; padding:10px; opacity:0.3">OFFLINE</div>';
            return;
        }

        let phaseColor = '#fff';
        if (state.phase === 'ЗРОСТАННЯ') phaseColor = 'var(--status-ok)';
        if (state.phase === 'КАПІТУЛЯЦІЯ') phaseColor = 'var(--status-err)';

        container.innerHTML = `
            <div style="text-align:center; padding:10px; border:1px solid ${phaseColor}; margin-bottom:5px;">
                <span style="color:${phaseColor}; font-weight:bold; font-size:1.1em; letter-spacing:1px;">${state.phase}</span>
            </div>
            ${this.createRow('ЗМІНА 24Г', `<span>${state.avgChange}%</span>`)}
         `;
    },

    renderExpectations(state) {
        const container = document.getElementById('expectations-widget');
        if (!container) return;
        if (!state) {
            container.innerHTML = '<div style="opacity:0.3">АНАЛІЗ ПРИЗУПИНЕНО</div>';
            return;
        }
        container.innerHTML = `
            <div style="font-size:0.9em; line-height:1.4; opacity:0.8;">
                ${state.summary}
            </div>
        `;
    },

    renderFiat(data) {
        const container = document.getElementById('fiat-widget');
        if (!container) return;
        if (!data || !data.rates) {
            container.innerHTML = '<span style="color:var(--status-err); font-size:0.8em;">CORS / RATE LIMIT ERROR</span>';
            return;
        }

        const usdToUah = data.rates.UAH ? data.rates.UAH.toFixed(2) : "--";
        const eurToUah = (data.rates.UAH && data.rates.EUR) ? (data.rates.UAH / data.rates.EUR).toFixed(2) : "--";
        const gbpToUah = (data.rates.UAH && data.rates.GBP) ? (data.rates.UAH / data.rates.GBP).toFixed(2) : "--";

        container.innerHTML = `
            ${this.createRow('USD/UAH', `<span class="neon-text">${usdToUah}</span>`)}
            ${this.createRow('EUR/UAH', `<span class="neon-text">${eurToUah}</span>`)}
            ${this.createRow('GBP/UAH', `<span class="neon-text">${gbpToUah}</span>`)}
        `;
    },

    renderMetals(data) {
        const container = document.getElementById('metals-widget');
        if (!container) return;
        if (!data) {
            container.innerHTML = '<span style="color:var(--status-err); font-size:0.8em;">PROXY ERROR (429)</span>';
            return;
        }

        const goldColor = (data.gold_change || 0) >= 0 ? 'var(--status-ok)' : 'var(--status-err)';
        const silverColor = (data.silver_change || 0) >= 0 ? 'var(--status-ok)' : 'var(--status-err)';
        const platColor = (data.platinum_change || 0) >= 0 ? 'var(--status-ok)' : 'var(--status-err)';
        const pallColor = (data.palladium_change || 0) >= 0 ? 'var(--status-ok)' : 'var(--status-err)';

        container.innerHTML = `
            ${this.createRow('ЗОЛОТО', `<span style="color:gold">$${data.gold.toLocaleString()}</span> <span style="font-size:0.7em;color:${goldColor}">(${(data.gold_change || 0).toFixed(2)}%)</span>`)}
            ${this.createRow('СРІБЛО', `<span style="color:silver">$${data.silver.toFixed(2)}</span> <span style="font-size:0.7em;color:${silverColor}">(${(data.silver_change || 0).toFixed(2)}%)</span>`)}
            ${this.createRow('ПЛАТИНА', `<span style="color:#e5e4e2">$${data.platinum.toFixed(2)}</span> <span style="font-size:0.7em;color:${platColor}">(${(data.platinum_change || 0).toFixed(2)}%)</span>`)}
            ${this.createRow('ПАЛАДІЙ', `<span style="color:#ced4da">$${data.palladium.toFixed(2)}</span> <span style="font-size:0.7em;color:${pallColor}">(${(data.palladium_change || 0).toFixed(2)}%)</span>`)}
        `;
    },

    renderSentiment(data) {
        const valEl = document.getElementById('sentiment-value-header');
        const labelEl = document.getElementById('sentiment-label-header');
        if (!valEl || !labelEl) return;

        if (!data) {
            valEl.innerText = '--';
            labelEl.innerText = 'ERROR';
            return;
        }

        let color = 'var(--primary-accent)';
        if (data.value < 30) color = 'var(--status-err)';
        if (data.value > 70) color = 'var(--status-ok)';

        valEl.innerText = data.value;
        valEl.style.color = color;
        labelEl.innerText = data.value_classification;
        labelEl.style.color = color;
    },

    renderTVL(tvl) {
        const container = document.getElementById('tvl-widget');
        if (!container) return;
        if (!tvl) {
            container.innerHTML = '<span style="opacity:0.3">ERR: DEFILLAMA</span>';
            return;
        }
        const bValue = (tvl / 1000000000).toFixed(2);
        container.innerHTML = `
            <div style="font-size:1.1em; color:var(--primary-accent); text-align:center;">$${bValue}B</div>
            <div style="font-size:0.7em; text-align:center; opacity:0.6;">AGGR. LIQUIDITY LOCKED</div>
        `;
    },

    renderGas(gas) {
        const container = document.getElementById('gas-widget');
        if (!container) return;
        if (gas === null || gas === undefined) {
            container.innerHTML = '<span style="opacity:0.3">RPC OFFLINE</span>';
            return;
        }
        let color = 'var(--status-ok)';
        if (gas > 50) color = 'orange';
        if (gas > 100) color = 'var(--status-err)';

        container.innerHTML = `
            ${this.createRow('ETH GAS', `<span style="color:${color}">${gas} GWEI</span>`)}
            ${this.createRow('STATUS', gas < 30 ? 'LOW' : (gas < 70 ? 'NORMAL' : 'HIGH'))}
        `;
    },

    renderNews(news) {
        const container = document.getElementById('news-widget');
        if (!container) return;
        if (!news || news.length === 0) {
            container.innerHTML = '<span style="opacity:0.3">НОВИН НЕ ЗНАЙДЕНО</span>';
            return;
        }

        let html = '';
        news.forEach(item => {
            html += `<div style="margin-bottom:8px; border-bottom:1px solid #222; padding-bottom:4px;">
                <div style="color:var(--primary-accent); font-weight:bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.title}</div>
                <div style="font-size:0.7em; opacity:0.6;">${item.source} // ${new Date(item.published_on * 1000).toLocaleTimeString()}</div>
            </div>`;
        });
        container.innerHTML = html;
    },

    renderRegions(regions) {
        const container = document.getElementById('regions-widget');
        if (!container) return;
        if (!regions) return;

        let html = '';
        regions.forEach(r => {
            const statusColor = r.status === 'OPEN' ? 'var(--status-ok)' : '#555';
            html += `
            <div style="margin-bottom:5px;">
                <div style="display:flex; justify-content:space-between;">
                    <span>${r.name}</span>
                    <span style="color:${statusColor}">${r.status}</span>
                </div>
                <div style="font-size:0.7em; opacity:0.5;">${r.description}</div>
            </div>`;
        });
        container.innerHTML = html;
    },

    renderCryptoTicker(data) {
        const container = document.getElementById('crypto-ticker');
        if (!container) return;
        if (!data) {
            container.innerHTML = '<span class="ticker-item" style="color:var(--status-err)">[ ERROR ] ПОМИЛКА З’ЄДНАННЯ З КРИПТО-ШЛЮЗОМ. ПЕРЕВІРТЕ МЕРЕЖУ.</span>';
            return;
        }

        const mapping = { bitcoin: 'BTC', ethereum: 'ETH', solana: 'SOL', ripple: 'XRP', litecoin: 'LTC', dash: 'DASH' };
        let html = '';
        for (const [key, value] of Object.entries(data)) {
            const price = value.usd || 0;
            const change = (value.usd_24h_change || 0).toFixed(2);
            const color = change >= 0 ? 'var(--status-ok)' : 'var(--status-err)';
            const symbol = mapping[key] || key.toUpperCase();

            html += `<span class="ticker-item">
                <span style="color:#fff; font-weight:bold">${symbol}</span>: 
                <span class="neon-text">$${price}</span> 
                <span style="color:${color}; font-size:0.8em">(${change}%)</span>
            </span>`;
        }
        container.innerHTML = html + html + html;
    }
};
