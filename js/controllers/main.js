window.DESIGN_DOC_VERSIONING = 10;


if (!localStorage.remoteDbUrl) localStorage.remoteDbUrl = '';

function randomLocalDbName () {
	return "mrflashcard" + Math.floor(Math.random()*10000);
}

if (!localStorage.localDbName) localStorage.localDbName = randomLocalDbName();

window.MainController = ['$rootScope', '$scope', '$timeout', '$location', '$document', function ($rootScope, $scope, $timeout, $location, $document) {
	console.log('MainController');

	$scope.remoteDbUrl = localStorage.remoteDbUrl;

	$document.bind('keypress', function (event) {
		$rootScope.$broadcast('keypress', event);
	});


	$rootScope.booting = true;
	console.log('ios0');
	window.db.get('_design/mrflashcard', function (err, doc) {
		console.log('ios1');
		if (!doc) {
			// Maybe this is the first time
			doc = {
				_id: '_design/mrflashcard',
				versioning: -1
			};
		}
		if (doc.versioning === DESIGN_DOC_VERSIONING) {
			return doneUpdatingDesignDocument();
		}
		console.log('Design Document has new version, updating...');
		doc.versioning = DESIGN_DOC_VERSIONING;
		doc.language = 'javascript';
		doc.views = {
			dueCardsByPriority: {
				map: (function (doc) {
					if (doc.isDue) {
						emit(doc.priority, doc);
					}
				})+''
			},
			notYetDueCards: {
				map: (function (doc) {
					if (!doc.isDue) {
						emit(doc.due, doc);
					}
				})+''
			}
		};


		db.put(doc, function (response) {
			if (response) debugger;
			doneUpdatingDesignDocument();
		});

	});

	function doneUpdatingDesignDocument () {
		console.log('doneUpdatingDesignDocument');
		window.db.compact({}, function () {
			console.log('done compact');
			window.db.viewCleanup({}, function () {
				console.log('done viewCleanup');
				// Now delete conflicted documents
				var changes = window.db.changes({
					include_docs: true,
					conflicts: true,
					returnDocs: false,
					// style:'all_docs' // what is this?
				});

				changes.on('change', function (change) {
					if (!change.doc._conflicts) return; // TODO: filter so we don't walk every object?
					console.log('conflict');
					var conflicts = change.doc._conflicts,
					    id        = change.doc._id;

					for (var i=0,l=conflicts.length;i<l;i++) {
						var conflict = conflicts[i];
						if (conflict === change.doc._rev) {
							throw new Error("Tried to delete the winning document!");
						}
						console.log('deleting conflict ' + conflict + ' for id ' + id);
						window.db.remove(id, conflict);
					}
					// Force save winning one
					console.log('saving wining change ' + change.doc._rev+ ' for id: ' + id)
					window.db.put(change.doc);

				});
				changes.on('complete', function () {
					doneWithEverything();
				});
			});
		});
	}

	function doneWithEverything () {
		$scope.$apply(function () {
			$rootScope.booting = false;
			console.log('saying booted');
			$rootScope.booted = true;
			$rootScope.$emit('bootedOrSynced', true);
		});
	}


	$scope.resetLocalDb = function () {
		window.db.destroy(function(err, info) {
			if (err) {
				alert("Couldn't reset DB!");
			}
			window.location.reload();
		});
	};

	$scope.sync = function() {
		if (!$scope.remoteDbUrl) {
			alert("Remote CouchDB Database required!");
			return;
		}
		localStorage.remoteDbUrl = $scope.remoteDbUrl;
		$rootScope.syncing = true;
		$rootScope._syncProgress = "Starting push...";
		window.sync($scope.remoteDbUrl, $scope, function() {
			$scope.$apply(function() {
				$rootScope.syncing = false;
				$rootScope.$emit('bootedOrSynced', true);
				$scope._syncedRecently = true;
			})
		})
	}

	$scope.syncProgress = function () {
		return $scope._syncProgress;
	};

	$scope.syncedRecently = function () {
		return $scope._syncedRecently;
	}

	$scope.addCards = function () {
		$location.url('/add');
	}

	$scope.furigana = function(stringToSplit) {
		if (!stringToSplit) return;

		stringToSplit = stringToSplit.replace('】', '');

		var splitArray = stringToSplit.split('【');
		if (splitArray.length === 1) {
			splitArray = stringToSplit.split('、');
		}
		var kanji = splitArray[0],
		    kana  = splitArray[1];


		if (!kana) return stringToSplit;

		return window.furigana(kanji, kana) || stringToSplit;

	}


}];