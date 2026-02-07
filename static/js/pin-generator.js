/* ── Guest PIN Generator ── */

var GENERATOR_API = 'https://pin-api.ctr-gate.workers.dev';
var adminPin = ['', '', '', ''];
var generatedPinValue = null;

function initPinGenerator() {
    var container = document.getElementById('admin-pin-inputs');
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
            input.addEventListener('input', function(e) { onAdminPinInput(e, idx); });
            input.addEventListener('keydown', function(e) { onAdminPinKeyDown(e, idx); });
        })(i);
        container.appendChild(input);
    }
}

function getAdminPinInputs() {
    return document.querySelectorAll('#admin-pin-inputs input');
}

function onAdminPinInput(e, index) {
    var value = e.target.value;
    if (value.length > 1) {
        e.target.value = value[0];
    }
    adminPin[index] = e.target.value;

    if (e.target.value && index < 3) {
        getAdminPinInputs()[index + 1].focus();
    }
    updateGenerateButton();
}

function onAdminPinKeyDown(e, index) {
    if (e.key === 'Backspace' && !adminPin[index] && index > 0) {
        getAdminPinInputs()[index - 1].focus();
    }
}

function updateGenerateButton() {
    var btn = document.getElementById('generate-btn');
    if (!btn) return;
    var allFilled = adminPin.every(function(d) { return d !== ''; });
    btn.disabled = !allFilled;
}

function handleGenerate() {
    var errorEl = document.getElementById('generate-error');
    var resultEl = document.getElementById('generated-result');
    var btn = document.getElementById('generate-btn');

    errorEl.classList.add('hidden');
    resultEl.classList.add('hidden');

    var pin = adminPin.join('');
    if (pin.length !== 4) {
        showGenerateError(t('admin_pin_incomplete'));
        return;
    }

    btn.disabled = true;
    btn.querySelector('[data-i18n]').textContent = t('generating');

    fetch(GENERATOR_API + '/generate-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPin: pin })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        if (!data.success) {
            showGenerateError(data.reason || t('error_unknown'));
            resetAdminPins();
            return;
        }

        generatedPinValue = data.pin;
        document.getElementById('generated-pin').textContent = data.pin;
        resultEl.classList.remove('hidden');
        resetAdminPins();
    })
    .catch(function() {
        showGenerateError(t('error_network'));
    })
    .finally(function() {
        btn.disabled = false;
        btn.querySelector('[data-i18n]').textContent = t('generate_button');
        updateGenerateButton();
    });
}

function showGenerateError(msg) {
    var errorEl = document.getElementById('generate-error');
    errorEl.textContent = msg;
    errorEl.classList.remove('hidden');
}

function resetAdminPins() {
    adminPin = ['', '', '', ''];
    var inputs = getAdminPinInputs();
    inputs.forEach(function(input) { input.value = ''; });
    if (inputs.length > 0) inputs[0].focus();
    updateGenerateButton();
}

function copyPin() {
    if (!generatedPinValue) return;
    navigator.clipboard.writeText(generatedPinValue);
    var msg = document.getElementById('copy-pin-msg');
    msg.classList.remove('hidden');
    setTimeout(function() { msg.classList.add('hidden'); }, 2000);
}

function copyGuestLink() {
    var link = window.location.origin + '/guests';
    navigator.clipboard.writeText(link);
    var msg = document.getElementById('copy-link-msg');
    msg.classList.remove('hidden');
    setTimeout(function() { msg.classList.add('hidden'); }, 2000);
}
