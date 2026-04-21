function switchView(viewName) {
    ['resumen', 'reportes', 'configuracion'].forEach(v => {
        document.getElementById('view-' + v).style.display = 'none';
        document.getElementById('btn-' + v).classList.remove('active');
    });
    document.getElementById('view-' + viewName).style.display = 'block';
    document.getElementById('btn-' + viewName).classList.add('active');
}

function showReportDetails(metric) {
    const title = document.getElementById('report-detail-title');
    const subtitle = document.getElementById('report-detail-subtitle');
    const icon = document.getElementById('report-detail-icon');
    
    document.getElementById('btn-rep-ph').className = 'filter-btn';
    document.getElementById('btn-rep-cloro').className = 'filter-btn';
    document.getElementById('btn-rep-turb').className = 'filter-btn';

    if(metric === 'ph') {
        document.getElementById('btn-rep-ph').classList.add('active-ph');
        icon.className = 'fas fa-vial';
        icon.style.color = colors.cyan;
        title.innerText = 'Histórico Detallado de pH';
        subtitle.innerHTML = 'En las últimas 24 horas, el pH ha oscilado entre <b>6.8</b> y <b>7.2</b>.<br/><br/><ul style="padding-left: 20px; line-height: 1.8; text-align: left;"><li style="color: var(--text-main);">Valor máximo ayer: 7.3 a las 14:00</li><li style="color: var(--text-main);">Media de la semana pasada: 7.0</li><li style="color: var(--text-main);">Sin anomalías críticas reportadas en el mes.</li></ul>';
    } else if(metric === 'cloro') {
        document.getElementById('btn-rep-cloro').classList.add('active-cloro');
        icon.className = 'fas fa-radiation';
        icon.style.color = colors.magenta;
        title.innerText = 'Histórico Detallado de Cloro Residual';
        subtitle.innerHTML = 'En las últimas 24 horas, el Cloro Residual ha promediado <b>1.0 mg/L</b>.<br/><br/><ul style="padding-left: 20px; line-height: 1.8; text-align: left;"><li style="color: var(--text-main);">3 alertas puntuales por baja dosificación el lunes al inicio de turno.</li><li style="color: var(--text-main);">Media de la semana pasada: 0.95 mg/L</li><li style="color: var(--text-main);">Consumo estable acorde al caudal tratado promedio.</li></ul>';
    } else if(metric === 'turb') {
        document.getElementById('btn-rep-turb').classList.add('active-turb');
        icon.className = 'fas fa-water';
        icon.style.color = colors.yellow;
        title.innerText = 'Histórico Detallado de Turbidez';
        subtitle.innerHTML = 'La Turbidez se ha mantenido baja con un pico máximo de <b>0.8 NTU</b>.<br/><br/><ul style="padding-left: 20px; line-height: 1.8; text-align: left;"><li style="color: var(--text-main);">Pico registrado tras lluvias torrenciales (0.8 NTU a las 05:00AM).</li><li style="color: var(--text-main);">Media del mes actual: 0.45 NTU</li><li style="color: var(--text-main);">El sistema de filtración opera con 95% de eficiencia promedio.</li></ul>';
    }
}


let currentMode = 'manual';
let autoIntervalId = null;
const maxHistory = 15;
let dataLog = []; 


const colors = {
    cyan: '#00e5ff',
    cyanFill: 'rgba(0, 229, 255, 0.1)',
    magenta: '#ff007f',
    magentaFill: 'rgba(255, 0, 127, 0.1)',
    yellow: '#ffd700',
    yellowFill: 'rgba(255, 215, 0, 0.1)',
    grid: '#23314a',
    text: '#8b9bb4'
};


const sliders = {
    ph: document.getElementById('phSlider'),
    cloro: document.getElementById('cloroSlider'),
    turb: document.getElementById('turbidezSlider')
};
const nums = {
    ph: document.getElementById('phNum'),
    cloro: document.getElementById('cloroNum'),
    turb: document.getElementById('turbNum')
};
const vals = {
    ph: document.getElementById('phVal'),
    cloro: document.getElementById('cloroVal'),
    turb: document.getElementById('turbVal')
};
const badges = {
    ph: document.getElementById('phStatusBadge'),
    cloro: document.getElementById('cloroStatusBadge'),
    turb: document.getElementById('turbStatusBadge')
};


let mainChart, sparkPh, sparkCloro, sparkTurb;


function initCharts() {
    Chart.defaults.color = colors.text;
    Chart.defaults.font.family = 'Inter';

    
    const sparkOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
            x: { display: false },
            y: { display: false }
        },
        elements: {
            point: { radius: 0, hitRadius: 10, hoverRadius: 4 }
        }
    };

    const ctxPh = document.getElementById('sparkPh').getContext('2d');
    sparkPh = new Chart(ctxPh, {
        type: 'line',
        data: { labels: [], datasets: [{ data: [], borderColor: colors.cyan, backgroundColor: colors.cyanFill, fill: true, tension: 0.4, borderWidth: 2 }] },
        options: sparkOptions
    });

    const ctxCloro = document.getElementById('sparkCloro').getContext('2d');
    sparkCloro = new Chart(ctxCloro, {
        type: 'line',
        data: { labels: [], datasets: [{ data: [], borderColor: colors.magenta, backgroundColor: colors.magentaFill, fill: true, tension: 0.4, borderWidth: 2 }] },
        options: sparkOptions
    });

    const ctxTurb = document.getElementById('sparkTurb').getContext('2d');
    sparkTurb = new Chart(ctxTurb, {
        type: 'line',
        data: { labels: [], datasets: [{ data: [], borderColor: colors.yellow, backgroundColor: colors.yellowFill, fill: true, tension: 0.4, borderWidth: 2 }] },
        options: sparkOptions
    });

    const ctxMain = document.getElementById('mainTrendChart').getContext('2d');
    mainChart = new Chart(ctxMain, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                { label: 'pH', data: [], borderColor: colors.cyan, tension: 0.4, borderWidth: 2, yAxisID: 'y' },
                { label: 'Cloro (mg/L)', data: [], borderColor: colors.magenta, tension: 0.4, borderWidth: 2, yAxisID: 'y1' },
                { label: 'Turbidez (NTU)', data: [], borderColor: colors.yellow, tension: 0.4, borderWidth: 2, yAxisID: 'y1' }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { 
                    position: 'top', 
                    labels: { 
                        usePointStyle: true, 
                        boxWidth: 8,
                        generateLabels: function(chart) {
                            return chart.data.datasets.map((dataset, i) => {
                                const hidden = !chart.isDatasetVisible(i);
                                return {
                                    text: dataset.label,
                                    fillStyle: hidden ? 'transparent' : dataset.borderColor,
                                    strokeStyle: dataset.borderColor,
                                    lineWidth: 2,
                                    pointStyle: 'circle',
                                    hidden: hidden,
                                    fontColor: hidden ? 'rgba(139, 155, 180, 0.4)' : colors.text,
                                    datasetIndex: i,
                                    textDecoration: 'none'
                                };
                            });
                        }
                    } 
                }
            },
            scales: {
                x: { grid: { color: colors.grid, drawBorder: false } },
                y: { 
                    type: 'linear', position: 'left', min: 0, max: 14, 
                    title: { display: true, text: 'pH' },
                    grid: { color: colors.grid, drawBorder: false } 
                },
                y1: { 
                    type: 'linear', position: 'right', min: 0, max: 5,
                    title: { display: true, text: 'Cloro / Turbidez' },
                    grid: { drawOnChartArea: false } 
                }
            }
        }
    });
}

function getTimeString() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}


function generateInitialData() {
    let lastPh = 7.0; let lastCloro = 1.0; let lastTurb = 0.5;
    for(let i = maxHistory; i > 0; i--) {
        let d = new Date();
        d.setMinutes(d.getMinutes() - i);
        dataLog.push({
            time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            ph: lastPh, cloro: lastCloro, turb: lastTurb
        });
        lastPh += (Math.random() - 0.5) * 0.2;
        lastCloro += (Math.random() - 0.5) * 0.1;
        lastTurb += (Math.random() - 0.5) * 0.1;
    }
    updateChartsWithData();
    renderTable();
}


function evaluateStatus(ph, cloro, turb) {
    let phStatus = (ph >= 6.5 && ph <= 8.5) ? 'normal' : (ph < 6.5 ? 'bajo' : 'alto');
    let clStatus = (cloro >= 0.5 && cloro <= 2.0) ? 'normal' : (cloro < 0.5 ? 'bajo' : 'alto');
    let trStatus = (turb < 1.0) ? 'normal' : 'alto';
    
    return {
        ph: { s: phStatus, label: phStatus.toUpperCase() },
        cloro: { s: clStatus, label: clStatus.toUpperCase() },
        turb: { s: trStatus, label: trStatus.toUpperCase() }
    };
}


function updateDashboardUI(ph, cloro, turb, pushToHistory = true) {
    
    sliders.ph.value = ph.toFixed(2);
    sliders.cloro.value = cloro.toFixed(2);
    sliders.turb.value = turb.toFixed(2);
    nums.ph.innerText = ph.toFixed(2);
    nums.cloro.innerText = cloro.toFixed(2);
    nums.turb.innerText = turb.toFixed(2);
    
    vals.ph.innerText = ph.toFixed(2);
    vals.cloro.innerText = cloro.toFixed(2);
    vals.turb.innerText = turb.toFixed(2);

    const st = evaluateStatus(ph, cloro, turb);
    
    
    const setBadge = (el, info) => {
        el.innerText = info.label;
        el.className = 'badge';
        if(info.s === 'normal') el.classList.add('badge-normal');
        else if(info.label === 'BAJO') el.classList.add('badge-warning');
        else el.classList.add('badge-danger');
    };
    setBadge(badges.ph, st.ph);
    setBadge(badges.cloro, st.cloro);
    setBadge(badges.turb, st.turb);

    
    updateAlerts(ph, cloro, turb, st);
    
    document.getElementById('timestampLabel').innerText = `Última actualización: ${getTimeString()}`;

    if(pushToHistory) {
        const now = new Date();
        dataLog.push({
            time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second:'2-digit' }),
            ph: parseFloat(ph.toFixed(2)),
            cloro: parseFloat(cloro.toFixed(2)),
            turb: parseFloat(turb.toFixed(2))
        });
        if(dataLog.length > maxHistory) dataLog.shift();
        
        updateChartsWithData();
        renderTable();
    }
}

function updateAlerts(ph, cloro, turb, st) {
    let html = [];
     if (st.cloro.s === 'bajo') html.push(`<li class="alert-item"><div class="alert-icon" style="color:var(--accent-yellow)"><i class="fas fa-exclamation-triangle"></i></div><div class="alert-content"><span class="alert-title">Cloro Bajo (${cloro.toFixed(2)} mg/L)</span><span class="alert-desc">Riesgo microbiológico detectado. Revisar inyección de hipoclorito.</span></div></li>`);
    else if (st.cloro.s === 'alto') html.push(`<li class="alert-item"><div class="alert-icon" style="color:var(--accent-red)"><i class="fas fa-radiation"></i></div><div class="alert-content"><span class="alert-title">Cloro Alto (${cloro.toFixed(2)} mg/L)</span><span class="alert-desc">Nivel tóxico. Reducir dosificación inmediatamente.</span></div></li>`);
    
    if (st.turb.s === 'alto') html.push(`<li class="alert-item"><div class="alert-icon" style="color:var(--accent-yellow)"><i class="fas fa-water"></i></div><div class="alert-content"><span class="alert-title">Turbidez Alta (${turb.toFixed(2)} NTU)</span><span class="alert-desc">Problemas de sedimentación/filtración. Verificar purgas.</span></div></li>`);

    if (st.ph.s === 'bajo') html.push(`<li class="alert-item"><div class="alert-icon" style="color:var(--accent-cyan)"><i class="fas fa-vial"></i></div><div class="alert-content"><span class="alert-title">pH Bajo (${ph.toFixed(2)})</span><span class="alert-desc">Agua ácida. Riesgo de corrosión en tuberías.</span></div></li>`);
    else if (st.ph.s === 'alto') html.push(`<li class="alert-item"><div class="alert-icon" style="color:var(--accent-cyan)"><i class="fas fa-vial"></i></div><div class="alert-content"><span class="alert-title">pH Alto (${ph.toFixed(2)})</span><span class="alert-desc">Agua alcalina. Reduce eficiencia del cloro.</span></div></li>`);

    if(html.length === 0) {
        html.push(`<li class="alert-item"><div class="alert-icon" style="color:var(--accent-green)"><i class="fas fa-shield-check"></i></div><div class="alert-content"><span class="alert-title">Sistema Óptimo</span><span class="alert-desc">Todos los parámetros se encuentran dentro de las normas.</span></div></li>`);
    }
    document.getElementById('alertsList').innerHTML = html.join('');
}

function renderTable() {
    const tbody = document.getElementById('historyTableBody');
    tbody.innerHTML = '';
    const revLog = [...dataLog].reverse();
    revLog.forEach(row => {
        let issues = [];
        if (row.ph < 6.5 || row.ph > 8.5) issues.push("pH");
        if (row.cloro < 0.5 || row.cloro > 2.0) issues.push("Cloro");
        if (row.turb >= 1.0) issues.push("Turbidez");
        
        let badgeClass = 'badge-normal';
        let badgeText = 'Óptimo';
        if(issues.length > 0) {
            badgeClass = issues.includes('Turbidez') || issues.includes('Cloro') ? 'badge-danger' : 'badge-warning';
            badgeText = `Alerta: ${issues.join(', ')}`;
        }

        tbody.innerHTML += `<tr>
            <td>${row.time}</td>
            <td>${row.ph.toFixed(2)}</td>
            <td>${row.cloro.toFixed(2)}</td>
            <td>${row.turb.toFixed(2)}</td>
            <td><span class="badge ${badgeClass}">${badgeText}</span></td>
        </tr>`;
    });
}

function updateChartsWithData() {
    const labels = dataLog.map(d => d.time);
    const dPh = dataLog.map(d => d.ph);
    const dCl = dataLog.map(d => d.cloro);
    const dTr = dataLog.map(d => d.turb);

    sparkPh.data.labels = labels;
    sparkPh.data.datasets[0].data = dPh;
    sparkPh.update();

    sparkCloro.data.labels = labels;
    sparkCloro.data.datasets[0].data = dCl;
    sparkCloro.update();

    sparkTurb.data.labels = labels;
    sparkTurb.data.datasets[0].data = dTr;
    sparkTurb.update();

    mainChart.data.labels = labels;
    mainChart.data.datasets[0].data = dPh;
    mainChart.data.datasets[1].data = dCl;
    mainChart.data.datasets[2].data = dTr;
    mainChart.update();
}


function onSliderInput() {
    const ph = parseFloat(sliders.ph.value);
    const cl = parseFloat(sliders.cloro.value);
    const tb = parseFloat(sliders.turb.value);
    updateDashboardUI(ph, cl, tb, true);
}

sliders.ph.addEventListener('input', onSliderInput);
sliders.cloro.addEventListener('input', onSliderInput);
sliders.turb.addEventListener('input', onSliderInput);


document.getElementById('resetBtn').addEventListener('click', () => {
    updateDashboardUI(7.0, 1.0, 0.4, true);
});


let currentVals = { ph: 7.0, cl: 1.0, tb: 0.5 };
function autoSimulationStep() {
    const nextValue = (curr, min, max, target, vol) => {
        let delta = (Math.random() - 0.5) * vol;
        let pull = (target - curr) * 0.05;
        return Math.max(min, Math.min(max, curr + delta + pull));
    };
    
    currentVals.ph = nextValue(currentVals.ph, 0, 14, 7.0, 0.15);
    currentVals.cl = nextValue(currentVals.cl, 0, 4, 1.2, 0.1);
    currentVals.tb = nextValue(currentVals.tb, 0, 5, 0.5, 0.1);

    if(Math.random() < 0.03) currentVals.tb += 0.8;
    if(Math.random() < 0.02) currentVals.cl -= 0.5;

    updateDashboardUI(currentVals.ph, currentVals.cl, currentVals.tb, true);
}


const radioManual = document.getElementById('modeManual');
const radioAuto = document.getElementById('modeAuto');
const labelManual = document.getElementById('labelManual');
const labelAuto = document.getElementById('labelAuto');

function switchMode(e) {
    currentMode = e.target.value;
    if(currentMode === 'auto') {
        labelAuto.classList.add('active');
        labelManual.classList.remove('active');
        
        currentVals = { ph: parseFloat(sliders.ph.value), cl: parseFloat(sliders.cloro.value), tb: parseFloat(sliders.turb.value) };
        
        ['ph','cloro','turb'].forEach(s => sliders[s].disabled = true);
        sliders.ph.style.opacity = '0.5';
        sliders.cloro.style.opacity = '0.5';
        sliders.turb.style.opacity = '0.5';

        autoIntervalId = setInterval(autoSimulationStep, 2500);
    } else {
        labelManual.classList.add('active');
        labelAuto.classList.remove('active');
        
        ['ph','cloro','turb'].forEach(s => sliders[s].disabled = false);
        sliders.ph.style.opacity = '1';
        sliders.cloro.style.opacity = '1';
        sliders.turb.style.opacity = '1';

        clearInterval(autoIntervalId);
    }
}

radioManual.addEventListener('change', switchMode);
radioAuto.addEventListener('change', switchMode);


window.onload = () => {
    initCharts();
    generateInitialData();
    updateDashboardUI(7.0, 1.0, 0.5, false);
};
