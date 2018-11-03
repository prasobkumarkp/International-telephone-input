(function ($) {
	$.fn.iti = function (options) {
		var settings = {};
		$.extend(true, settings, this.iti.defaults, options);

		return this.each(function () {
			var list = getCountrywisePhonePrefix();
			if (settings.exclusions !== null && settings.exclusions.length > 0)
				list = $.grep(list, function (value) { return $.inArray(value.iso, settings.exclusions) < 0 });

			var iti = {
				input: {}, countryList: {}, selectedItem:null, isCountryListShown: false, isListeningKeyDown: false, query: "", previousQuery: "", log: function (message) { if (settings.showConsoleLog) { console.log("iti : " + message) } }
			};
			iti.target = $(this);

			if (!iti.target.hasClass("iti"))
				iti.target.addClass("iti");

			var details = getItem(settings.defaultSelection.iso, list);
			if (details === null)
				details = getItem("us", list);
			settings.defaultSelection.dialCode = "+" + details.dialCode;

			iti.inputTemplate =
				$("<div class='iti-flag-container'><div class='iti-selected-flag'><div class='iti-flag " +
					details.iso +
					"'></div>" +
					((settings.seperateDialCode) ? "<div class='iti-sep-dial-code'>+" + details.dialCode + "</div>" : "") +
					"<div class='iti-inverted-caret'></div></div></div><input type='text' class='iti-phonenumber'" +
					(iti.target.attr("data-placeholder") !== void (0) ? "placeholder='" + iti.target.attr("data-placeholder") : "") +
					"'/><div class='iti-status'>!</div>");


			iti.countryListTemplate = $("<ul class='iti-country-list'></ul>");
			iti.countryListTemplate.append(
				"<li><input type='text' class='iti-search-box' placeholder='Type to search' style='display:" +
				(settings.enableSearchBox ? 'block' : 'none') +
				"'></li>");

			iti.target.append(iti.inputTemplate);
			$(".iti-flag-container").append(iti.countryListTemplate);

			iti.input.flagContainer = $(iti.target).find(".iti-flag-container");
			iti.input.flag = $(iti.target).find(".iti-flag-container .iti-flag");
			iti.input.dialCode = $(iti.target).find(".iti-flag-container .iti-sep-dial-code");
			iti.input.text = $(iti.target).find(".iti-phonenumber");
			iti.input.status = $(iti.target).find(".iti-status");
			iti.input.searchBox = $(iti.target).find(".iti-search-box");
			iti.countryList.list = iti.input.flagContainer.find(".iti-country-list");

			prepareCountryList(list);

			iti.countryNames = $(iti.countryList.list).find(".iti-country-name");
			iti.countryCodes = $(iti.countryList.list).find(".iti-dial-code");


			iti.keyUpEventHandler = function (e) {
				console.log(e.keyCode);
				if (e.keyCode === 13 && iti.selectItem !== null) {
					iti.selectItem(iti.selectedItem);
					iti.countryList.list.hide();
				} else {
					iti.query += iti.filterKey(e.key),
						iti.searchThroughList(iti.query),
						setTimeout(function() {
								iti.log("query cleared, last value was : " + iti.query),
									iti.query = "";
							},
							settings.searchWaitTime),
						iti.log("key up : " + e.key);
				}
			}

			iti.selectItem = function(item) {
				//if (iti.selectedItem !== null) {

				//}
				var item1 = $(item);
				var iso = item1.attr("data-iso");
				settings.defaultSelection.dialCode = "+" + item1.attr("data-dail-code");
				if (settings.seperateDialCode) {
					iti.input.dialCode.text(settings.defaultSelection.dialCode);
				}
				iti.input.flag.removeClass(settings.defaultSelection.iso).addClass(iso);
				settings.defaultSelection.iso = iso;
				iti.inputChanged();
				iti.input.text.focus();
				iti.listenKeyUp(false);
				iti.log("selected code : " + settings.defaultSelection.dialCode);
			}

			//hide country list.
			iti.bodyClickEventHandler = function (e) {
				if (!$(e.target).closest(iti.input.flagContainer).length) {
					iti.countryList.list.hide();
					iti.log("country list hidden");
					iti.listenKeyUp(false);
					iti.log("requested turn off key listen");
					$("body").off("click", iti.bodyClickEventHandler);
					iti.log("turned off body click listner");
				}
			}
			// listenining to key press on the page
			iti.listenKeyUp = function (flag) {
				iti.log((flag ? "activate" : "not to activate") + " key lsiten function, current status of listening : " + iti.isListeningKeyDown);
				if (flag) {
					if (!iti.isListeningKeyDown) {
						iti.isListeningKeyDown = true;
						iti.log("listeing to keypress");

						$(document).on("keyup", iti.keyUpEventHandler);
						iti.log("turned on body click listner");
					}
				} else {
					if (iti.isListeningKeyDown) {
						$(document).off("keyup",
							iti.keyUpEventHandler);
						iti.isListeningKeyDown = false;
						iti.log("not listeing to keypress");
					}
				}
			}


			//display country list.
			iti.input.flagContainer.on("click",
				function (e) {
					if (!$(e.target).closest(iti.input.searchBox).length) {
						iti.countryList.list.toggle();
						iti.log("toggle country list");
						if (settings.enableSearchBox) {
							iti.input.searchBox.focus();
							iti.log("focused seach box");
						} else {
							if (!$(e.target).closest(iti.input.flagContainer.find("li.iti-list-item")).length) {
								iti.log("requested for key listen");
								iti.listenKeyUp(true);
							}
						}
						$("body").on("click", iti.bodyClickEventHandler);
					}
				});


			// select item from list
			iti.input.flagContainer.find("li.iti-list-item").on("click",
				function () {
					iti.selectItem(this);
				});


			iti.input.flagContainer.find("li.iti-list-item").on("mouseover",
				function (e) {
					debugger;
					iti.highlightItemInList(this);
					iti.selectedItem = e.currentTarget;
				});

			iti.input.text.on("keydown",
				function (e) {
					if ($.inArray(e.keyCode, [46, 8, 9, 27, 13]) !== -1 ||
						(e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
						(e.keyCode >= 35 && e.keyCode <= 40)) {
						return;
					}
					if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
						e.preventDefault();
					}
				});

			iti.input.text.on("keyup",
				function () {
					iti.inputChanged();
				});



			if (settings.enableSearchBox) {
				iti.input.searchBox.on("keyup",
					function (e) {
						var newQuery = iti.input.searchBox.val();
						iti.searchThroughList(newQuery);
					});
			}

			iti.filterKey = function (key) {
				return key;
			}

			iti.searchThroughList = function (newQuery) {
				iti.log("searching for : " + newQuery);
				if (newQuery.length > 0) {
					if (iti.previousQuery !== newQuery) {
						iti.query = newQuery;

						if (iti.query[0] === "+" || parseInt(iti.query[0], 10)) {

							if (iti.query[0] !== "+") {
								iti.query = "+" + iti.query;
								if (settings.enableSearchBox)
									iti.input.searchBox.val(iti.query);
							}

							$(iti.countryCodes).each(function (i, j) {
								if ($(j).text().substring(0, (iti.query.length)).toLocaleLowerCase() === iti.query.toLocaleLowerCase()) {
									iti.log("found matches in country code");
									if (settings.enableSearchBox) {
										$(j).parent("li").show();
									} else {
										iti.scrollToItemInList($(j).parent("li"));
										return false;
									}
								} else {
									if (settings.enableSearchBox)
										$(j).parent("li").hide();
								}
							});

						} else {
							$(iti.countryNames).each(function (i, j) {
								if ($(j).text().substring(0, (iti.query.length)).toLocaleLowerCase() === iti.query.toLocaleLowerCase()) {
									iti.log("found matches in country name");
									if (settings.enableSearchBox) {
										$(j).parent("li").show();
									} else {
										iti.scrollToItemInList($(j).parent("li"));
										return false;
									}
								} else {
									if (settings.enableSearchBox)
										$(j).parent("li").hide();
								}
							});
						}
					}
				} else {
					$(iti.countryCodes).each(function (i, j) {
						$(j).parent("li").show();
					});
				}
			}

			iti.scrollToItemInList = function (item) {

				iti.selectedItem = item;
				if (iti.isListItemInViewPort(item) === false) {
					var target = $(iti.countryList.list);
					var scrollValue = $(item).offset().top - target.offset().top + target.scrollTop();
					target.animate({ scrollTop: scrollValue }, settings.scrollAnimationSpeed);
				}
				iti.highlightItemInList(item);
			}

			iti.isListItemInViewPort = function (item) {
				var container = $(iti.countryList.list);
				var containetTop = container.offset().top;
				var containerBottom = container.outerHeight() + containetTop;
				var itemTop = $(item).offset().top + item.outerHeight();

				var result = (itemTop >= containetTop && (itemTop) <= containerBottom);

				iti.log("itemTop : " + itemTop + " >= containetTop : " + containetTop + " &&  (itemTop : " + itemTop + " - item.outerHeight() :" + item.outerHeight() + ") <= containerBottom : " + containerBottom);
				return result;
			}

			iti.highlightItemInList = function (item) {
				iti.input.flagContainer.find("li.iti-list-item").removeClass("iti-list-item-highlight");
				$(item).addClass("iti-list-item-highlight");
			}

			iti.inputChanged = function () {
				var phoneNumber = settings.defaultSelection.dialCode + iti.input.text.val();
				iti.target.attr("data-phone", phoneNumber);
				iti.input.text.css("padding-left", iti.input.dialCode.width() + 50);

				if (settings.enableErrorIcon && settings.onChange !== null) {
					if (!settings.onChange(phoneNumber)) {
						iti.input.status.show();
					}
				} else if (settings.enableErrorIcon) {
					iti.input.status.show();
				}
			}

			function prepareCountryList(list) {
				$(list).each(function (i, j) {
					iti.countryList.list.append("<li class='iti-list-item' data-iso='" +
						j.iso +
						"' data-dail-code='" +
						j.dialCode +
						"'><div class='iti-country-flag'><div class='iti-flag " +
						j.iso +
						"'></div></div><span class='iti-country-name'>" +
						j.name +
						"</span> <span class='iti-dial-code'>+" +
						j.dialCode +
						"</span></li>");
				});
			}

			function getItem(iso, list) {
				var result = null;
				$(list).each(function (i, j) {
					if (j.iso === iso) {
						result = j;
						return false
					};
				});
				return result;
			}

			//pre-execute
			iti.inputChanged();
		});
	}
	$.fn.iti.defaults = {
		target: ".iti",
		seperateDialCode: true,
		defaultSelection: { iso: "in", dialCode: "" },
		prefrencences: ["us", "in"],
		exclusions: null,
		onChange: null,
		enableErrorIcon: false,
		enableSearchBox: false,
		scrollAnimationSpeed: 0,
		searchWaitTime: 1000,
		showConsoleLog: false
	};
})(jQuery);

function getCountrywisePhonePrefix() {
	for (var a = [["Afghanistan (‫افغانستان‬‎)", "af", "93"], ["Albania (Shqipëri)", "al", "355"], ["Algeria (‫الجزائر‬‎)", "dz", "213"], ["American Samoa", "as", "1684"], ["Andorra", "ad", "376"], ["Angola", "ao", "244"], ["Anguilla", "ai", "1264"], ["Antigua and Barbuda", "ag", "1268"], ["Argentina", "ar", "54"], ["Armenia (Հայաստան)", "am", "374"], ["Aruba", "aw", "297"], ["Australia", "au", "61", 0], ["Austria (Österreich)", "at", "43"], ["Azerbaijan (Azərbaycan)", "az", "994"], ["Bahamas", "bs", "1242"], ["Bahrain (‫البحرين‬‎)", "bh", "973"], ["Bangladesh (বাংলাদেশ)", "bd", "880"], ["Barbados", "bb", "1246"], ["Belarus (Беларусь)", "by", "375"], ["Belgium (België)", "be", "32"], ["Belize", "bz", "501"], ["Benin (Bénin)", "bj", "229"], ["Bermuda", "bm", "1441"], ["Bhutan (འབྲུག)", "bt", "975"], ["Bolivia", "bo", "591"], ["Bosnia and Herzegovina (Босна и Херцеговина)", "ba", "387"], ["Botswana", "bw", "267"], ["Brazil (Brasil)", "br", "55"], ["British Indian Ocean Territory", "io", "246"], ["British Virgin Islands", "vg", "1284"], ["Brunei", "bn", "673"], ["Bulgaria (България)", "bg", "359"], ["Burkina Faso", "bf", "226"], ["Burundi (Uburundi)", "bi", "257"], ["Cambodia (កម្ពុជា)", "kh", "855"], ["Cameroon (Cameroun)", "cm", "237"], ["Canada", "ca", "1", 1, ["204", "226", "236", "249", "250", "289", "306", "343", "365", "387", "403", "416", "418", "431", "437", "438", "450", "506", "514", "519", "548", "579", "581", "587", "604", "613", "639", "647", "672", "705", "709", "742", "778", "780", "782", "807", "819", "825", "867", "873", "902", "905"]], ["Cape Verde (Kabu Verdi)", "cv", "238"], ["Caribbean Netherlands", "bq", "599", 1], ["Cayman Islands", "ky", "1345"], ["Central African Republic (République centrafricaine)", "cf", "236"], ["Chad (Tchad)", "td", "235"], ["Chile", "cl", "56"], ["China (中国)", "cn", "86"], ["Christmas Island", "cx", "61", 2], ["Cocos (Keeling) Islands", "cc", "61", 1], ["Colombia", "co", "57"], ["Comoros (‫جزر القمر‬‎)", "km", "269"], ["Congo (DRC) (Jamhuri ya Kidemokrasia ya Kongo)", "cd", "243"], ["Congo (Republic) (Congo-Brazzaville)", "cg", "242"], ["Cook Islands", "ck", "682"], ["Costa Rica", "cr", "506"], ["Côte d’Ivoire", "ci", "225"], ["Croatia (Hrvatska)", "hr", "385"], ["Cuba", "cu", "53"], ["Curaçao", "cw", "599", 0], ["Cyprus (Κύπρος)", "cy", "357"], ["Czech Republic (Česká republika)", "cz", "420"], ["Denmark (Danmark)", "dk", "45"], ["Djibouti", "dj", "253"], ["Dominica", "dm", "1767"], ["Dominican Republic (República Dominicana)", "do", "1", 2, ["809", "829", "849"]], ["Ecuador", "ec", "593"], ["Egypt (‫مصر‬‎)", "eg", "20"], ["El Salvador", "sv", "503"], ["Equatorial Guinea (Guinea Ecuatorial)", "gq", "240"], ["Eritrea", "er", "291"], ["Estonia (Eesti)", "ee", "372"], ["Ethiopia", "et", "251"], ["Falkland Islands (Islas Malvinas)", "fk", "500"], ["Faroe Islands (Føroyar)", "fo", "298"], ["Fiji", "fj", "679"], ["Finland (Suomi)", "fi", "358", 0], ["France", "fr", "33"], ["French Guiana (Guyane française)", "gf", "594"], ["French Polynesia (Polynésie française)", "pf", "689"], ["Gabon", "ga", "241"], ["Gambia", "gm", "220"], ["Georgia (საქართველო)", "ge", "995"], ["Germany (Deutschland)", "de", "49"], ["Ghana (Gaana)", "gh", "233"], ["Gibraltar", "gi", "350"], ["Greece (Ελλάδα)", "gr", "30"], ["Greenland (Kalaallit Nunaat)", "gl", "299"], ["Grenada", "gd", "1473"], ["Guadeloupe", "gp", "590", 0], ["Guam", "gu", "1671"], ["Guatemala", "gt", "502"], ["Guernsey", "gg", "44", 1], ["Guinea (Guinée)", "gn", "224"], ["Guinea-Bissau (Guiné Bissau)", "gw", "245"], ["Guyana", "gy", "592"], ["Haiti", "ht", "509"], ["Honduras", "hn", "504"], ["Hong Kong (香港)", "hk", "852"], ["Hungary (Magyarország)", "hu", "36"], ["Iceland (Ísland)", "is", "354"], ["India (भारत)", "in", "91"], ["Indonesia", "id", "62"], ["Iran (‫ایران‬‎)", "ir", "98"], ["Iraq (‫العراق‬‎)", "iq", "964"], ["Ireland", "ie", "353"], ["Isle of Man", "im", "44", 2], ["Israel (‫ישראל‬‎)", "il", "972"], ["Italy (Italia)", "it", "39", 0], ["Jamaica", "jm", "1876"], ["Japan (日本)", "jp", "81"], ["Jersey", "je", "44", 3], ["Jordan (‫الأردن‬‎)", "jo", "962"], ["Kazakhstan (Казахстан)", "kz", "7", 1], ["Kenya", "ke", "254"], ["Kiribati", "ki", "686"], ["Kosovo", "xk", "383"], ["Kuwait (‫الكويت‬‎)", "kw", "965"], ["Kyrgyzstan (Кыргызстан)", "kg", "996"], ["Laos (ລາວ)", "la", "856"], ["Latvia (Latvija)", "lv", "371"], ["Lebanon (‫لبنان‬‎)", "lb", "961"], ["Lesotho", "ls", "266"], ["Liberia", "lr", "231"], ["Libya (‫ليبيا‬‎)", "ly", "218"], ["Liechtenstein", "li", "423"], ["Lithuania (Lietuva)", "lt", "370"], ["Luxembourg", "lu", "352"], ["Macau (澳門)", "mo", "853"], ["Macedonia (FYROM) (Македонија)", "mk", "389"], ["Madagascar (Madagasikara)", "mg", "261"], ["Malawi", "mw", "265"], ["Malaysia", "my", "60"], ["Maldives", "mv", "960"], ["Mali", "ml", "223"], ["Malta", "mt", "356"], ["Marshall Islands", "mh", "692"], ["Martinique", "mq", "596"], ["Mauritania (‫موريتانيا‬‎)", "mr", "222"], ["Mauritius (Moris)", "mu", "230"], ["Mayotte", "yt", "262", 1], ["Mexico (México)", "mx", "52"], ["Micronesia", "fm", "691"], ["Moldova (Republica Moldova)", "md", "373"], ["Monaco", "mc", "377"], ["Mongolia (Монгол)", "mn", "976"], ["Montenegro (Crna Gora)", "me", "382"], ["Montserrat", "ms", "1664"], ["Morocco (‫المغرب‬‎)", "ma", "212", 0], ["Mozambique (Moçambique)", "mz", "258"], ["Myanmar (Burma) (မြန်မာ)", "mm", "95"], ["Namibia (Namibië)", "na", "264"], ["Nauru", "nr", "674"], ["Nepal (नेपाल)", "np", "977"], ["Netherlands (Nederland)", "nl", "31"], ["New Caledonia (Nouvelle-Calédonie)", "nc", "687"], ["New Zealand", "nz", "64"], ["Nicaragua", "ni", "505"], ["Niger (Nijar)", "ne", "227"], ["Nigeria", "ng", "234"], ["Niue", "nu", "683"], ["Norfolk Island", "nf", "672"], ["North Korea (조선 민주주의 인민 공화국)", "kp", "850"], ["Northern Mariana Islands", "mp", "1670"], ["Norway (Norge)", "no", "47", 0], ["Oman (‫عُمان‬‎)", "om", "968"], ["Pakistan (‫پاکستان‬‎)", "pk", "92"], ["Palau", "pw", "680"], ["Palestine (‫فلسطين‬‎)", "ps", "970"], ["Panama (Panamá)", "pa", "507"], ["Papua New Guinea", "pg", "675"], ["Paraguay", "py", "595"], ["Peru (Perú)", "pe", "51"], ["Philippines", "ph", "63"], ["Poland (Polska)", "pl", "48"], ["Portugal", "pt", "351"], ["Puerto Rico", "pr", "1", 3, ["787", "939"]], ["Qatar (‫قطر‬‎)", "qa", "974"], ["Réunion (La Réunion)", "re", "262", 0], ["Romania (România)", "ro", "40"], ["Russia (Россия)", "ru", "7", 0], ["Rwanda", "rw", "250"], ["Saint Barthélemy (Saint-Barthélemy)", "bl", "590", 1], ["Saint Helena", "sh", "290"], ["Saint Kitts and Nevis", "kn", "1869"], ["Saint Lucia", "lc", "1758"], ["Saint Martin (Saint-Martin (partie française))", "mf", "590", 2], ["Saint Pierre and Miquelon (Saint-Pierre-et-Miquelon)", "pm", "508"], ["Saint Vincent and the Grenadines", "vc", "1784"], ["Samoa", "ws", "685"], ["San Marino", "sm", "378"], ["São Tomé and Príncipe (São Tomé e Príncipe)", "st", "239"], ["Saudi Arabia (‫المملكة العربية السعودية‬‎)", "sa", "966"], ["Senegal (Sénégal)", "sn", "221"], ["Serbia (Србија)", "rs", "381"], ["Seychelles", "sc", "248"], ["Sierra Leone", "sl", "232"], ["Singapore", "sg", "65"], ["Sint Maarten", "sx", "1721"], ["Slovakia (Slovensko)", "sk", "421"], ["Slovenia (Slovenija)", "si", "386"], ["Solomon Islands", "sb", "677"], ["Somalia (Soomaaliya)", "so", "252"], ["South Africa", "za", "27"], ["South Korea (대한민국)", "kr", "82"], ["South Sudan (‫جنوب السودان‬‎)", "ss", "211"], ["Spain (España)", "es", "34"], ["Sri Lanka (ශ්‍රී ලංකාව)", "lk", "94"], ["Sudan (‫السودان‬‎)", "sd", "249"], ["Suriname", "sr", "597"], ["Svalbard and Jan Mayen", "sj", "47", 1], ["Swaziland", "sz", "268"], ["Sweden (Sverige)", "se", "46"], ["Switzerland (Schweiz)", "ch", "41"], ["Syria (‫سوريا‬‎)", "sy", "963"], ["Taiwan (台灣)", "tw", "886"], ["Tajikistan", "tj", "992"], ["Tanzania", "tz", "255"], ["Thailand (ไทย)", "th", "66"], ["Timor-Leste", "tl", "670"], ["Togo", "tg", "228"], ["Tokelau", "tk", "690"], ["Tonga", "to", "676"], ["Trinidad and Tobago", "tt", "1868"], ["Tunisia (‫تونس‬‎)", "tn", "216"], ["Turkey (Türkiye)", "tr", "90"], ["Turkmenistan", "tm", "993"], ["Turks and Caicos Islands", "tc", "1649"], ["Tuvalu", "tv", "688"], ["U.S. Virgin Islands", "vi", "1340"], ["Uganda", "ug", "256"], ["Ukraine (Україна)", "ua", "380"], ["United Arab Emirates (‫الإمارات العربية المتحدة‬‎)", "ae", "971"], ["United Kingdom", "gb", "44", 0], ["United States", "us", "1", 0], ["Uruguay", "uy", "598"], ["Uzbekistan (Oʻzbekiston)", "uz", "998"], ["Vanuatu", "vu", "678"], ["Vatican City (Città del Vaticano)", "va", "39", 1], ["Venezuela", "ve", "58"], ["Vietnam (Việt Nam)", "vn", "84"], ["Wallis and Futuna", "wf", "681"], ["Western Sahara (‫الصحراء الغربية‬‎)", "eh", "212", 1], ["Yemen (‫اليمن‬‎)", "ye", "967"], ["Zambia", "zm", "260"], ["Zimbabwe", "zw", "263"], ["Åland Islands", "ax", "358", 1]], i = 0; i < a.length; i++) { var n = a[i]; a[i] = { name: n[0], iso: n[1], dialCode: n[2], priority: n[3] || 0, areaCodes: n[4] || null } }
	return a;
};