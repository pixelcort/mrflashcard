window.ADAPTER_SPECIFIED = 'websql';

window.NEW_POUCHDB_OPTIONS = {
	adapter: ADAPTER_SPECIFIED
};
if (navigator.platform === "MacIntel") {
	NEW_POUCHDB_OPTIONS.size = 99999;
} else {
	NEW_POUCHDB_OPTIONS.size = 51;
}

window.DATABASE_NAME_LOCAL  = 'mrflashcard12';

window.db = new PouchDB(DATABASE_NAME_LOCAL, NEW_POUCHDB_OPTIONS);
window.dbInfo = {};
// window.remoteDb = new PouchDB(set when calling window.sync);
window.remoteDbInfo = {};
window.updateAllDbsInfos = function () {
	window.remoteDb.info(function (err, info) {
		if (!err) {
			window.remoteDbInfo = info;
		}
	});
	window.db.info(function (err, info) {
		if (!err) {
			window.dbInfo = info;
		}
	})
}

console.log('adapter: ' +ADAPTER_SPECIFIED);

window.sync = function (remoteDbUrl, $scope, callback) {
	window.remoteDb = new PouchDB(remoteDbUrl);
	window.updateAllDbsInfos();

	var replicateOptions = {
		batch_size: 20, // default 100,
		batches_limit: 2 // default 10
		// beta-82 -  10 & 1 works, but is very slow
		// beta-83 - 100 & 1 stalls on Pull
		// beta-84 - 20 & 1 works, still kinda slow
		// beta-87 - 20 & 2
	};
	var syncStatus = PouchDB.replicate(DATABASE_NAME_LOCAL, remoteDbUrl, replicateOptions);
	var firstSeq;
	syncStatus.on('change', function (info) {
		if (!firstSeq) firstSeq = info.last_seq;
		$scope.$apply(function(){$scope._syncProgress = "Pushing: " + info.last_seq + " of " + dbInfo.update_seq + " - " + (Math.round(10000*(info.last_seq-firstSeq)/(dbInfo.update_seq-firstSeq))/100).toString() + '%';});
		console.log("Pushing " + info.last_seq);
	});
	var syncErrorHandler = function (err) {
		console.log(err);
		alert("Sync failed, please try again.");
		callback(err);
	}
	syncStatus.on('error', syncErrorHandler);

	syncStatus.on('complete', function(info) {
		console.log('!');
		$scope.$apply(function(){$scope._syncProgress = "Push Complete! Now pull in progress...";});

		console.log('Second, pull...');
		var syncStatus = PouchDB.replicate(remoteDbUrl, DATABASE_NAME_LOCAL, replicateOptions);
		var firstSeq;
		syncStatus.on('change', function (info) {
			if (!firstSeq) firstSeq = info.last_seq;
			$scope.$apply(function(){$scope._syncProgress = "Pulling: " + info.last_seq + " of " + remoteDbInfo.update_seq + " - " + (Math.round(10000*(info.last_seq-firstSeq)/(remoteDbInfo.update_seq-firstSeq))/100).toString() + '%';});
			console.log("Pulling " + info.last_seq);
		});
		syncStatus.on('error', syncErrorHandler);
		syncStatus.on('complete', function(info) {
			console.log('Pull Complete!');
			callback();
		});

	});
};


window.SHUFFLE_LIMIT = 5;
window.DUE_CARDS_BY_PRIORITY_QUERY = 'mrflashcard/dueCardsByPriority';
window.getNextCard = function (callback) {
	db.query(DUE_CARDS_BY_PRIORITY_QUERY, {descending:true, limit:SHUFFLE_LIMIT}, function (err, response) {
		if (err) {
			return callback();
		}
		var rows = response.rows;
		if (rows.length) {
			var rowsLength = rows.length;
			var nextCard = rows[Math.floor(Math.random()*Math.min(rowsLength, SHUFFLE_LIMIT))].value;
			callback(nextCard);
		} else {
			callback();
		}
	});
};

window.asyncForEach = function (array, eachFunction, finallCallback) {
	var length = array.length,
			index = 0;

	callNext();

	function callNext () {
		eachFunction(array[index], eachFunctionDone);
	}

	function eachFunctionDone () {
		index = index + 1;
		if (index === length) {
			if (finallCallback) {
				finallCallback();
			}
			return;
		} else {
			callNext();
		}
	}

};

// Check if a new cache is available on page load.
window.addEventListener('load', function(e) {
	window.applicationCache.update();
	window.applicationCache.addEventListener('updateready', function(e) {
		if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
			// Browser downloaded a new app cache.
			if (alert('A new version of this site is available. Please reload to see it.')) {
				// window.location.reload();
			}
		} else {
			// Manifest didn't changed. Nothing new to server.
		}
	}, false);

}, false);


window.addEventListener('load', function() {
	FastClick.attach(document.body);
}, false);


//	db.query('test/nextCard',{},function(e,r){
//		var nextCard = r.rows[0].value;
//		console.log(nextCard);
//	});

