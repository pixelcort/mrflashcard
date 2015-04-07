window.EditCardController = ['$rootScope', '$scope', '$location', '$routeParams', '$timeout', function ($rootScope, $scope, $location, $routeParams, $timeout) {
	var id = $routeParams.id;

	console.log('EditCardController: ' + id);
	$scope.id = id;

	function save (returnAfter) {
		if ($scope.saving) {
			return console.log('tried to save while already saving; ignored');
		}
		$scope.saving = true;
		if ($scope.card.answers.length) {
			window.db.put($scope.card, function (error, response) {
				if (error) throw new Error(error);
				$scope.$apply(function () {
					$scope.card._rev = response.rev;
					$scope.saving = false;
					if (returnAfter) {
						$location.url('/');
					}
				});
			});
		} else {
			// Delete the document
			window.db.remove({
				_id:  $scope.card._id,
				_rev: $scope.card._rev
			}, function (error, response) {
				if (error) throw new Error(error);
				$scope.$apply(function () {
					$scope.saving = false;
					$location.url('/');
				})
			});
		}
	}

	$scope.addAnswer = function () {
		var newAnswer = $scope.newAnswer;
		$scope.newAnswer = '';
		$scope.card.answers.push(newAnswer);
		save();
	};

	$scope.deleteAnswer = function (answerIndex) {
		console.log('deleteAnswer: ' + answerIndex);
		$scope.card.answers.splice(answerIndex, 1);
		save();
	};

	$scope.deleteCard = function () {
		$scope.card.answers = [];
		save();
	};

	var updateCardTimeout,
	    needsAnotherSave;
	$scope.updateCard = function () {
		console.log('updateCard');
		if ($scope.saving) {
			console.log('tried to updateCard while saving; ignored');
			return;
		}
		if (updateCardTimeout) $timeout.cancel(updateCardTimeout);
		updateCardTimeout = $timeout(function () {
			save();
		}, 100);
	};

	$scope.otherCards = function () {
		var cards = $scope.allOtherCards || [],
		    ret = [];

		if (cards.ret) return cards.ret;

		var i=0,l=cards.length;
		while (i<l) {
			var card = cards[i];
			ret.push({
				isCard:true,
				index:i,
				card:card
			});
			i = (i+1)*2-1;
			ret.push({
				isButton:true,
				lowerCard:card,
				upperCard:cards[i]
			});
		}

		cards.ret = ret;
		return ret;
	};

	$scope.changePriorityBetween = function (lowerCard, upperCard) {
		var aOC = $scope.allOtherCards,
		    newRange, newPriority;
		if (upperCard) {
			newRange = $scope.allOtherCards.slice(aOC.indexOf(lowerCard), aOC.indexOf(upperCard)+1);
		} else {
			newRange = $scope.allOtherCards.slice(aOC.indexOf(lowerCard));
		}
		if (newRange.length > 2) {
			console.log('new allOtherCards');
			$scope.allOtherCards = newRange;
		} else {
			if (upperCard) {
				newPriority = (upperCard.priority + ((lowerCard.priority-upperCard.priority)/2));
			} else {
				debugger;
				newPriority = lowerCard.priority - 1;
			}
			$scope.card.priority = newPriority;
			console.log('saving new priority');
			save(true);
		}
	};

	function loadCard () {
		window.db.get(id, function (err, doc) {
			$scope.$apply(function () {
				if (err) return console.log(err);
				$scope.card = doc;
			});
		});

		// Also load all cards
		window.db.query(DUE_CARDS_BY_PRIORITY_QUERY, {descending:true}, function (error, result) {
			if (error) throw error;
			$scope.$apply(function () {
				$scope.allOtherCards = result.rows.map(function (row) {return row.value;});
			});
		});
	}

	$rootScope.$on('bootedOrSynced', function () {
		loadCard();
	});
	if ($scope.booted) {
		loadCard();
	}
}];
