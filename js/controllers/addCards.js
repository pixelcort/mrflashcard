window.AddCardsController = ['$rootScope', '$scope', '$location', function ($rootScope, $scope, $location) {
	console.log('AddCardsController');

	$scope.questionType = 'Japanese with Furigana';
	$scope.answerType = 'English';

	$scope.alsoCreateInverseCards = true;
	$scope.items = [
		{
			questions: [{value:'私、わたし'},{value:'俺、おれ'}],
			answers: [{value:'Me'}]
		}
	];


	$scope.addAnotherItem = function () {
		$scope.items.push({
			questions: [{value:''}],
			answers: [{value:''}]
		});
	};
	$scope.removeItem = function (index) {
		$scope.items.splice(index, 1);
	}



	$scope.addAnotherQuestion = function(item) {
		item.questions.push({value:''});
	};
	$scope.removeQuestion = function (item, index) {
		item.questions.splice(index, 1);
	}
	$scope.addAnotherAnswer = function(item) {
		item.answers.push({value:''});
	};
	$scope.removeAnswer = function (item, index) {
		item.answers.splice(index, 1);
	}

	$scope.uploadSpreadsheet = function () {
		if (!window.FileReader) return alert('Your browser does not support FileReader!');
		var input = document.getElementById('file_upload')
		input.click();
		console.log('setting event handler');
		var changeEventListener = function () {
			input.removeEventListener('change', changeEventListener);
			console.log('changed');

			// input.files , file.type
			asyncForEach(input.files, function (file) {
				if (file.type !== 'text/csv') return alert('File must be CSV, skipping!');

			var reader = new FileReader();
			reader.onload = function(event) {
				var data = this.result;
				var csv = d3.csv.parseRows(data); // d3.csv.parse expects first row to contain column names
				// Get the columns (can be used later when more than two columns?)
				// var columns = d3.csv.parseRows(data.split('\n')[0])[0];

				$scope.$apply(function () {
					csv.forEach(function (row) {
						var rawQuestions = row[0],
						    rawAnswers   = row[1];
						var questions = rawQuestions.split(', ').map(function(question) {return {value:question};}),
						    answers   = rawAnswers.split(', ').map(function(answer)   {return {value:answer};  });

						console.log('pushing item');
						$scope.items.push({
							questions: questions,
							answers: answers
						});

					});

				});

			};
			reader.readAsText(file);

			}, function () {
				console.log('Done importing CSVs!');
				// debugger; // Parsed all files
			});

		};
		input.addEventListener('change', changeEventListener);
	};


	function createCards(questionType, questions, answerType, answers) {
		var newCards = [];
		questions.forEach(function(question) {
			var newCard = {
				_id: [questionType, question, answerType].join(':'),
				questionType: questionType,
				question: question,
				answerType: answerType,
				answers: answers
				// priority, due and isDue will be determined during upsert
			};
			newCards.push(newCard);
		});
		return newCards;
	}

	$scope.addCards = function () {
		var questionType = $scope.questionType,
		    answerType = $scope.answerType,
		    alsoCreateInverseCards = $scope.alsoCreateInverseCards,
		    newCards = [];

		// Reverse a copy so that cards near the top have higher priority
		$scope.items.slice(0).reverse().forEach(function (item) {
			var questions = item.questions.map(function (question) {return question.value;}),
			    answers   = item.answers.map(  function (answers)  {return answers.value; });

			newCards = newCards.concat(createCards(questionType, questions, answerType, answers));
			if (alsoCreateInverseCards) {
				newCards = newCards.concat(createCards(answerType, answers, questionType, questions));
			}
		});

		asyncForEach(newCards, function (newCard, next) {
			window.db.get(newCard._id, function (err, oldCard) {
				var resetPriority = false,
				    resetDue = false;

				// Temporarily force resetPriority and resetDue on
				resetPriority = true;
				resetDue = true;

				if (!oldCard) { // This is a new card
					oldCard = newCard;
					resetPriority = true;
					resetDue = true;
				}

				if (oldCard._rev) {
					newCard._rev = oldCard._rev;
				}

				if (!oldCard.answers) {
					oldCard.answers = [];
				}

				if (oldCard.answers.length) {
					oldCard.answers.forEach(function(oldAnswer) {
						if (newCard.answers.indexOf(oldAnswer) === -1) {
							newCard.answers.push(oldAnswer);
						}
					});
				}

				if (oldCard.answers.length !== newCard.answers.length) {
					resetPriority = true;
					resetDue = true;
				}

				if (resetPriority) {
					newCard.priority = (new Date()).valueOf();
				} else {
					newCard.priority = (oldCard.priority) || (new Date()).valueOf();
				}

				if (resetDue) {
					newCard.due = (new Date()).valueOf();
					newCard.isDue = true;
				} else {
					newCard.due = oldCard.priority || (new Date()).valueOf();
					newCard.isDue = (typeof oldCard.isDue === 'boolean') ? oldCard.isDue : true;
				}


				// Transfer any additional keys
				for (var otherKey in oldCard) {
					if (oldCard.hasOwnProperty(otherKey)) {
						if (!newCard.hasOwnProperty(otherKey)) {
							newCard[otherKey] = oldCard[otherKey];
							console.log('transferring ' + otherKey + ' to new card');
						}
					}
				}


				window.db.put(newCard, function (response) {
					// careful! sometimes pouchdb will treat the second argument to db.put as _rev and not _id !
					console.log('sucesfully newCard: ' + newCard._id);
					next();
				})
			});

		}, function () {
			console.log('redirect');
			$scope.$apply(function () {
				$location.url('/');
			})
		})
	}
}];
