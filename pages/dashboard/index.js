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
    
    if (!chartData || !chartData.data || chartData.data.length === 0) {
        chartElement.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 300px; color: var(--gray); font-size: 0.95rem;"><i class="fas fa-chart-line" style="margin-right: 10px;"></i> Sem dados disponíveis</div>';
        return;
    }

    const initialData = generateFinancialData("monthly");

    const options = {
        series: initialData.series,
        chart: {
            type: 'area',
            height: 300,
            toolbar: {
                show: false
            },
            zoom: {
                enabled: false
            },
            fontFamily: 'inherit'
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            curve: 'smooth',
            width: 2
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.4,
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
                formatter: function(value) {
                    return value.toFixed(2) + '€';
                },
                style: {
                    colors: '#666',
                    fontSize: '11px'
                }
            }
        },
        grid: {
            borderColor: '#f1f1f1',
            strokeDashArray: 4
        },
        tooltip: {
            y: {
                formatter: function(value) {
                    return formatMoney(value);
                }
            }
        },
        legend: {
            position: 'top',
            horizontalAlign: 'right'
        }
    };

    const chart = new ApexCharts(chartElement, options);
    chart.render();

    // Setup period tabs
    setupPeriodTabs(chart);
}

function generateFinancialData(period) {
    if (!chartData || !chartData.data) {
        return { labels: [], series: [] };
    }

    const now = new Date();
    let filteredData = [];

    // Filter data based on period
    switch(period) {
        case 'weekly':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filteredData = chartData.data.filter(item => {
                const itemDate = new Date(item.date);
                return itemDate >= weekAgo;
            });
            break;
        
        case 'monthly':
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            filteredData = chartData.data.filter(item => {
                const itemDate = new Date(item.date);
                return itemDate >= lastMonth && itemDate < thisMonth;
            });
            break;
        
        case 'yearly':
            filteredData = chartData.data.filter(item => {
                const itemDate = new Date(item.date);
                return itemDate.getFullYear() === now.getFullYear();
            });
            break;
        
        default:
            filteredData = chartData.data;
    }

    if (filteredData.length === 0) {
        return { labels: ['Sem dados'], series: [{ name: 'Ganhos', data: [0], color: '#13005A' }] };
    }

    // Group by date and transaction type
    const grouped = {};
    filteredData.forEach(item => {
        const date = new Date(item.date).toISOString().split('T')[0];
        if (!grouped[date]) {
            grouped[date] = {};
        }
        const type = item.transaction_type || 'OUTROS';
        if (!grouped[date][type]) {
            grouped[date][type] = 0;
        }
        grouped[date][type] += parseFloat(item.profit);
    });

    // Get all unique transaction types
    const types = new Set();
    Object.values(grouped).forEach(dateData => {
        Object.keys(dateData).forEach(type => types.add(type));
    });

    // Create series for each type
    const dates = Object.keys(grouped).sort();
    const series = {};
    
    types.forEach(type => {
        series[type] = dates.map(date => grouped[date][type] || 0);
    });

    // Format labels
    const labels = dates.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
    });

    // Transaction type names and colors
    const transactionNames = {
        'CASINO': 'Casino',
        'BONUS': 'Bónus',
        'OUTROS': 'Outros'
    };

    const colors = {
        'CASINO': '#4caf50',
        'BONUS': '#13005A',
        'OUTROS': '#2196f3'
    };

    // Convert to ApexCharts format
    const chartSeries = Object.keys(series).map(type => ({
        name: transactionNames[type] || type,
        data: series[type],
        color: colors[type] || '#CCCCCC'
    }));

    return { labels, series: chartSeries };
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
