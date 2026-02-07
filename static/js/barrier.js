/* ── Barrier / PIN Access ── */

var CLOUDFLARE_API = 'https://pin-api.ctr-gate.workers.dev';
var deviceOnline = false;
var barrierPin = ['', '', '', ''];

function initBarrier() {
    var container = document.getElementById('pin-inputs');
    if (!container) return;

    container.innerHTML = '';
    for (var i = 0; i < 4; i++) {
        var input = document.createElement('input');
        input.type = 'tel';
        input.inputMode = 'numeric';
        input.maxLength = 1;
        input.className = 'w-12 h-12 text-center border-2 border-slate-300 rounded-xl text-xl bg-slate-50';
        input.dataset.index = String(i);
        (function(idx) {
            input.addEventListener('input', function(e) { onBarrierPinInput(e, idx); });
            input.addEventListener('keydown', function(e) { onBarrierPinKeyDown(e, idx); });
        })(i);
        container.appendChild(input);
    }

    // Check device status
    fetch(CLOUDFLARE_API + '/device-status')
        .then(function(res) { return res.json(); })
        .then(function(data) {
            deviceOnline = data.online;
            updateDeviceStatus();
            updateOpenButton();
        })
        .catch(function() {
            deviceOnline = false;
            updateDeviceStatus();
        });
}

function getBarrierPinInputs() {
    return document.querySelectorAll('#pin-inputs input');
}

function onBarrierPinInput(e, index) {
    var value = e.target.value;
    if (value.length > 1) {
        e.target.value = value[0];
    }
    barrierPin[index] = e.target.value;

    if (e.target.value && index < 3) {
        getBarrierPinInputs()[index + 1].focus();
    }
    updateOpenButton();
}

function onBarrierPinKeyDown(e, index) {
    if (e.key === 'Backspace' && !barrierPin[index] && index > 0) {
        getBarrierPinInputs()[index - 1].focus();
    }
}

function updateDeviceStatus() {
    var el = document.getElementById('device-status');
    if (!el) return;

    if (deviceOnline) {
        el.className = 'text-green-600';
        el.setAttribute('data-i18n', 'device_online');
        el.textContent = t('device_online');
    } else {
        el.className = 'text-red-500';
        el.setAttribute('data-i18n', 'device_offline');
        el.textContent = t('device_offline');
    }
}

function updateOpenButton() {
    var btn = document.getElementById('open-btn');
    if (!btn) return;
    var allFilled = barrierPin.every(function(d) { return d !== ''; });
    btn.disabled = !(allFilled && deviceOnline);
}

function triggerBarrier() {
    var entered = barrierPin.join('');
    if (entered.length !== 4) return;

    var statusEl = document.getElementById('barrier-status');
    var btn = document.getElementById('open-btn');

    statusEl.classList.remove('hidden');
    statusEl.className = 'mt-3 text-sm text-center text-slate-500';
    statusEl.textContent = t('checking_pin');

    fetch(CLOUDFLARE_API + '/open-barrier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: entered })
    })
    .then(function(response) { return response.json(); })
    .then(function(result) {
        if (result.success) {
            statusEl.className = 'mt-3 text-sm text-center text-green-600';
            statusEl.textContent = '✅ ' + t('barrier_opened');
            btn.classList.add('btn-opened');

            setTimeout(function() {
                statusEl.classList.add('hidden');
                btn.classList.remove('btn-opened');
            }, 3000);

            resetBarrierPins();
        } else {
            statusEl.className = 'mt-3 text-sm text-center text-red-500';
            statusEl.textContent = t('pin_wrong');
            resetBarrierPins();
        }
    })
    .catch(function() {
        statusEl.className = 'mt-3 text-sm text-center text-red-500';
        statusEl.textContent = t('error_sending');
    });
}

function resetBarrierPins() {
    barrierPin = ['', '', '', ''];
    var inputs = getBarrierPinInputs();
    inputs.forEach(function(input) { input.value = ''; });
    if (inputs.length > 0) inputs[0].focus();
    updateOpenButton();
}

/* Re-translate device status when language changes */
window.addEventListener('languageChanged', function() {
    updateDeviceStatus();
});
