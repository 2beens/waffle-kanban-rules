chrome.extension.sendMessage({}, function(response) {
    var maxReviewTasks;
    var maxInProgressTasks;
    var maxSelectedTasks;
    var suppressLogs;
    
    readOptions(function() {
        var readyStateCheckInterval = setInterval(function() {
            log('Checking for board ready...');
            if(!isBoardCreated()) {
                return;
            }

            if (document.readyState !== "complete") { 
                return; 
            }

            // This part of the script triggers when page is done loading
            log('Setting up Kanban Rules...')
            clearInterval(readyStateCheckInterval);

            getBoardBodyColumns(function(columnCtList){
                log('Board columns taken...');

                // get columns map
                var columnsMap = getColumnsMap(columnCtList);

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
            });

            log('Kanban Rules Extension loaded successfully!');
        }, 500);
    });

    function getChildDivsCount(parentDiv) {
        var childCount = 0;
        for(var i = 0; i < parentDiv.childNodes.length; i++) {
            if(parentDiv.childNodes[i].tagName === undefined) { continue; }
            if(parentDiv.childNodes[i].tagName.toLowerCase() === 'div') {
                childCount++;
            }
        }
        return childCount;
    }
    
    function isBoardCreated() {
        var boardBodyList = document.getElementsByClassName('board-body');
        if(boardBodyList.length === 0) {
            return false;
        }
        
        return true;
    }

    function getBoardBodyColumns(callback) {
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
            callback(columnCtList);
            observer.disconnect();
        });

        // Start observing the target node for configured mutations
        columnsCtDivObserver.observe(columnsCtDiv, { attributes: false, childList: true });
    }
    
    function getColumnsMap(columnCtList) {
        var columnsMap = {
            'review': null,
            'selected': null,
            'inProgress': null
        };

        for(var column of columnCtList) {
            var columnDisplayName = column.getElementsByClassName('column')[0]
                .getElementsByClassName('column-header')[0]
                .getElementsByClassName('column-text')[0]
                .getElementsByClassName('display-name')[0]
                .innerHTML.toLowerCase();

            if(columnDisplayName.includes('review')) {
                columnsMap['review'] = column.getElementsByClassName('column')[0]
                    .getElementsByClassName('column-body')[0];
            } else if(columnDisplayName.includes('progress')) {
                columnsMap['inProgress'] = column.getElementsByClassName('column')[0]
                    .getElementsByClassName('column-body')[0];
            } else if(columnDisplayName.includes('selected')) {
                columnsMap['selected'] = column.getElementsByClassName('column')[0]
                    .getElementsByClassName('column-body')[0];
            }
        }

        return columnsMap;
    }
    
    function readOptions(callback) {
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
            callback();
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
});
