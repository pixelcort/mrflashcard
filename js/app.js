
window.app = angular.module('mrFlashcard', ['ngRoute','ngSanitize']);

app.config(['$routeProvider', function ($routeProvider) {
	$routeProvider.when('/', {templateUrl:'html/study.html', controller: 'StudyController'}); // todo
	$routeProvider.when('/add', {templateUrl:'html/addCards.html', controller: 'AddCardsController'});
	$routeProvider.when('/edit/:id', {templateUrl:'html/editCard.html', controller: 'EditCardController'});
}]);

app.controller('MainController', window.MainController);
app.controller('StudyController', window.StudyController);
app.controller('AddCardsController', window.AddCardsController);
app.controller('EditCardController', window.EditCardController);

