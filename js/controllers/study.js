window.DEFAULT_CARD_DIFFICULTY = 2.5;
window.DEFAULT_MIN_DELTA = 1000;
if (!localStorage.minDelta) localStorage.minDelta = DEFAULT_MIN_DELTA / 1000;
if (!localStorage.totalScore) localStorage.totalScore = '0';
window.DEFAULT_CARD_EASINESS = 2.5;
window.MAX_CARD_EASINESS = 9.0;
window.MIN_CARD_EASINESS = 1.1;


window.StudyController = ['$rootScope', '$scope', '$document', function ($rootScope, $scope, $document) {
	console.log('StudyController');

	$scope.minDelta = parseInt(localStorage.minDelta, 10);
	$scope.updateMinDelta = function () {
		localStorage.minDelta = $scope.minDelta;
	};
	$scope.totalScore = parseInt(localStorage.totalScore, 10);
	$scope.updateTotalScore = function (newTotalScore) {
		var currentTotalScore = $scope.totalScore;

		$scope.totalScore = currentTotalScore + newTotalScore;
		$scope.totalScoreLastUpdate = newTotalScore;
		localStorage.totalScore = $scope.totalScore;
	};
	$scope.resetTotalScore = function () {
		$scope.updateTotalScore(-$scope.totalScore);
	}

	$scope.$on('keypress', function(angularEvent, rawEvent) {
		if (rawEvent && rawEvent.target && rawEvent.target.tagName === "INPUT") return;
		var number = rawEvent.which-48;
		if (number === 1 && !$scope.showingAnswers) {
			return $scope.$apply(function() {
				console.log('s');
				$scope.showAnswers();
			});
		}
		if (number === 1 && $scope.noCard) {
			return $scope.$apply(function() {
				$scope.getNextCard();
			});
		}

		if (([1,2,3,4].indexOf(number) > -1) && $scope.showingAnswers) {
			return $scope.$apply(function() {
				if (number === 1) $scope.scoreCard(0);
				if (number === 2) $scope.scoreCard(3);
				if (number === 3) $scope.scoreCard(4);
				if (number === 4) $scope.scoreCard(5);
			})
		}
	});

	$scope.getNextCard = function() {
		console.log('getNextCard');
		delete $scope.card;
		$scope.showingAnswers = false;
		window.getNextCard(function(card) {
			$scope.$apply(function(){
				if (!card) {
					$scope.noCard = true;
					return;
				}
				if (!card.isDue) {
					debugger;
				}
				$scope.noCard = false;
				$scope.card = card;
			});
		});
	}

	$scope.secondsToFormattedString = function (delta) {
		var ret = '', count = 0;
		if (delta < 0) {
			ret += 'negative ';
			delta = Math.abs(delta);
		}
		var days = (Math.floor(delta/(1000*60*60*24)));
		if (days) {
			ret+=days + ' days ';
			delta -= days*1000*60*60*24;
			count++;
		}
		var hours = (Math.floor(delta/(1000*60*60)));
		if (hours) {
			ret+=hours + ' hours ';
			delta -= hours*1000*60*60;
			count++;
		}
		var minutes = (Math.floor(delta/(1000*60)));
		if (minutes && count < 2) {
			ret+=minutes + ' minutes ';
			delta -= minutes*1000*60;
			count++;
		}
		var seconds = (Math.floor(delta/1000));
		if (seconds && count < 2) {
			ret+=seconds + ' seconds ';
			count++;
		}
		if (!ret) {
			ret = '0 seconds';
		}
		return ret;
	};

	$scope.prettyDue = function(card, isPreviousCard) {

		if (!card) return '';
		var now = (new Date()).valueOf(),
		    due = card.due,
		    delta = Math.abs(now-due);

		if (delta > 1000) {
			var ret = $scope.secondsToFormattedString(delta);
			return ret + ((now-due>0) ? ' ago' : ' from now');
		} else {
			return "now";
		}

	};

	// var __everythingForCardIdAndRev = {}, emptyArray = [];
	// $scope.prettyEverything = function() {
	// 	if (!$scope.card) return emptyArray;
	// 	if (__everythingForCardIdAndRev[$scope.card._id+":"+$scope.card._rev]) {
	// 		return __everythingForCardIdAndRev[$scope.card._id+":"+$scope.card._rev];
	// 	}
	// 	var card = $scope.card,
	// 	    ret = [];
	// 	for (var key in card) {
	// 		if (card.hasOwnProperty(key)) {
	// 			ret.push([key, card[key]]);
	// 		}
	// 	}

	// 	__everythingForCardIdAndRev[$scope.card._id+":"+$scope.card._rev] = ret;

	// 	return ret;
	// }

	$scope.cardEncodedId = function () {
		if (!$scope.card) return '';
		return encodeURIComponent($scope.card._id);
	};

	$scope.showAnswers = function () {
		$scope.showingAnswers = true;
	}
	$scope.scoreCard = function (quality) {
		var card = $scope.card,
		    oldCardLast = card.last,
		    oldCardEasiness = card.easiness,
		    oldCardScore = card.score,
		    now = (new Date()).valueOf();

		if (!card.score) card.score = 0;
		if (!oldCardScore) oldCardScore = 0;
		if (!card.easiness) card.easiness = DEFAULT_CARD_EASINESS;
		if (!oldCardEasiness) oldCardEasiness = DEFAULT_CARD_EASINESS; 

		card.easiness = Math.max(MIN_CARD_EASINESS,Math.min(MAX_CARD_EASINESS,card.easiness-0.8+0.28*quality-0.02*quality*quality));

		if (!oldCardLast) oldCardLast = now;
		var delta = Math.max($scope.minDelta*1000, card.due - oldCardLast) * card.easiness;
		console.log('delta was ' + delta);

		// Now that we've used card.last to calculate delta, we can now set a new card.last

		card.last = now;
		card.isDue = false;

		if (quality < 3) {
			card.due = card.last;
			card.isDue = true;
			card.score = 0;
		} else {
			card.due = card.last + delta;
			card.isDue = false;
			card.score += delta;
		}

		card.random = Math.random();


		// TODO save card
		window.db.put(card, function (response) {
			$scope.$apply(function() {
				if (response) debugger;
				$scope.getNextCard();
			})
		});

		var scoreDelta = card.score - oldCardScore;
		$scope.updateTotalScore(scoreDelta);

		$scope.easinessWas = oldCardEasiness;
		$scope.previousCard = card;
		delete $scope.card;

	};

	$scope.updateIsDue = function () {
		console.log('updating isDue...');
		$scope.updatingIsDue = true;
		db.query('mrflashcard/notYetDueCards', {endkey: (new Date()).valueOf()}, function (err, response) {
			if (err) debugger;
			var rows = response.rows,
			    updatedCards = [];
			rows.forEach(function (row) {
				console.log('updating isDue back for ' + row.value._id);
				row.value.isDue = true;
				updatedCards.push(row.value);
			});
			db.bulkDocs(updatedCards, function (err, response) {
				if (err) debugger;
				$scope.$apply(function() {
					console.log('updated isDue!');
					$scope.updatingIsDue = false;
					$scope.getNextCard();
				});
			})
		});
	};
	$rootScope.$on('bootedOrSynced', function () {
		$scope.getNextCard();
	});
	if ($scope.booted) {
		$scope.getNextCard();
	}
}];

