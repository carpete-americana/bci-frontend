// ===========================
// STATE
// ===========================

let user = null;
let withdrawals = null;
let transactions = null;
let chartData = null;
let totalGains = null;

// ===========================
// INITIALIZATION
// ===========================

export async function init() {
    await loadAllData();
    updateUI();
    initChart();
}

// ===========================
// DATA LOADING
// ===========================

async function loadAllData() {
    try {
        await Promise.all([
            loadUserData(),
            loadWithdrawals(),
            loadTransactions(),
            loadChartData(),
            loadProfits()
        ]);
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

async function loadUserData() {
    try {
        const response = await API.getUserData();
        if (response.success) {
            user = response.result.data;
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

async function loadWithdrawals() {
    try {
        const response = await API.getUserWithdrawals();
        if (response.success) {
            withdrawals = response.result.data;
        }
    } catch (error) {
        console.error('Error loading withdrawals:', error);
    }
}

async function loadTransactions() {
    try {
        const response = await API.getUserTransactions();
        if (response.success) {
            transactions = response.result.data;
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

async function loadChartData() {
    try {
        const response = await API.getChartData();
        if (response.success) {
            chartData = response.result.data;
        }
    } catch (error) {
        console.error('Error loading chart data:', error);
    }
}

async function loadProfits() {
    try {
        const response = await API.getProfits();
        if (response.success) {
            const data = response.result.data;
            if (data.bonus_total || data.casino_total) {
                totalGains = data;
            }
        }
    } catch (error) {
        console.error('Error loading profits:', error);
    }
}

// ===========================
// UI UPDATE
// ===========================

async function updateUI() {
    updateUserInfo();
    updateBalance();
    await updateStats();
}

function updateUserInfo() {
    const userName = user && user.fullname 
        ? user.fullname.split(' ').filter((n, i, arr) => i === 0 || i === arr.length - 1).join(' ')
        : 'Utilizador';
    
    document.querySelectorAll('.user-name').forEach(el => {
        el.textContent = userName;
    });
}

function updateBalance() {
    const balance = user ? user.balance : 0;
    const formatted = formatMoney(balance);
    
    document.querySelector('.balance-amount').textContent = formatted;
}

async function updateStats() {
    const statCards = document.querySelectorAll('.stat-card');
    
    // Total Gains
    const totalGainsValue = totalGains
        ? parseFloat(totalGains.bonus_total) + parseFloat(totalGains.casino_total)
        : 0;
    statCards[0].querySelector('.stat-value').textContent = formatMoney(totalGainsValue);
    
    // Monthly Gains
    const monthlyGains = chartData 
        ? (await getLastMonthProfit(chartData)).reduce((sum, item) => sum + parseFloat(item.profit), 0)
        : 0;
    statCards[1].querySelector('.stat-value').textContent = formatMoney(monthlyGains);
    
    // Total Withdrawals
    const totalWithdrawals = withdrawals
        ? withdrawals.data.reduce((sum, w) => sum + parseFloat(w.amount), 0)
        : 0;
    statCards[2].querySelector('.stat-value').textContent = formatMoney(totalWithdrawals);
    
    // Transactions Count
    const transactionsCount = transactions
        ? (await getLastMonthTransactions(transactions)).length
        : 0;
    statCards[3].querySelector('.stat-value').textContent = transactionsCount.toString();
}

// ===========================
// CHART
// ===========================

function initChart() {
    const chartElement = document.querySelector('#activityChart');
    
    if (!transactions || !transactions.data || transactions.data.length === 0) {
        chartElement.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 300px; color: var(--gray); font-size: 0.95rem;"><i class="fas fa-chart-line" style="margin-right: 10px;"></i> Sem dados disponíveis</div>';
        return;
    }

    const initialData = generateFinancialData("monthly");

    const options = {
        series: initialData.series,
        chart: {
            type: 'area',
            height: 300,
            toolbar: { show: false },
            zoom: { enabled: false },
            fontFamily: 'inherit',
            animations: {
                enabled: true,
                easing: 'easeout',
                speed: 800
            }
        },
        dataLabels: { enabled: false },
        stroke: {
            curve: 'smooth',
            width: 3,
            lineCap: 'round'
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 0.3,
                opacityFrom: 0.7,
                opacityTo: 0.1,
                stops: [0, 90, 100]
            }
        },
        xaxis: {
            categories: initialData.labels,
            labels: {
                style: {
                    colors: '#666',
                    fontSize: '11px'
                }
            },
            axisBorder: { show: true },
            axisTicks: { show: false }
        },
        yaxis: {
            labels: {
                formatter: (val) => `€${val.toFixed(2)}`,
                style: {
                    colors: '#666',
                    fontSize: '11px'
                }
            },
            min: 0
        },
        grid: {
            borderColor: 'rgba(0, 0, 0, 0.05)',
            strokeDashArray: 4
        },
        tooltip: {
            shared: true,
            intersect: false,
            y: {
                formatter: (val) => formatMoney(val)
            }
        },
        legend: {
            position: 'top',
            horizontalAlign: 'right',
            markers: {
                width: 10,
                height: 10,
                radius: 2
            }
        },
        colors: initialData.series.map(serie => serie.color)
    };

    const chart = new ApexCharts(chartElement, options);
    chart.render();

    setupPeriodTabs(chart);
}

function generateFinancialData(period) {
    if (!transactions || !transactions.data) {
        return { labels: [], series: [] };
    }

    // Função para obter chave única de período
    const getPeriodKey = (date) => {
        const d = new Date(date);
        switch(period) {
            case "weekly":
                const weekNumber = getWeekNumber(d);
                return `${d.getFullYear()}-W${weekNumber.toString().padStart(2, "0")}`;
            case "monthly":
                return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
            case "yearly":
                return d.getFullYear().toString();
            default:
                return d.toISOString().split('T')[0];
        }
    };

    // Função para formatar labels
    const formatLabel = (key) => {
        switch(period) {
            case "weekly":
                const [yearWeek, week] = key.split('-W');
                return `Sem ${week}`;
            case "monthly":
                const [year, month] = key.split('-');
                const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
                return `${monthNames[parseInt(month) - 1]}`;
            case "yearly":
                return key;
            default:
                const d = new Date(key);
                return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
        }
    };

    // Tipos de transação únicos
    const transactionTypes = [...new Set(transactions.data.map(t => t.transaction_type))];

    // Agrupar por período
    const groupedData = {};

    transactions.data.forEach(t => {
        const periodKey = getPeriodKey(t.created_at);
        const amount = parseFloat(t.amount);
        const type = t.transaction_type;

        if (!groupedData[periodKey]) {
            groupedData[periodKey] = {};
            transactionTypes.forEach(t => groupedData[periodKey][t] = 0);
        }

        groupedData[periodKey][type] += amount;
    });

    // Ordenar períodos
    const periodKeys = Object.keys(groupedData).sort();

    // Criar labels
    const labels = periodKeys.map(key => formatLabel(key));

    // Criar séries
    const series = {};
    transactionTypes.forEach(type => {
        series[type] = periodKeys.map(key => groupedData[key][type] || 0);
    });

    // Nomes e cores
    const transactionNames = {
        'WITHDRAWAL': 'Levantamentos',
        'PROFIT': 'Ganhos',
        'BONUS': 'Bónus'
    };

    const colors = {
        'PROFIT': '#FF9800',
        'WITHDRAWAL': '#4CAF50',
        'BONUS': '#13005A'
    };

    // Converter para formato ApexCharts
    const chartSeries = Object.keys(series).map(type => ({
        name: transactionNames[type] || type,
        data: series[type],
        color: colors[type] || '#CCCCCC'
    }));

    return { labels, series: chartSeries };
}

// Função auxiliar para obter número da semana
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function setupPeriodTabs(chart) {
    const tabs = document.querySelectorAll('.period-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            const period = this.getAttribute('data-period');
            const newData = generateFinancialData(period);
            
            chart.updateOptions({
                xaxis: { categories: newData.labels },
                colors: newData.series.map(serie => serie.color)
            });
            
            chart.updateSeries(newData.series);
        });
    });
}

// ===========================
// UTILITIES
// ===========================

function formatMoney(value) {
    if (value === null || value === undefined || isNaN(value)) {
        return "0,00 €";
    }
    return parseFloat(value).toFixed(2).replace('.', ',') + " €";
}

async function getLastMonthProfit(chartData) {
    if (!chartData || !chartData.data) return [];
    
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return chartData.data.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= lastMonth && itemDate < thisMonth;
    });
}

async function getLastMonthWithdrawals(withdrawals) {
    if (!withdrawals || !withdrawals.data) return [];
    
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return withdrawals.data.filter(w => {
        const wDate = new Date(w.created_at);
        return wDate >= lastMonth && wDate < thisMonth;
    });
}

async function getLastMonthTransactions(transactions) {
    if (!transactions || !transactions.data) return [];
    
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return transactions.data.filter(t => {
        const tDate = new Date(t.created_at);
        return tDate >= lastMonth && tDate < thisMonth;
    });
}
