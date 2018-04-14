var maxReviewTasks;
var maxInProgressTasks;
var maxSelectedTasks;
var suppressLogs;

async function start() {
    await readOptions();
    
    await stateIsReady();

    log('Setting up Kanban Rules...')

    getBoardBodyColumns().then(function(columnCtList){
        log('Board columns taken...');

        // get columns map
        var columnsMap = getColumnsMap(columnCtList);

        initialColumnsCheck(columnsMap);

        // setup observers - observe cards/tasks being added or removed
        //      REVIEW COLUMN OBSERVER
        var reviewColumn = columnsMap['review'];
        var reviewColumnObserver = new MutationObserver(function(mutationsList, observer) {
            var cards = reviewColumn.getElementsByClassName('card');
            if(cards.length >= maxReviewTasks) {
                reviewColumn.classList.add('parent-div-locked');
            } else {
                reviewColumn.classList.remove('parent-div-locked');
            }
        });
        reviewColumnObserver.observe(reviewColumn, { attributes: false, childList: true });

        //      IN PROGRESS COLUMN OBSERVER
        var inProgressColumn = columnsMap['inProgress'];
        var inProgressColumnObserver = new MutationObserver(function(mutationsList, observer) {
            var cards = inProgressColumn.getElementsByClassName('card');
            if(cards.length >= maxInProgressTasks) {
                inProgressColumn.classList.add('parent-div-locked');
            } else {
                inProgressColumn.classList.remove('parent-div-locked');
            }
        });
        inProgressColumnObserver.observe(inProgressColumn, { attributes: false, childList: true });

        //      SELECTED COLUMN OBSERVER
        var selectedColumn = columnsMap['selected'];
        var selectedColumnObserver = new MutationObserver(function(mutationsList, observer) {
            var cards = selectedColumn.getElementsByClassName('card');
            if(cards.length >= maxSelectedTasks) {
                selectedColumn.classList.add('parent-div-locked');
            } else {
                selectedColumn.classList.remove('parent-div-locked');
            }
        });
        selectedColumnObserver.observe(selectedColumn, { attributes: false, childList: true });

        log('Observers set up.')

        // receive notification from options page that values have been updated
        chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
            console.log('message received from options page');
        });

        log('Kanban Rules Extension loaded successfully!');
    });
}

function initialColumnsCheck(columnsMap) {
    var reviewColumn = columnsMap['review'];
    var selectedColumn = columnsMap['selected'];
    var inProgressColumn = columnsMap['inProgress'];
    var reviewColumnCardCount = columnsMap['review-card-counter'];
    var selectedColumnCardCount = columnsMap['selected-card-counter'];
    var inProgressColumnCardCount = columnsMap['inProgress-card-counter'];
    checkColumn(reviewColumn, reviewColumnCardCount, maxReviewTasks);
    checkColumn(selectedColumn, selectedColumnCardCount, maxSelectedTasks);
    checkColumn(inProgressColumn, inProgressColumnCardCount, maxInProgressTasks);
}

function checkColumn(column, columnCardCount, maxTasksNumber) {
    var cards = column.getElementsByClassName('card');
    if(cards.length >= maxTasksNumber) {
        column.classList.add('parent-div-locked');
        columnCardCount.classList.add('emphasized-card-count');
    } else {
        column.classList.remove('parent-div-locked');
        columnCardCount.classList.remove('emphasized-card-count');
    }
}

function getBoardBodyColumns() {
    return new Promise(resolve => {
        var boardBodyList = document.getElementsByClassName('board-body');
        if(boardBodyList.length === 0 || boardBodyList.length > 1) {
            error('Error. Cannot get board body div! boardBodyList count: ' + boardBodyList.length);
            return [];
        }

        var boardBodyDiv = boardBodyList[0];
        var columnsCtList = boardBodyDiv.getElementsByClassName('columns-ct');
        if(columnsCtList.length === 0 || columnsCtList.length > 1) {
            error('Error. Cannot get "columns-ct" div! boardBodyDiv.childNodes count: ' + columnsCtList.length);
            return [];
        }

        var columnsCtDiv = columnsCtList[0];
        var columnsCtDivObserver = new MutationObserver(function(mutationsList, observer) {
            var columnCtList = columnsCtDiv.getElementsByClassName('column-ct');
            resolve(columnCtList);
            observer.disconnect();
        });

        // Start observing the target node for configured mutations
        columnsCtDivObserver.observe(columnsCtDiv, { attributes: false, childList: true });
    });
}

function getColumnsMap(columnCtList) {
    var columnsMap = {
        'review': null,
        'review-card-counter': null,
        'selected': null,
        'selected-card-counter': null,
        'inProgress': null,
        'inProgress-card-counter': null,
    };

    for(var columnCt of columnCtList) {
        var columnDisplayName = columnCt.getElementsByClassName('column')[0]
            .getElementsByClassName('column-header')[0]
            .getElementsByClassName('column-text')[0]
            .getElementsByClassName('display-name')[0]
            .innerHTML.toLowerCase();

        var column = columnCt.getElementsByClassName('column')[0];
        var columnBody = column.getElementsByClassName('column-body')[0];
        var columnCardCounter = column.getElementsByClassName('column-card-count-total')[0];
        if(columnDisplayName.includes('review')) {
            columnsMap['review'] = columnBody;
            columnsMap['review-card-counter'] = columnCardCounter;
        } else if(columnDisplayName.includes('progress')) {
            columnsMap['inProgress'] = columnBody;
            columnsMap['inProgress-card-counter'] = columnCardCounter;
        } else if(columnDisplayName.includes('selected')) {
            columnsMap['selected'] = columnBody;
            columnsMap['selected-card-counter'] = columnCardCounter;
        }
    }

    return columnsMap;
}

function readOptions() {
    return new Promise(resolve => {
        // Use default values if not found in the storage
        chrome.storage.sync.get({
            reviewCap: 5,
            inProgressCap: 3,
            selectedCap: 8,
            suppressLogs: false
        }, function(items) {
            maxReviewTasks = items.reviewCap;
            maxSelectedTasks = items.selectedCap;
            maxInProgressTasks = items.inProgressCap;
            suppressLogs = items.suppressLogs;

            log('Options have been read');
            resolve();
        });
    });
}

function isBoardCreated() {
    var boardBodyList = document.getElementsByClassName('board-body');
    if(boardBodyList.length === 0) {
        return false;
    }

    return true;
}

function stateIsReady() {
    return new Promise(resolve => {
        var readyStateCheckInterval = setInterval(function() {
            log('Checking for board ready...');
            if(!isBoardCreated()) {
                return;
            }

            if (document.readyState !== "complete") { 
                return; 
            }

            // This part of the script triggers when page is done loading
            clearInterval(readyStateCheckInterval);

            resolve();
        }, 500);
    });
}

function log(message) {
    if(suppressLogs) {
        return;
    }

    console.log(message);
}

function error(message) {
    if(suppressLogs) {
        return;
    }

    console.error(message);
}

// START THE KANBAN RULES CONTENT SCRIPT //////////
//////////////////////////////////////////////////
start();
