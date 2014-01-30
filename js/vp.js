///////////////////////////////////////////////////////////////////////////////
// play state variables
///////////////////////////////////////////////////////////////////////////////

// NOTE: haven't really abstracted away where this could change
var HANDCARDS = 5;
var DEFAULT_BET_AMOUNT = 2.00;

var PATH_TO_CARDS = "./images/cards/";

//var BASEURL = "http://localhost/BC.VideoPoker"; // base url for making server calls local = ".."
var BASEURL = "http://bengalcore.azurewebsites.net";

var mPlayStats = new PlayStats();
var mAvailableGames;		// vp.vm.GameInfo[]
var mActiveGame;			// vp.vm.GameInfo
var mActiveUser;			// vp.vm.UserInfo
var mActiveDeck;			// CardInfo[] : available deck cards
var mActiveHand;			// CardInfo[] : current hand
var mdCurrentBetAmount = DEFAULT_BET_AMOUNT;
var mbCreateAccountMode = true; // create vs modify mode for an account
var lastResultsValue = "";

// available state values
// none			- not initiialized yet
// pending		- working/waiting
// ready		- between hands
// discard1		- hand has been dealt. waiting for second deal.
// discard2		- hand has been dealt. one discard has occurred. waiting on third deal.
var msState = "none";		// current state

// available results modes
// results		- default
// userStats
// gameStats
// gamePayoff
// generalHelp
var msResultsMode = "results";


///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//// ajax calls to the server
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// gets the list of available video poker games, and detail info for each one
///////////////////////////////////////////////////////////////////////////////
function CallGetAvailablePokerGames(onComplete) {

	var callurl = BASEURL + '/api/dealer/games';
	var results = [];

	$.ajax({
		url: callurl, //callurl.replace("{0}", userID),
		type: 'GET',
		//crossDomain: true, // not really sure if i need this or not
		headers: { "Accept": "application/json" },
		dataType: 'json',
		error: function (xhr, textStatus, errorThrown) {
			ShowError(xhr.responseText + '-' + errorThrown);
			DisableAll(true);
		},
		success: function (data, textStatus, xhr) {
			for (var i = 0; i < data.length; i++) {
				results.push(new GameInfo(data[i]));
			};
			onComplete(results);
		}
	});
}

///////////////////////////////////////////////////////////////////////////////
// gets a user based on guid. this version uses the POST action.
///////////////////////////////////////////////////////////////////////////////
function CallGetUserFromGuid(guid, onComplete) {
	var callurl = BASEURL + '/api/User/ByID';
	var jsonGuid = JSON.stringify({ ID: guid });

	$.ajax({
		url: callurl,
		type: 'POST',
		data: jsonGuid,
		contentType: "application/json",
		error: function (xhr, textStatus, errorThrown) {
			ShowError(xhr.responseText + '-' + errorThrown);
		},
		success: function (data, textStatus, xhr) {
			onComplete(data);
		}
	});
}

///////////////////////////////////////////////////////////////////////////////
// gets a user based on login information. this version uses the POST action.
///////////////////////////////////////////////////////////////////////////////
function CallGetUserFromLogin(nickname, password, onComplete) {
	var callurl = BASEURL + '/api/User/ByLogin';
	var jsonArgs = JSON.stringify({
		NickName: nickname,
		Password: password
	});

	$.ajax({
		url: callurl,
		type: 'POST',
		crossDomain: true, 
		data: jsonArgs,
		dataType: 'json',
		headers: { "Accept": "application/json" },
		contentType: "application/json",
		error: function (xhr, textStatus, errorThrown) {
			ShowError(xhr.responseText + '-' + errorThrown);
		},
		success: function (data, textStatus, xhr) {
			onComplete(data);
		}
	});
}

///////////////////////////////////////////////////////////////////////////////
// creates a new user on the server
// userInfo = vp.vm.UserInfo
///////////////////////////////////////////////////////////////////////////////
function CallAddUser(userInfo, onComplete) {
	var callurl = BASEURL + '/api/User/AddUser';
	var jsonArgs = JSON.stringify(userInfo);

	$.ajax({
		url: callurl,
		type: 'POST',
		data: jsonArgs,
		contentType: "application/json",
		error: function (xhr, textStatus, errorThrown) {
			ShowError(xhr.responseText + '-' + errorThrown);
		},
		success: function (data, textStatus, xhr) {
			onComplete(data);
		}
	});
}

///////////////////////////////////////////////////////////////////////////////
// update information for this user on the server
/*
{
	UserID: mActiveUser.UserID,
	FirstName: $("#txtAccountFirst").val(),
	LastName: $("#txtAccountLast").val(),
	Nickname: $("#txtAccountNickname").val(),
	Password: $("#txtAccountPassword").val(),
	Email: $("#txtAccountEmail").val()
}
 */
///////////////////////////////////////////////////////////////////////////////
function CallUpdateUser(userInfo, onComplete) {
	var callurl = BASEURL + '/api/User/UpdateUser';
	var jsonArgs = JSON.stringify(userInfo);

	$.ajax({
		url: callurl,
		type: 'POST',
		data: jsonArgs,
		contentType: "application/json",
		error: function (xhr, textStatus, errorThrown) {
			ShowError(xhr.responseText + '-' + errorThrown);
		},
		success: function (data, textStatus, xhr) {
			onComplete(data);
		}
	});
}

///////////////////////////////////////////////////////////////////////////////
// Sets user preferences to the server
//		userID = guid
//		prefs = [ { Name, Value } ]
///////////////////////////////////////////////////////////////////////////////
function CallPostSetUserPreferences(userID, prefs) {
	var callurl = BASEURL + '/api/User/SetPrefs';
	var jsonArgs = JSON.stringify({
		UserID: userID,
		Preferences: prefs
	});

	$.ajax({
		url: callurl,
		type: 'POST',
		data: jsonArgs,
		contentType: "application/json",
		error: function (xhr, textStatus, errorThrown) {
			ShowError(xhr.responseText + '-' + errorThrown);
		},
		success: function (data, textStatus, xhr) {
			//onComplete();
		}
	});
}

///////////////////////////////////////////////////////////////////////////////
// Gets statistics for one game one user
///////////////////////////////////////////////////////////////////////////////
function CallGetGameStats(userID, gameID, onComplete) {
	var callurl = BASEURL + '/api/User/GameStats';
	var jsonArgs = JSON.stringify({
		UserID: userID,
		GameID: gameID
	});

	$.ajax({
		url: callurl,
		type: 'POST',
		data: jsonArgs,
		contentType: "application/json",
		error: function (xhr, textStatus, errorThrown) {
			ShowError(xhr.responseText + '-' + errorThrown);
		},
		success: function (data, textStatus, xhr) {
			onComplete(data);
		}
	});

}

///////////////////////////////////////////////////////////////////////////////
// Calls StartHand on the server, which returns the starting deck
///////////////////////////////////////////////////////////////////////////////
function CallStartHand(betAmount, onComplete) {
	var callurl = BASEURL + '/api/Dealer/StartHand';
	var jsonArgs = JSON.stringify({
		UserID: mActiveUser.UserID,
		Mode: mActiveGame.GameID,
		BetAmount: betAmount,
	});

	$.ajax({
		url: callurl,
		type: 'POST',
		data: jsonArgs,
		contentType: "application/json",
		error: function (xhr, textStatus, errorThrown) {
			ShowError(xhr.responseText + '-' + errorThrown);
		},
		success: function (data, textStatus, xhr) {
			onComplete(data);
		}
	});
}

///////////////////////////////////////////////////////////////////////////////
// Calls CompleteHand on the server, which returns the results of the hand
///////////////////////////////////////////////////////////////////////////////
function CallCompleteHand(betAmount, onComplete) {
	var callurl = BASEURL + '/api/Dealer/CompleteHand';
	var jsonArgs = JSON.stringify({
		UserID: mActiveUser.UserID,
		Mode: mActiveGame.GameID,
		BetAmount: betAmount,
		Hand: mActiveHand
	});

	$.ajax({
		url: callurl,
		type: 'POST',
		data: jsonArgs,
		contentType: "application/json",
		error: function (xhr, textStatus, errorThrown) {
			ShowError(xhr.responseText + '-' + errorThrown);
		},
		success: function (data, textStatus, xhr) {
			onComplete(data);
		}
	});
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//// calls related to available poker games / types
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// sets the array of available games, and populates the popup display for
// selecting the active game
///////////////////////////////////////////////////////////////////////////////
function SetupAvailableGames(games) {
	mAvailableGames = games;

	for ( var i = 0; i < games.length; i++ ) {
		var game = games[i];
		var s = "<button id='game" + i + "' onclick='SelectGame(" + i + ")'>" + game.Name + "</button><br/>";
		$(s).appendTo("#popupGameSelector");
	}
}

///////////////////////////////////////////////////////////////////////////////
// sets the active game (internally and on form)
///////////////////////////////////////////////////////////////////////////////
function SetActiveGame(game) {
	mActiveGame = game;

	$("#btnGameType").html(game.Name);
	ShowGameSelectionPopup(false);
}

///////////////////////////////////////////////////////////////////////////////
// same as above, but by index. Called by popup menu items.
///////////////////////////////////////////////////////////////////////////////
function SelectGame(index) {
	SetActiveGame(mAvailableGames[index]);
	SaveCurrentGame();
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//// calls related to user accounts / logging in
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

function ShowWaitCursor(bShow) {
	var show = (bShow) ? "block" : "none";
	$("#popupWaitCursor").css("display", show);
}

function ShowLoginPopup(bShow) {
	var show = ( bShow ) ? "block" : "none";
	$("#popupLogin").css("display", show);
}

function ShowAccountPopup(bShow) {
	var show = (bShow) ? "block" : "none";
	$("#popupAccount").css("display", show);
}

function ShowGameSelectionPopup(bShow) {
	var show = (bShow) ? "block" : "none";
	$("#popupGameSelector").css("display", show);
}

function SetLoginErrorString(s) {
	$("#loginErrorLabel").text(s);
}

function SetAccountErrorString(s) {
	$("#accountErrorLabel").text(s);
}

function ValidateAccountInput() {
	var bok = TestInput("#txtAccountFirst", 3) &&
		TestInput("#txtAccountLast", 3) &&
		TestInput("#txtAccountNickname", 3) &&
		TestInput("#txtAccountEmail", 6) &&
		TestInput("#txtAccountPassword1", 5) &&
		TestInput("#txtAccountPassword2", 5);

	if ( !bok ) {
		SetAccountErrorString("Value is too short, operation cancelled");
		return false;
	}

	var pswd1 = $("#txtAccountPassword1").val();
	var pswd2 = $("#txtAccountPassword2").val();

	if ( pswd1 != pswd2 ) {
		$("#txtAccountPassword1").addClass("inputErrorState");
		$("#txtAccountPassword2").addClass("inputErrorState");
		SetAccountErrorString("Password mismatch");
		return false;
	}
	else {
		$("#txtAccountPassword1").removeClass("inputErrorState");
		$("#txtAccountPassword2").removeClass("inputErrorState");
	}

	// TODO: password strength checks

	return bok;
}

// tests input for a textbox for minimum length input.
// changes the class on the textbox on error
function TestInput(id, minlength) {
	var txtValue = $(id).val();
	if (txtValue.length < minlength) {
		$(id).addClass("inputErrorState");
		return false;
	}
	else {
		$(id).removeClass("inputErrorState");
		return true;
	}
}

// set current user
function SetActiveUser(user) {
	mActiveUser = user;
	ReadUserPreferences(user);
	ShowBankAmount();
	ShowUserInfo();
	SaveActiveUser();
}



///////////////////////////////////////////////////////////////////////////////
// perform a login with the given information, and all that entails
///////////////////////////////////////////////////////////////////////////////
function Login(nickname, password) {

	SetLoginErrorString("");

	CallGetUserFromLogin(nickname, password, function(results) {

		if ( !results.TransactionSucceeded ) {
			SetLoginErrorString("Error: " + results.FailureInfo);
			return;
		}

		SetActiveUser(results.User);

		// close the login popup
		SetLoginErrorString("");
		ShowLoginPopup(false);
		ShowResults("Welcome " + nickname, "results");

		// we should be ready to play at this point
		SetReady();
	});
}

// if a refresh is called, we already know our active user
function CheckForExistingUser() {
	var userID = ReadActiveUserId();
	if ( userID == null ) return;

	CallGetUserFromGuid(userID, function (results) {
		if ( !results.TransactionSucceeded ) {
			ShowError(results.FailureInfo);
			return;
		}

		SetActiveUser(results.User);

		// close the login popup
		ShowLoginPopup(false);

		// we should be ready to play at this point
		SetReady();
	});
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// click event handlers (main window)
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

function btnGameType_OnClick() {
	ShowGameSelectionPopup(true);
}

function btnUser_OnClick() {
	mbCreateAccountMode = false;

	// set the account popup for updating
	$("#popupAccountTitle").text("Update User Account Information");
	$("#btnAccountSubmit").text("UPDATE");
	$("#btnAccountLogout").css("visibility", "visible");

	// set the values into the text boxes
	$("#txtAccountFirst").val(mActiveUser.FirstName);
	$("#txtAccountLast").val(mActiveUser.LastName);
	$("#txtAccountNickname").val(mActiveUser.Nickname);
	$("#txtAccountPassword1").val(mActiveUser.Password);
	$("#txtAccountPassword2").val(mActiveUser.Password);
	$("#txtAccountEmail").val(mActiveUser.Email);

	// show the account popup
	ShowAccountPopup(true);

}

function btnBank_OnClick() {
}

function btnDeal_OnClick() {
	switch ( msState ) {
		case "ready":
			StartHand();
			break;

		case "discard1":
			if ( mActiveGame.GameHas2Draws ) {
				MoveToNextDiscard();
			}
			else {
				CompleteHand();
			}
			break;

		case "discard2":
			CompleteHand();
			break;
	}
}

function btnResults_OnClick() {
	if ( mActiveUser == null ) return;

	var newMode = "results";
	switch ( msResultsMode ) {
		case "results":
			lastResultsValue = $("#btnResults").html();
			newMode = "gameStats";
			break;
		case "userStats":
			break;
		case "gameStats":
			newMode = "gamePayoff";
			break;
		case "gamePayoff":
			newMode = "generalHelp";
			break;
		case "generalHelp":
			newMode = "results";
			break;
	}
	switch ( newMode ) {
		case "results":
			ShowResults(lastResultsValue, "results");
			break;
		case "userStats":
			break;
		case "gameStats":
			CallGetGameStats(mActiveUser.UserID, mActiveGame.GameID, function (results) {
				if ( results.TransactionSucceeded ) {
					ShowResults(FormatGameStats(results.Stats), "gameStats");
				}
				else {
					ShowResults("Could not get retrieve statistics", "gameStats");
				}
			});
			break;
		case "gamePayoff":
			var helpvar = "game" + mActiveGame.GameID + "help";
			var helpstring = window[helpvar]; // that's pretty cool
			ShowResults(helpstring, "gamePayoff");
			break;
		case "generalHelp":
			ShowResults(generalhelp, "generalHelp");
			break;
	}
}

function btnBet_OnClick() {
}

function btnBetPlus_OnClick() {
	if ( mActiveUser != null ) {
		if ( (mdCurrentBetAmount + 1) < mActiveUser.Bank ) {
			mdCurrentBetAmount++;
			ShowBetAmount();
			SaveCurrentBetAmount();
		}
	}
}

function btnBetMinus_OnClick() {
	if ( mActiveUser != null ) {
		if ( (mdCurrentBetAmount - 1) >= 1 ) {
			mdCurrentBetAmount--;
			ShowBetAmount();
			SaveCurrentBetAmount();
		}
	}
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// login popup event handlers
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

function btnLoginSubmit_OnClick() {

	var bok = TestInput("#txtLoginName", 3) &&
		TestInput("#txtLoginPassword", 5);

	if ( !bok ) {
		SetLoginErrorString("Input error - insufficient text length");
		return;
	}

	var name = $("#txtLoginName").val();
	var pswd = $("#txtLoginPassword").val();

	Login(name, pswd);
}

function btnLoginCreate_OnClick() {
	// set up the account popup for creating a new account
	mbCreateAccountMode = true;
	$("#popupAccountTitle").text("Create New User Account");
	$("#btnAccountSubmit").html("CREATE");

	$("#btnAccountLogout").css("visibility", "hidden");

	// clear the fields in the create account popup
	$("#txtAccountFirst").val("");
	$("#txtAccountLast").val("");
	$("#txtAccountNickname").val("");
	$("#txtAccountPassword1").val("");
	$("#txtAccountPassword2").val("");
	$("#txtAccountEmail").val("");

	$("#txtAccountFirst").removeClass("inputErrorState");
	$("#txtAccountLast").removeClass("inputErrorState");
	$("#txtAccountNickname").removeClass("inputErrorState");
	$("#txtAccountPassword1").removeClass("inputErrorState");
	$("#txtAccountPassword2").removeClass("inputErrorState");
	$("#txtAccountEmail").removeClass("inputErrorState");
	SetAccountErrorString("");


	// show the account popup, hide the login popup
	ShowAccountPopup(true);
	ShowLoginPopup(false);
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// create account popup event handlers
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

function btnAccountSubmit_OnClick() {

	SetAccountErrorString("");
	if ( !ValidateAccountInput() ) return;

	if ( mbCreateAccountMode ) {

		// create a new account and set that to the active user
		CallAddUser({
			FirstName: $("#txtAccountFirst").val(),
			LastName:  $("#txtAccountLast").val(),
			Nickname:  $("#txtAccountNickname").val(),
			Password:  $("#txtAccountPassword1").val(),
			Email:     $("#txtAccountEmail").val()
		}, function (results) {
			if  ( !results.TransactionSucceeded ) {
				SetAccountErrorString("Error: " + results.FailureInfo)
				return;
			}

			SetActiveUser(results.User);
			ShowAccountPopup(false);
			ShowLoginPopup(false);

			ShowResults("Welcome " + results.User.Nickname, "results");

			// we should be ready to play at this point
			SetReady();
		});
	}
	else {

		// update existing user info

		var userInfo = {
			UserID: mActiveUser.UserID,
			FirstName: $("#txtAccountFirst").val(),
			LastName: $("#txtAccountLast").val(),
			Nickname: $("#txtAccountNickname").val(),
			Password: $("#txtAccountPassword1").val(),
			Email: $("#txtAccountEmail").val()
		};
		CallUpdateUser(userInfo, function (results) {

			if ( !results.TransactionSucceeded ) {
				SetAccountErrorString("Error: " + results.FailureInfo);
				return;
			}

			// synchronize active user info
			mActiveUser.FirstName = userInfo.FirstName;
			mActiveUser.LastName = userInfo.LastName;
			mActiveUser.Nickname = userInfo.Nickname;
			mActiveUser.Password = userInfo.Password;
			mActiveUser.Email = userInfo.Email;

			// close popup, update user display info
			ShowAccountPopup(false);
			ShowUserInfo();
			ShowResults("User info update complete", "results");
		});
	}
}

function btnAccountCancel_OnClick() {
	ShowAccountPopup(false);

	// if in create new account mode, cancel, go back to login form
	if ( mbCreateAccountMode ) {
		ShowLoginPopup(true);
	}
}

function btnAccountLogout_OnClick() {
	// close account popup
	ShowAccountPopup(false);

	// close out active values
	mPlayStats = new PlayStats();
	mActiveUser = null;
	mActiveDeck = null;
	mActiveHand = null;
	mdCurrentBetAmount = DEFAULT_BET_AMOUNT;
	msState = "pending";		// current state
	msResultsMode = "results";

	// clear active user cookie
	SaveActiveUser();

	// turn off functionality
	DisableAll(true);
	ShowResults("", "results");

	// show the login popup (with empty textboxes)
	$("#txtLoginName").val("");
	$("#txtLoginPassword").val("");
	ShowLoginPopup(true);
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// cookies / save/load operations
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

// new functionality for saving/loading preferences on the server.
// we just got the active user, so read the preferences and set the values
// accordingly
function ReadUserPreferences(user) {

	// defaults for new users
	SetActiveGame(mAvailableGames[0]);

	mdCurrentBetAmount = DEFAULT_BET_AMOUNT;
	ShowBetAmount();

	// now override these values if we have values for them
	if ( user.Preferences != null ) {
		for ( var i = 0; i < user.Preferences.length; i++ ) {
			var preference = user.Preferences[i];
			switch ( preference.Name ) {
				case "vpCurrentGame":

					var gameid = parseInt(preference.Value);
					if ( gameid != NaN && gameid > 0 ) {
						for (var g = 0; g < mAvailableGames.length; g++) {
							var game = mAvailableGames[g];
							if ( game.GameID == gameid ) {
								SetActiveGame(game);
								break;
							}
						}
					}
					break;

				case "vpCurrentBet":
					var savedBetAmount = parseInt(preference.Value);
					if ( savedBetAmount != NaN && savedBetAmount > 0 ) {
						mdCurrentBetAmount = savedBetAmount;
						ShowBetAmount();
					}
					break;
			}
		}
	}
}


function SaveCurrentGame() {
	//$.cookie("vpCurrentGame", mActiveGame.GameID);
	CallPostSetUserPreferences(mActiveUser.UserID, [{
		Name: "vpCurrentGame",
		Value: mActiveGame.GameID.toString()
	}]);
}

function SaveCurrentBetAmount() {
	//$.cookie("vpCurrentBet", mdCurrentBetAmount);
	CallPostSetUserPreferences(mActiveUser.UserID, [{
		Name: "vpCurrentBet",
		Value: mdCurrentBetAmount.toString()
	}]);

}

function SaveActiveUser() {
	if ( mActiveUser == null ) {
		ClearCookies();
	}
	else {
		$.cookie("vpUserId", mActiveUser.UserID);
		$.cookie("vpUserNickname", mActiveUser.Nickname);
	}
}

function ReadActiveUserId() {
	return $.cookie("vpUserId");
}

function ClearCookies() {
	$.removeCookie("vpUserId");
	$.removeCookie("vpUserNickname");
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// calls related to actually playing a hand
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// called when our initialization is complete and we're ready to start playing
///////////////////////////////////////////////////////////////////////////////
function SetReady() {
	msState = "ready";
	DisableMidGameButtons(false);
}

///////////////////////////////////////////////////////////////////////////////
// starts a new hand
///////////////////////////////////////////////////////////////////////////////
function StartHand() {
	// disable while calling
	msState = "pending";
	DisableMidGameButtons(true);
	ShowResults("", "results");
	ShowWaitCursor(true);

	CallStartHand(mdCurrentBetAmount, function(results) {

		// check for failure. if so then set back to a starting position
		if ( !results.TransactionSucceeded ) {
			ShowError(results.FailureInfo);
			DisableMidGameButtons(false);
			SetCardsToBack();
			msState = "pending";
			ShowWaitCursor(false);
			return;
		}

		// happy path

		mActiveDeck = [];
		mActiveHand = [];

		// remove bet from user bank and show new amount
		mActiveUser.Bank -= mdCurrentBetAmount;
		ShowBankAmount();

		// populate the starting hand
		for ( var i = 0; i < HANDCARDS; i++ ) {
			var card = new CardInfo(results.Deck[i]);
			mActiveHand.push(card);
			ShowCard(card, i+1);
		}

		// fill deck with the rest of the cards
		for ( var i = HANDCARDS; i < results.Deck.length; i++ ) {
			mActiveDeck.push(new CardInfo(results.Deck[i]));
		};

		msState = "discard1";
		ShowResultsComment("Play discard");

		// turn on deal button, show hand cursor for cards
		DisableDealButton(false);
		$(".card").css("cursor", "pointer");

		ShowWaitCursor(false);
	});

}

///////////////////////////////////////////////////////////////////////////////
// for 2 draw games only. performs the first discard and shows the new set of
// cards.
///////////////////////////////////////////////////////////////////////////////
function MoveToNextDiscard() {
	ReplaceRequested();
	msState = "discard2";
	ShowResultsComment("Play discard 2");
}

///////////////////////////////////////////////////////////////////////////////
// completes the current hand
///////////////////////////////////////////////////////////////////////////////
function CompleteHand() {

	// step 1: replace cards marked for discard with new cards from the deck
	ReplaceRequested();

	// turn off deal button until call returns
	DisableDealButton(true);
	ShowWaitCursor(true);

	// step 2: call CompleteHand on the server
	CallCompleteHand(mdCurrentBetAmount, function(results) {

		// check for failure. if so then set back to a starting position. they just
		// lose their initial bet. oh well.
		if ( !results.TransactionSucceeded ) {
			ShowError(results.FailureInfo);
			DisableMidGameButtons(false);
			ShowWaitCursor(false);
			SetCardsToBack();
			msState = "pending";
			return;
		}

		// happy path
		mActiveUser.Bank = results.CurrentUserBank;
		mPlayStats.HandsPlayed++;
		mPlayStats.TotalBet += results.AmountBet;
		mPlayStats.TotalWon += results.AmountWon;

		ShowBankAmount();
		ShowResults(results.HandName, "results");

		msState = "ready";
		DisableMidGameButtons(false);

		// don't show hand cursor for cards
		$(".card").css("cursor", "default");

		ShowWaitCursor(false);
	});

}

///////////////////////////////////////////////////////////////////////////////
// replace the cards in the current hand that are marked for discard
///////////////////////////////////////////////////////////////////////////////
function ReplaceRequested() {
	for ( var i = 0; i < HANDCARDS; i++ ) {
		var card = mActiveHand[i];
		if ( card.MarkedForDiscard ) {
			mActiveHand[i] = mActiveDeck.shift();
			ShowCard(mActiveHand[i], i+1);
		}
	}
}

///////////////////////////////////////////////////////////////////////////////
// set the image for this card
// NOTE: index is 1 based
///////////////////////////////////////////////////////////////////////////////
function ShowCard(card, index) {
	var cardid = "#card" + index;

	var imgsrc = PATH_TO_CARDS + card.ResFile;
	if ( card.MarkedForDiscard ) {
		imgsrc = PATH_TO_CARDS + "BackRed.png";
	}
	$(cardid).attr("src", imgsrc);
}

///////////////////////////////////////////////////////////////////////////////
// sets one card to discarded/not discarded
// NOTE: index is 1 based
///////////////////////////////////////////////////////////////////////////////
function PlayDiscard(cardid, index) {
	if ( msState == "discard1" || msState == "discard2" ) {
		var card = mActiveHand[index-1];
		card.MarkedForDiscard = !card.MarkedForDiscard;
		ShowCard(card, index);
	}
}

function ShowBetAmount() {
	$("#btnBet").html("$" + mdCurrentBetAmount + ".00");
}

function ShowBankAmount() {
	$("#btnBank").html("$" + Format2Digits(mActiveUser.Bank));
}

function ShowUserInfo() {
	$("#btnUser").html(mActiveUser.FirstName + " " + mActiveUser.LastName);
}

function ShowResults(results, currentResultsMode) {
	$("#btnResults").html(results);
	msResultsMode = currentResultsMode;
}

function ShowError(errorDetails) {
	var s = "<div class='errorStateDiv'>" + errorDetails + "</div>";
	ShowResults(s, "results");
}

function ShowResultsComment(comment) {
	var s = "<div class='commentStateDiv'>" + comment + "</div>";
	ShowResults(s, "results");
}

///////////////////////////////////////////////////////////////////////////////
// generate html for showing user game status into the results button
/*
		public class UserGameStats {
			public Guid UserID { get; set; }
			public int GameTypeID { get; set; }
			public string GameName { get; set; }
			public int TotalHandsPlayed { get; set; }
			public decimal TotalBet { get; set; }
			public decimal TotalAmountWon { get; set; }
			public decimal BiggestAmountWon { get; set; }
			public int TotalHandsWon { get; set; }
			public decimal PercentageWon { get; set; }
			public decimal ReturnPercentage { get; set; }
		}
 */
///////////////////////////////////////////////////////////////////////////////
function FormatGameStats(stats) {
	var s = "<table class='GameStats'><tr><th colspan='5' class='GamePayoffTitle'>" + stats.GameName + " Statistics</th></tr>" +
		"<tr><th>Hands played:</th><td>" + stats.TotalHandsPlayed + "</td>" +
		"<th>Hands won:</th><td>" + stats.TotalHandsWon + "</td></tr>" +

		"<tr><th>Amount bet:</th><td>$" + Format2Digits(stats.TotalBet) + "</td>" +
		"<th>Amount won:</th><td>$" + Format2Digits(stats.TotalAmountWon) + "</td></tr>" +

		"<tr><th>Win percent:</th><td>" + stats.PercentageWon + "%</td>" +
		"<th>Return percent:</th><td>" + stats.ReturnPercentage + "%</td></tr></table>";

	return s;
}

///////////////////////////////////////////////////////////////////////////////
// There's a lot of things you can't do mid-hand. You cannot:
//	- change the game type
//	- change the bet amount
//	- change the current user
//	- change the current bank (account information)
///////////////////////////////////////////////////////////////////////////////
function DisableMidGameButtons(disable) {
	$("#btnDeal").prop("disabled", disable);
	$("#btnGameType").prop("disabled", disable);
	$("#btnBetPlus").prop("disabled", disable);
	$("#btnBetMinus").prop("disabled", disable);
	$("#btnBet").prop("disabled", disable);
	$("#btnUser").prop("disabled", disable);
	$("#btnBank").prop("disabled", disable);

	var cursor = disable ? "default" : "pointer";
	$("#btnGameType").css("cursor", cursor);
	$("#btnBetPlus").css("cursor", cursor);
	$("#btnBetMinus").css("cursor", cursor);
	$("#btnBet").css("cursor", cursor);
	$("#btnUser").css("cursor", cursor);
	$("#btnBank").css("cursor", cursor);
}

// just the deal button
function DisableDealButton(disable) {
	$("#btnDeal").prop("disabled", disable);
}

///////////////////////////////////////////////////////////////////////////////
// Error state - cannot retrieve key information
///////////////////////////////////////////////////////////////////////////////
function DisableAll(disable) {
	DisableMidGameButtons(true);
	SetCardsToBack();
}

function Format2Digits(value) {
	return parseFloat(Math.round(value * 100) / 100).toFixed(2);

}

///////////////////////////////////////////////////////////////////////////////
// set all the cards to the back card
///////////////////////////////////////////////////////////////////////////////
function SetCardsToBack() {
	$(".card").attr("src", PATH_TO_CARDS + "BackRed.png");
	$(".card").css("cursor", "default");
}

///////////////////////////////////////////////////////////////////////////////
// 1. sets all the cards to not-set (turned over)
// 2. assigns a click-handler to the cards
///////////////////////////////////////////////////////////////////////////////
function SetInitialCardState() {

	// disable until SetReady is called
	DisableMidGameButtons(true);

	ShowBetAmount();

	// sets all cards with this class defintion to back
	SetCardsToBack();

	// set click handler for the cards
	$(".card").click(function(args) {
		var cardid = $(args.target)[0].id;
		var index = parseInt(cardid.charAt(4)); // note: 1 based
		PlayDiscard("#" + cardid, index);
	});

	// click handler for titlebar on the game selector popup (closes without action)
	$("#popupGameSelectorTitle").click(function (args) {
		ShowGameSelectionPopup(false);
	});

	ShowResults("", "results");

	// if a refresh is called, we already know our active user
	CheckForExistingUser();

}

///////////////////////////////////////////////////////////////////////////////
// Resize all of our controls based on the current screen size
///////////////////////////////////////////////////////////////////////////////
function Resize() {
	var wwidth = $(window).width();
	var wheight = $(window).height();

	// top 3 buttons
	var topBtnWidth = (wwidth - 104) / 3;
	var topBtnHeight = wheight / 7;
	$(".topbuttonsrow button").width(topBtnWidth);
	$(".topbuttonsrow button").height(topBtnHeight);

	// cards
	var cardWidth = (wwidth - 64) / 5;
	$(".card").width(cardWidth);

	// bottom buttons. these are not all the same size
	var btmBtnHeight = wheight / 4;
	var btnDealWidth = wwidth / 5;
	var btnBetWidth = wwidth / 7;
	var btnResultsWidth = wwidth - btnDealWidth - btnBetWidth - 188;
	var btnPlusLeft = btnDealWidth + btnResultsWidth + btnBetWidth + 71;
	var btnPlusHeight = btmBtnHeight/2 - 4;

	$("#btnDeal").width(btnDealWidth);
	$("#btnDeal").height(btmBtnHeight);

	$("#btnResults").width(btnResultsWidth);
	$("#btnResults").height(btmBtnHeight);

	$("#btnBet").width(btnBetWidth);
	$("#btnBet").height(btmBtnHeight);


	$("#btnBetPlus").css("left", btnPlusLeft);
	$("#btnBetPlus").width(60);
	$("#btnBetPlus").height(btnPlusHeight);

	$("#btnBetMinus").css("top", btnPlusHeight + 8);
	$("#btnBetMinus").css("left", btnPlusLeft);
	$("#btnBetMinus").width(60);
	$("#btnBetMinus").height(btnPlusHeight);

	// now scale the font sizes
	var dealFontSize = btnDealWidth/50;
	$("#btnDeal").css("font-size", dealFontSize + "em");

	var betFontSize = btnBetWidth / 50;
	$("#btnBet").css("font-size", betFontSize + "em");

	var bankFontSize = topBtnWidth / 85;
	$("#btnBank").css("font-size", bankFontSize + "em");

	// login/account popup
	$(".popupInput").width(wwidth / 2);

	$("#popupLogin h1").css("font-size", dealFontSize + "em");
	$("#popupAccount h1").css("font-size", dealFontSize + "em");
	


}
