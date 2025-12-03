let user = null
let withdrawals = null
let transactions = null
let chartData = null
let totalGains = null

export async function init() {
    await getUserData()
    await getUserWithdrawals()
    await getUserTransactions()
    await getUserChartData()
    await getUserProfit()

    fillFields()
    initApexChart()
}

const formatMoney = (value) => {
    if (value === null || value === undefined || isNaN(value)) return "ERROR";
    return parseFloat(value).toFixed(2) + " €";
};

async function fillFields() {
  const cards = document.querySelectorAll(".status-card");

  // Atualizando os cards principais
  cards[0].querySelector(".status-value").textContent = user ? formatMoney(user.balance) : formatMoney(0);
  cards[1].querySelector(".status-value").textContent = totalGains
    ? formatMoney(parseFloat(totalGains.bonus_total) + parseFloat(totalGains.casino_total))
    : formatMoney(0);
  cards[2].querySelector(".status-value").textContent = withdrawals
    ? formatMoney(withdrawals.data.reduce((sum, w) => sum + parseFloat(w.amount), 0))
    : formatMoney(0);

  // Username + Email
  const userName = user && user.fullname ? user.fullname.split(' ').filter((n, i, arr) => i === 0 || i === arr.length - 1).join(' ') : 'Utilizador';
  console.log('User data:', user);
  console.log('Setting username to:', userName);
  document.querySelectorAll(".user-name").forEach((f) => {
    f.textContent = userName;
    console.log('Updated element:', f);
  });
  document.querySelectorAll(".email-field").forEach((f) => (f.textContent = user ? user.email : ''));

  // Mini cards
  const ministatcards = document.querySelectorAll(".mini-stat");
  ministatcards[0].querySelector("strong").textContent = chartData
    ? formatMoney((await getLastMonthProfit(chartData)).reduce((sum, item) => sum + parseFloat(item.profit), 0))
    : formatMoney(0);
  ministatcards[1].querySelector("strong").textContent = withdrawals
    ? formatMoney((await getLastMonthWithdrawals(withdrawals)).reduce((sum, w) => sum + parseFloat(w.amount), 0))
    : formatMoney(0);
  ministatcards[2].querySelector("strong").textContent = transactions
    ? (await getLastMonthTransactions(transactions)).length
    : formatMoney(0);



  // Cálculo do aumento dos ganhos
  let gainsIncrease = 0;
  if(chartData) {
    let lastMonthProfit = (await getLastMonthProfit(chartData)).reduce((sum, item) => sum + parseFloat(item.profit), 0);
    let totalGainsValue = parseFloat(totalGains.bonus_total) + parseFloat(totalGains.casino_total);
        if((totalGainsValue - lastMonthProfit) == 0) totalGainsValue++;
    gainsIncrease = totalGainsValue - lastMonthProfit > 0 ? (lastMonthProfit / (totalGainsValue - lastMonthProfit)) * 100 : 0;
  }

  // Cálculo do aumento dos levantamentos
  let withdrawIncrease = 0
  if(withdrawals) {
    let totalWithdrawals = withdrawals.data.reduce((sum, w) => sum + parseFloat(w.amount), 0);
    let lastMonthWithdrawals = (await getLastMonthWithdrawals(withdrawals)).reduce((sum, w) => sum + parseFloat(w.amount), 0);
    let previousWithdrawals = totalWithdrawals - lastMonthWithdrawals;
    if(previousWithdrawals == 0) previousWithdrawals = lastMonthWithdrawals
    withdrawIncrease = previousWithdrawals > 0 ? (lastMonthWithdrawals / previousWithdrawals) * 100 : 0;
  }

  // Atualiza badges (reutilizável)
  updateBadge(cards[1], gainsIncrease);
  updateBadge(cards[2], withdrawIncrease);
}

// Função genérica para atualizar badges
function updateBadge(card, value) {
  let badge = card.querySelector(".status-badge");
  let icon = badge.querySelector("i");

  // limpa classes antigas
  badge.classList.remove("success", "negative", "warning");
  icon.classList.remove("fa-arrow-up", "fa-arrow-down", "fa-equals");

  // texto
  icon.nextSibling.textContent = " " + value.toFixed(1) + "%";

  // aplica classes conforme valor
  if (value > 0) {
    badge.classList.add("success");
    icon.classList.add("fa-arrow-up");
  } else if (value < 0) {
    badge.classList.add("negative");
    icon.classList.add("fa-arrow-down");
  } else {
    badge.classList.add("warning");
    icon.classList.add("fa-equals");
  }
}



async function getUserData() {
    const response = await API.getUserData()
    if (response.success) {
        user = response.result.data
    } else {
        showAlert(response.message || 'Error loading User Data', "error");
    }
}

async function getUserWithdrawals() {
    const response = await API.getUserWithdrawals()
    if (response.success) {
        withdrawals = response.result.data
    } else {
        showAlert(response.message || 'Error loading User Withdrawals', "error");
    }
}

async function getUserTransactions() {
    const response = await API.getUserTransactions()
    if (response.success) {
        transactions = response.result.data
    } else {
        showAlert(response.message || 'Error loading User Transactions', "error");
    }
}

async function getUserChartData() {
    const response = await API.getChartData()
    if (response.success) {
        chartData = response.result.data
    } else {
        //showAlert(response.message || 'Error loading User Chart Data', "error");
    }
}

async function getUserProfit() {
    const response = await API.getProfits()
    if (response.success) {
        if(!response.result.data.bonus_total && !response.result.data.casino_total) totalGains = null
        else totalGains = response.result.data
    } else {
        showAlert(response.message || 'Error loading User Chart Data', "error");
    }
}


async function getLastMonthTransactions(transactions) {
  try {
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(now.getMonth() - 1);

    const lastMonthTransactions = transactions.data.filter(tx => {
      const txDate = new Date(tx.created_at);
      return txDate >= oneMonthAgo && txDate <= now;
    });

    return lastMonthTransactions;
  } catch (error) {
    return null;
  }
}

function getLastMonthWithdrawals(withdrawals) {
  try {
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(now.getMonth() - 1);

    return withdrawals.data.filter(w => {
        const date = new Date(w.created_at); // ou w.created_at, conforme preferires
        return date >= oneMonthAgo && date <= now;
    });
  } catch (error) {
    return null;
  }
}

function getLastMonthProfit(data) {
      try {
  const now = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(now.getMonth() - 1);

  // Filtra os dados do último mês
  const lastMonthData = data.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate >= oneMonthAgo && itemDate <= now;
  });

  return lastMonthData;
 } catch (error) {
    return null;
  }
}

function generateFinancialData(period = "monthly", limitPeriods = 12) {
    let labels = [];
    let series = {};
    
    // Inicializar cada tipo de transação como array vazio
    const transactionTypes = [...new Set(transactions.data.map(t => t.transaction_type))];
    transactionTypes.forEach(type => series[type] = []);

    // Função para obter chave única baseada no período
    const getPeriodKey = (date) => {
        const d = new Date(date);
        switch(period) {
            case "weekly":
                // Semana do ano: YYYY-Www
                const weekNumber = getWeekNumber(d);
                return `${d.getFullYear()}-W${weekNumber.toString().padStart(2, "0")}`;
            case "monthly":
                // Mês: YYYY-MM
                return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
            case "yearly":
                // Ano: YYYY
                return d.getFullYear().toString();
            default:
                // Dia: YYYY-MM-DD
                return d.toISOString().split('T')[0];
        }
    };

    // Função auxiliar para obter número da semana
    function getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    // Função para formatar labels para exibição
    const formatLabel = (key) => {
        switch(period) {
            case "weekly":
                const [yearWeek, week] = key.split('-W');
                return `Sem ${week}/${yearWeek}`;
            case "monthly":
                const [year, month] = key.split('-');
                const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", 
                                   "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
                return `${monthNames[parseInt(month) - 1]}/${year}`;
            case "yearly":
                return key;
            default:
                return key;
        }
    };

    // Função para gerar todos os períodos entre o mínimo e máximo
const generateAllPeriods = (minDate, maxDate) => {
    const periods = [];
    const current = new Date(minDate);
    const end = new Date(maxDate);
    
    // Ajustar para início do período baseado no tipo
    switch(period) {
        case "yearly":
            current.setMonth(0, 1); // 1 de Janeiro
            current.setHours(0, 0, 0, 0);
            break;
        case "monthly":
            current.setDate(1); // Primeiro dia do mês
            current.setHours(0, 0, 0, 0);
            break;
        case "weekly":
            // Ajustar para início da semana (segunda-feira)
            const day = current.getDay();
            const diff = current.getDate() - day + (day === 0 ? -6 : 1);
            current.setDate(diff);
            current.setHours(0, 0, 0, 0);
            break;
        default:
            current.setHours(0, 0, 0, 0);
    }
    
    // Garantir que current não é maior que end após ajustes
    if (current > end) {
        return periods;
    }
    
    while (current <= end) {
        periods.push(getPeriodKey(current));
        
        switch(period) {
            case "weekly":
                current.setDate(current.getDate() + 7);
                break;
            case "monthly":
                current.setMonth(current.getMonth() + 1);
                break;
            case "yearly":
                current.setFullYear(current.getFullYear() + 1);
                break;
            default:
                current.setDate(current.getDate() + 1);
        }
    }
    
    return periods;
};

    // Encontrar datas mínima e máxima
    const dates = transactions.data.map(t => new Date(t.created_at));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    // Gerar todos os períodos possíveis
    const allPeriods = generateAllPeriods(minDate, maxDate);


    // Aplicar limite apenas se não for yearly OU ajustar o limite para yearly
    let limitedPeriods;
    if (period === "yearly") {
        // Para yearly, mostrar todos os anos ou limitar de forma diferente
        limitedPeriods = allPeriods; // Mostrar todos os anos
        // Ou: limitedPeriods = allPeriods.slice(-5); // Mostrar últimos 5 anos
    } else {
        limitedPeriods = allPeriods.slice(-limitPeriods);
    }

    // Agrupar transações por período
    const groupedData = {};
    
    // Inicializar todos os períodos com zeros
    limitedPeriods.forEach(periodKey => {
        groupedData[periodKey] = {};
        transactionTypes.forEach(type => {
            groupedData[periodKey][type] = 0;
        });
    });
    
    // Preencher com dados reais
    transactions.data.forEach(t => {
        const periodKey = getPeriodKey(t.created_at);
        const amount = parseFloat(t.amount);
        
        if (groupedData[periodKey]) {
            groupedData[periodKey][t.transaction_type] += amount;
        }
    });

    // Extrair e ordenar períodos
    const periodKeys = limitedPeriods.sort();
    
    // Criar labels formatadas
    labels = periodKeys.map(key => formatLabel(key));

    // Preencher séries
    periodKeys.forEach(key => {
        transactionTypes.forEach(type => {
            series[type].push(groupedData[key][type] || 0);
        });
    });

    // Mapear cores e nomes em português para cada tipo de transação
    const transactionNames = {
        'WITHDRAWAL': 'Levantamentos',
        'PROFIT': 'Ganhos',
        'BONUS': 'Bónus'
    };

    const colors = {
        'PROFIT': '#FF9800',    // Amarelo
        'WITHDRAWAL': '#4CAF50', // Verde
        'BONUS': '#13005A'      // Azul
    };

    // Converter em formato que o ApexCharts entende com cores e nomes específicos
    const chartSeries = Object.keys(series).map(type => ({
        name: transactionNames[type] || type, // Usar nome em português ou o original se não mapeado
        data: series[type],
        color: colors[type] || '#CCCCCC' // Cor padrão se o tipo não for mapeado
    }));

    return { labels, series: chartSeries };
}

function initApexChart() {
    const initialData = generateFinancialData("monthly");

    const options = {
        series: initialData.series,
        chart: {
            type: 'area',
            height: 350,
            fontFamily: 'inherit',
            toolbar: { show: false },
            zoom: { enabled: false },
            animations: {
                enabled: true,
                easing: 'easeout',
                speed: 800
            },
            dropShadow: {
                enabled: true,
                top: 5,
                left: 0,
                blur: 8,
                opacity: 0.1
            },
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
            axisBorder: { show: true },
            axisTicks: { show: false },
            labels: {
                style: {
                    colors: '#6B7280',
                    fontFamily: 'inherit'
                }
            },
            tooltip: { enabled: false }
        },
        yaxis: {
            labels: {
                formatter: (val) => `€${val.toFixed(2)}`,
                style: {
                    colors: '#6B7280',
                    fontFamily: 'inherit'
                }
            },
            min: 0
        },
        grid: {
            borderColor: 'rgba(0, 0, 0, 0.05)',
            strokeDashArray: 4,
            padding: {
                top: 20,
                right: 10,
                bottom: 0,
                left: 10
            }
        },
        tooltip: {
            shared: true,
            intersect: false,
            style: {
                fontFamily: 'inherit'
            },
            y: {
                formatter: (val) => `€${val.toFixed(2)}`
            },
            marker: { show: false }
        },
        legend: { show: false },
        // Configuração de cores para cada série
        colors: initialData.series.map(serie => serie.color)
    };

    const chart = new ApexCharts(document.querySelector("#financeChart"), options);
    chart.render();

    // Adicionar event listeners para os botões
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const period = this.dataset.period;
            const newData = generateFinancialData(period);
            
            chart.updateOptions({
                xaxis: { categories: newData.labels },
                colors: newData.series.map(serie => serie.color)
            });
            
            chart.updateSeries(newData.series);
        });
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const period = this.dataset.period;
            const newData = generateFinancialData(period);
            
            chart.updateOptions({
                xaxis: { categories: newData.labels },
                colors: newData.series.map(serie => serie.color)
            });
            
            chart.updateSeries(newData.series);
        });
    });
}


function showAlert(message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.classList.add('fade-out');
        setTimeout(() => alert.remove(), 500);
    }, 3000);
}

function getFirstAndLastName(fullName) {
    if(!fullName) return "Undefined"
    const capitalize = (str) => 
        str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    
    const parts = fullName.trim().split(/\s+/); // separa por espaços
    
    if (parts.length === 0) return "";
    if (parts.length === 1) return capitalize(parts[0]); // só tem um nome
    
    return `${capitalize(parts[0])} ${capitalize(parts[parts.length - 1])}`;
}
