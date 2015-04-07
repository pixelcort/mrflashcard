window.furigana = function (kanji, hiragana) {
	var re = /([\u4E00-\u9FAF]*)([^\u4E00-\u9FAF]*)([\u4E00-\u9FAF]*)([^\u4E00-\u9FAF]*)([\u4E00-\u9FAF]*)([^\u4E00-\u9FAF]*)([\u4E00-\u9FAF]*)([^\u4E00-\u9FAF]*)([\u4E00-\u9FAF]*)([^\u4E00-\u9FAF]*)([\u4E00-\u9FAF]*)([^\u4E00-\u9FAF]*)([\u4E00-\u9FAF]*)([^\u4E00-\u9FAF]*)([\u4E00-\u9FAF]*)([^\u4E00-\u9FAF]*)([\u4E00-\u9FAF]*)([^\u4E00-\u9FAF]*)([\u4E00-\u9FAF]*)([^\u4E00-\u9FAF]*)([\u4E00-\u9FAF]*)([^\u4E00-\u9FAF]*)([\u4E00-\u9FAF]*)([^\u4E00-\u9FAF]*)/;
	var kanjiResults = kanji.match(re);

	// debugger; // What happens when start with hiragana?

	if (!kanjiResults) return;
	kanjiResults.shift(); // First one seems to be useless

	var kanaExpression = '';
	for (var i=0,l=kanjiResults.length;i<l;i++) {
		var kanjiResult = kanjiResults[i];
		// if (!kanjiResult) continue;
		var isKanji = /[\u4E00-\u9FAF]/.test(kanjiResult);
		if (isKanji) {
			kanaExpression += '([\u3040-\u30ff]+)';
		} else {
			kanaExpression += '('+kanjiResult+')';
		}
	}

	kanaExpression = new RegExp(kanaExpression);

	hiraganaResults = hiragana.match(kanaExpression);
	if (!hiraganaResults) return;
	hiraganaResults.shift(); // First one seems to be useless

	var ret = '';

	for (i=0,l=hiraganaResults.length;i<l;i++) {
		var hiraganaResult = hiraganaResults[i];
		kanjiResult = kanjiResults[i];

		if (hiraganaResult === kanjiResult || !kanjiResult) {
			ret += hiraganaResult;
		} else {
			ret += "<ruby>" + kanjiResult + "<rp>(</rp><rt>" + hiraganaResult + "</rt><rp>)</rp></ruby>"
		}
	}

	return ret;
}