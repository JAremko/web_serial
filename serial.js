let port;
let writer;

document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
    if ("serial" in navigator) {
        document.getElementById('appContainer').innerHTML =
            '<button id="connect" class="button is-link">Connect to Serial Device</button>';
        document.getElementById('connect').addEventListener('click', connectSerial);
    } else {
        displayNotSupportedError();
    }
}

function displayNotSupportedError() {
    document.getElementById('appContainer').innerHTML =
        '<div class="notification is-danger">Web Serial API is not supported in this browser. ' +
        'Please check <a href="https://caniuse.com/web-serial" target="_blank">browser compatibility</a>.</div>';
}

async function connectSerial() {
    try {
        port = await navigator.serial.requestPort();
        await port.open({ baudRate: 115200 });
        writer = port.writable.getWriter();
        console.log('Connected to the serial port');
        displayConfigUpload();
    } catch (err) {
        console.error('There was an error opening the serial port: ', err);
    }
}

function displayConfigUpload() {
    document.getElementById('appContainer').innerHTML =
        '<input type="file" id="configUpload" class="button is-info" />' +
        '<div id="dynamicButtons"></div>';
    document.getElementById('configUpload').addEventListener('change', handleConfigUpload);
}

function handleConfigUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = e => generateButtons(parseConfigToJSON(e.target.result));
        reader.readAsText(file);
    }
}

async function sendCommand(byteArray) {
    if (writer) {
        await writer.write(new Uint8Array(byteArray));
        console.log('Command sent:', byteArray);
    } else {
        console.error('Serial port not connected or writer not set up.');
    }
}

function generateButtons(config) {
    const dynamicButtonsDiv = document.getElementById('dynamicButtons');
    dynamicButtonsDiv.innerHTML = '';
    Object.keys(config).forEach(section => {
        const panel = createPanel(section, section === 'SHORTCUT' || section === 'BATCHSEND');
        dynamicButtonsDiv.appendChild(panel);
        if (section === 'SHORTCUT') {
            Object.entries(groupShortcuts(config[section])).forEach(([group, items]) => {
                panel.appendChild(createGroupHeader(group));
                items.forEach(item => panel.appendChild(createButton(item.label, item.command)));
            });
        } else {
            Object.entries(config[section]).forEach(([label, command]) => {
                panel.appendChild(createButton(label, command));
            });
        }
    });
}

function createPanel(title, isMainSection = false) {
    const panel = document.createElement('nav');
    panel.classList.add('panel');
    const panelHeading = document.createElement('p');
    panelHeading.classList.add('panel-heading');
    if (isMainSection) {
        panelHeading.style.background = 'none';
        panelHeading.style.textAlign = 'center';
        panelHeading.style.fontWeight = 'bold';
    }
    panelHeading.textContent = title;
    panel.appendChild(panelHeading);
    return panel;
}

function createGroupHeader(group) {
    const groupHeader = document.createElement('p');
    groupHeader.textContent = group;
    groupHeader.classList.add('panel-heading', 'is-link');
    return groupHeader;
}

function createButton(label, byteArray) {
    const panelBlock = document.createElement('div');
    panelBlock.classList.add('panel-block');
    const button = document.createElement('button');
    button.classList.add('button', 'is-primary', 'is-fullwidth', 'config-button');
    button.textContent = label.trim();
    button.addEventListener('click', () => sendCommand(byteArray));
    panelBlock.appendChild(button);
    return panelBlock;
}

function groupShortcuts(shortcuts) {
    return Object.entries(shortcuts).reduce((grouped, [key, command]) => {
        const [prefix, groupName, ...rest] = key.split(/[-\s]/);
        const groupKey = `${prefix}-${groupName}`;
        if (!grouped[groupKey]) {
            grouped[groupKey] = [];
        }
        grouped[groupKey].push({ label: rest.join(' '), command });
        return grouped;
    }, {});
}

function parseConfigToJSON(input) {
    return input.split('\n').reduce((result, line) => {
        line = line.trim();
        if (line.startsWith('[') && line.endsWith(']')) {
            result[line.slice(1, -1)] = {};
        } else if (line) {
            const [key, hexString] = parseLine(line, Object.keys(result).pop());
            if (key) result[Object.keys(result).pop()][key] = hexStringToByteArray(hexString);
        }
        return result;
    }, {});
}

function parseLine(line, currentSection) {
    if (currentSection === 'BATCHSEND') {
        // For BATCHSEND, extract the label from between the last pair of '|'
        const parts = line.split('|');
        const key = parts[parts.length - 2].trim();
        const hexString = parts[parts.length - 1].trim();
        return [key, hexString];
    } else {
        // For other sections
        const [left, right] = line.split('=');
        const key = left?.trim();
        const hexString = right?.split('|').pop().trim();
        return [key, hexString];
    }
}

function hexStringToByteArray(hexString) {
    return hexString.split(' ').map(s => parseInt(s, 16));
}

// Initialization and Event Handlers
document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
    if (navigator.serial) {
        setupConnectButton();
    } else {
        displayNotSupportedError();
    }
}

function setupConnectButton() {
    const appContainer = document.getElementById('appContainer');
    appContainer.innerHTML = '<button id="connect" class="button is-link">Connect to Serial Device</button>';
    document.getElementById('connect').addEventListener('click', connectSerial);
}

function displayNotSupportedError() {
    const appContainer = document.getElementById('appContainer');
    appContainer.innerHTML = '<div class="notification is-danger">Web Serial API is not supported in this browser. ' +
                             'Please check <a href="https://caniuse.com/web-serial" target="_blank">browser compatibility</a>.</div>';
}

// Serial Connection
async function connectSerial() {
    try {
        port = await navigator.serial.requestPort();
        await port.open({ baudRate: 115200 });
        writer = port.writable.getWriter();
        console.log('Connected to the serial port');
        displayConfigUpload();
    } catch (err) {
        console.error('There was an error opening the serial port: ', err);
    }
}

// Config Upload
function displayConfigUpload() {
    const appContainer = document.getElementById('appContainer');
    appContainer.innerHTML = '<input type="file" id="configUpload" class="button is-info" />' +
                             '<div id="dynamicButtons"></div>';
    document.getElementById('configUpload').addEventListener('change', handleConfigUpload);
}

function handleConfigUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = e => generateButtons(parseConfigToJSON(e.target.result));
        reader.readAsText(file);
    }
}
