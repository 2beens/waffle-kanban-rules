// Saves options to chrome.storage
function saveOptions() {
    var reviewCapInput = document.getElementById('review-cap').value;
    var selectedCapInput = document.getElementById('selected-cap').value;
    var inProgressCapInput = document.getElementById('in-progress-cap').value;
    var suppressLogsInput = document.getElementById('suppress-logs').checked;
    
    if(reviewCapInput.length == 0 || selectedCapInput.length == 0 || inProgressCapInput.length == 0) {
        showStatus('Won\'t save, check values!', 4000, true);
        return;
    }
    
    chrome.storage.sync.set({
        reviewCap: reviewCapInput,
        inProgressCap: inProgressCapInput,
        selectedCap: selectedCapInput,
        suppressLogs: suppressLogsInput
    }, function() {
        showStatus('Options saved', 2000, false);
    });
}

function showStatus(message, timeout, isError) {
    var statusBox = document.getElementById('status-box');
    statusBox.textContent = message;
    
    if(isError) {
        statusBox.style.color = 'red';
    } else {
        statusBox.style.color = 'green';
    }
    
    setTimeout(function() {
        statusBox.textContent = '';
    }, timeout);
}

function restoreOptions() {
    // Use default values if not found in the storage
    chrome.storage.sync.get({
        reviewCap: 5,
        inProgressCap: 3,
        selectedCap: 8,
        suppressLogs: false
    }, function(items) {
        document.getElementById('review-cap').value = items.reviewCap;
        document.getElementById('selected-cap').value = items.selectedCap;
        document.getElementById('in-progress-cap').value = items.inProgressCap;
        document.getElementById('suppress-logs').checked = items.suppressLogs;
    });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
