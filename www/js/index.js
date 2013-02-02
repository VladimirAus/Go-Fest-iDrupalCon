/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    feedCache: {},
	appfeed: 'drupalcon.json',
	db: null, 
	session: 0, 
	pageid: 0, 
	debug: false,
	devel: false,
	sort: 'date',
	// Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)) {
			document.addEventListener('deviceready', this.onDeviceReady, false);
		} else {
			$(document).ready(function() {
				app.receivedEvent('deviceready');
			});
		}
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
		// loader
		$.mobile.loading( 'show', {
			text: 'warming up...',
			textVisible: true,
			theme: 'a',
			html: ""
		});
		$('#feedList').fadeOut(0);
        app.receivedEvent('deviceready');
		
		$('#sort-select input').click(function() {
			var sortParam = $(this).attr('value');
			if (app.sort != sortParam) {
				app.sort = sortParam;
				$.mobile.loading( 'show', {
					text: 'thinking...',
					textVisible: true,
					theme: 'a',
					html: ""
				});
				$('#feedList').fadeOut('fast', function() {
					app.getItems();
				});
			}
		});
		$('#getHelp').click(function() {
			$.mobile.loading( 'show', {
				text: 'thinking...',
				textVisible: true,
				theme: 'a',
				html: ""
			});
			$('#helpmenuFeed').fadeOut(0);
			$('#infodatalist').fadeOut(0);
		});
		$('#switchFav').click(function() {
			if ($(this).attr('data-theme') == "a") {
				if ($('.btn-favourite .ui-btn-up-b').length == 0) {
					//alert('Add at least one session to favourites first');
					
					navigator.notification.alert(
						'Add at least one session to favourites first',  // message
						app.alertDismissed,         // callback
						'Abandon ship!',            // title
						'OK'                  // buttonName
					);
					
					return;
				}
				$(this).removeClass('ui-btn-up-a').addClass('ui-btn-up-b');
				$(this).attr('data-theme', "b");
				
			}
			else {
				$(this).removeClass('ui-btn-up-b').addClass('ui-btn-up-a');
				$(this).attr('data-theme', "a");
			}
			
			$.mobile.loading( 'show', {
				text: 'thinking...',
				textVisible: true,
				theme: 'a',
				html: '<span class="blink">blink</span>'
			});
			$('#feedList').fadeOut('fast');
			
			app.getItems();
		});
		
		$('#help').live('pageshow',function(event, ui){
			//$('#help ul').hide();
			$.mobile.loading( 'show', {
				text: 'thinking...',
				textVisible: true,
				theme: 'a',
				html: ""
			});
			$('#helpmenuFeed').fadeOut(0, function(){
				app.checkPagesSchema();
			});
		});
		
		$('#sessionpage').live('pageshow',function(event, ui){
 
			app.session = $('#sessionpage').attr('session');
			app.getItems();
		});
		$('#infopage').live('pageshow',function(event, ui){
			//$('#infopage ul').hide();
			app.pageid = $('#infopage').attr('pageid');
			//alert(app.pageid);
			app.getPages();
			$('#helpmenuFeed').fadeOut(0);
		});
    },
	alertDismissed: function() {
	},
	// Create a reference to the database
	getDatabase: function() {
		return window.openDatabase("iDrupalConDB", "1.0.2", "iDrupalCon Database", 200000);
	},
	checkSchema: function() {
		if (app.debug) {
			alert('checkSchema');
		}
		this.getDatabase().transaction(function(tx) {
			tx.executeSql('CREATE TABLE IF NOT EXISTS SESSIONS ' +
			   '(id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
			   'eventId TEXT, sessionTitle TEXT, sessionDesc TEXT, sessionRoom TEXT, sessionSpeaker TEXT, ' +
			   'tag1 TEXT, tag2 TEXT, tag3 TEXT, favourite INTEGER, ' +
			   'startDay INTEGER, startMonth INTEGER, startYear INTEGER, startHour INTEGER, startMinute INTEGER, ' +
			   'endDay INTEGER, endMonth INTEGER, endYear INTEGER, endHour INTEGER, endMinute INTEGER' +
			   ')');
		}, this.databaseError, this.getItems);
	},
	checkPagesSchema: function() {
		if (app.debug) {
			alert('checkPagesSchema');
		}
		this.getDatabase().transaction(function(tx) {
			tx.executeSql('CREATE TABLE IF NOT EXISTS PAGES ' +
			   '(id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
			   'dId INTEGER, pageTitle TEXT, pageBody TEXT' +
			   ')');
		}, this.databaseError, this.getPages);
	},
	getPages: function() {
		if (app.debug) {
			alert('getPages');
		}
		
		var where = "";
		if (this.pageid > 0) {
			where += ((where.length > 0)?" AND ":" WHERE") + " id=" + app.pageid;
			//app.session = 0;
		}
		
		var order = ' ORDER BY id ASC';
		app.getDatabase().transaction(function(tx) {
			//alert(tx);
			tx.executeSql('SELECT * FROM PAGES' + where + order, [], 
			   	app.getPagesSuccess, app.databaseError);
		}, app.databaseError);
	},
	getItems: function() {
		if (app.debug) {
			alert('getItems');
		}
		var where = "";
		if ($('#switchFav').attr('data-theme') == "b") {
			where += " WHERE favourite=1 ";
		}
		if (this.session > 0) {
			where += ((where.length > 0)?" AND ":" WHERE") + " id=" + app.session;
			//app.session = 0;
		}
		
		
		var order = ' ORDER BY startYear, startMonth, startDay, startHour, startMinute';
		if (this.sort) {
			if (this.sort == 'title') {
				order = ' ORDER BY sessionTitle ASC';
			}
			else if (this.sort == 'track') {
				order = ' ORDER BY tag2 ASC';
			}
			else if (this.sort == 'room') {
				order = ' ORDER BY sessionRoom ASC';
			}
		}
		
		app.getDatabase().transaction(function(tx) {
			//alert(tx);
			tx.executeSql('SELECT * FROM SESSIONS' + where + order, [], 
			   	app.querySuccess, app.databaseError);
		}, app.databaseError);
	},
	deleteItems: function() {
		if (app.debug) {
			alert('deleteItems');
		}
		app.getDatabase().transaction(function(tx) {
			tx.executeSql('DELETE FROM SESSIONS');
		}, app.databaseError);
	},
	deletePages: function() {
		if (app.debug) {
			alert('deletePages');
		}
		app.getDatabase().transaction(function(tx) {
			tx.executeSql('DELETE FROM PAGES');
		}, app.databaseError);
	},
	getPagesSuccess: function(tx, results) {
		if (app.debug) {
			alert('getPagesSuccess');
		}
		var len = results.rows.length;
		//alert(len);
		// Initialisation of the app
		if (len == 0) {
			var jsonUrl = 'pages.json';
			$.getJSON(jsonUrl, function(data) {
				// On complete
				var dataToSave = "";
				$.each(data, function(i,item){ 
					var pageDid = item.nid;
					var pageTitle = item.title;
					var pageBody = item.body;
					
					//'(eventId, sessionTitle, sessionDesc, sessionRoom, tag1, tag2, tag3, favourite, ' +
				   //'startDay, startMonth, startYear, startHour, startMinute, ' +
				   //'endDay, endMonth, endYear, endHour, endMinute) VALUES ' + 
				   dataToSave += ((dataToSave.length > 0)?', ':'') + "(" + 
				   		pageDid + ', "' + pageTitle + '", "' + pageBody + '")';
					//alert(dataToSave);
					
				});
				app.insertPage(dataToSave);
			})
			.error(function() {  }) // todo: implement
			.complete(function() {  }); // todo: implement
		}
		else {
			var list = '#helpmenuFeed';
			if (app.pageid > 0) {
				
				list = '#infodatalist';
				// reset session
				app.pageid = 0;
			}
			
			// Generating help
			if (list == '#helpmenuFeed') {
				$(list).html('<li><a id="checkUpdates" href="#">Check for updates</a></li>');
				if (app.devel) {
					$(list).append('<li><a href="#">Clear database</a></li><li><a href="#">Debug mode: '+((app.debug?'Yes':'No'))+'</a></li>');
				}
				$('#checkUpdates').click(function() {
					app.appfeed = "http://stage.go-fest.me/dcfeed/event/476";
					$.mobile.loading( 'show', {
						text: 'thinking...',
						textVisible: true,
						theme: 'a',
						html: ""
					});
					app.deleteItems();
					//app.checkPagesSchema();
				});
			}
			else {
				$(list).html('<li class="li-delete"></li>');
			}
			
			for (var i=0; i<len; i++) {
				var pageDid = results.rows.item(i).id;
				var pageTitle = results.rows.item(i).pageTitle;
				if (list == '#helpmenuFeed') {
					$(list).append('<li><a href="#infopage" class="btn-page" pageid="'+pageDid+'">'+pageTitle+'</a></li>');
				}
				else {
					var pageBody = results.rows.item(i).pageBody;
					$(list).append('<li data-role="list-divider">' + pageTitle + '</li>');
					$(list).append('<li><br /><p class="list-content list-room">' + pageBody + '</p></li>');
				}
			}
			
			// Click handler on session button
			$('.btn-page').click(function() {
				$.mobile.loading( 'show', {
					text: 'thinking...',
					textVisible: true,
					theme: 'a',
					html: ""
				});
				//$('#helpmenuFeed').fadeOut(0);
				$('#infodatalist').fadeOut(0);
				$('#infopage').attr('pageid', $(this).attr('pageid'));
			});
			
			$('.li-delete').remove();
			
			$(list).listview('refresh');
			
			$(list).fadeIn('slow');
			$.mobile.loading('hide');
		}
	},
	querySuccess: function(tx, results) {
		if (app.debug) {
			alert('querySuccess');
		}
		var len = results.rows.length;
		//alert(len);
		// Initialisation of the app
		if (len == 0) {
			var jsonUrl = app.appfeed;
			$.getJSON(jsonUrl, function(data) {
				// On complete
				var dataToSave = "";
				$.each(data, function(i,item){ 
					var eventName = item.event;
					var sessionName = item.name;
					var sessionDesc = "This is placeholder session description for DrupalCon Sydney.";
					var sessionSpeaker = "AndyM, Djoker";
					var sessionRoom = item.room;
					var sessionExperience = item.experience;
					var sessionTrack = item.track;
					var sessionFeat = item.featured;
					//var sessionTrack = item.track.toLowerCase().split(" ");
					var sessionTime = new Date(item.time_start);
					var sessionEndTime = new Date(item.time_end);
					
					//'(eventId, sessionTitle, sessionDesc, sessionRoom, sessionSpeaker, tag1, tag2, tag3, favourite, ' +
				   //'startDay, startMonth, startYear, startHour, startMinute, ' +
				   //'endDay, endMonth, endYear, endHour, endMinute) VALUES ' + 
				   dataToSave += ((dataToSave.length > 0)?', ':'') + "(" + 
				   		'"' + eventName + '", "' + sessionName + '", "' + sessionDesc + '", "' + sessionRoom + '", "' + sessionSpeaker + '", ' + 
						'"' + sessionExperience + '", "' + sessionTrack + '", "' + sessionFeat + '", 0, ' + 
						sessionTime.getDate() + ', ' + sessionTime.getMonth() + ', ' + sessionTime.getFullYear() + ', ' + 
						sessionTime.getHours() + ', ' + sessionTime.getMinutes() + ', ' + 
						sessionEndTime.getDate() + ', ' + sessionEndTime.getMonth() + ', ' + sessionEndTime.getFullYear() + ', ' + 
						sessionEndTime.getHours() + ', ' + sessionEndTime.getMinutes() + 
				   		")";
					//alert(dataToSave);
					
				});
				app.insertItem(dataToSave);
			})
			.error(function() {  }) // todo: implement
			.complete(function() {  }); // todo: implement
		}
		else {
			
			// Check which list to update
			var list = '#feedList';
			if (app.session > 0) {
				
				list = '#sessiondatalist';
				// reset session
				app.session = 0;
			}
				
			$(list).html('<li class="li-delete"></li>');
			var devider = "";
			
			for (var i=0; i<len; i++) {
				var sessionId = results.rows.item(i).id;
				var eventName = results.rows.item(i).eventId;
				var sessionName = results.rows.item(i).sessionTitle;
				var sessionDesc = results.rows.item(i).sessionDesc;
				var sessionRoom = results.rows.item(i).sessionRoom;
				var sessionSpeaker = results.rows.item(i).sessionSpeaker;
				var sessionFeat = (results.rows.item(i).tag3.length > 0)?'d':'c';
				var sessionExperience = results.rows.item(i).tag1;
				var sessionTrackRaw = results.rows.item(i).tag2;
				var sessionTrack = sessionTrackRaw.toLowerCase().split(" ");
				var sessionFav = (parseInt(results.rows.item(i).favourite) == 1)?'b':'c';
				var sessionTime = new Date(results.rows.item(i).startYear, results.rows.item(i).startMonth, 
					results.rows.item(i).startDay, results.rows.item(i).startHour, results.rows.item(i).startMinute, 0, 0);
				var sessionEndTime = new Date(results.rows.item(i).endYear, results.rows.item(i).endMonth, 
					results.rows.item(i).endDay, results.rows.item(i).endHour, results.rows.item(i).endMinute, 0, 0);
				//var d1 = new Date("October 13, 1975 11:13:00")
				var icon = "";
				switch(sessionTrack[0]) {
					case 'content':
						icon = 'src="img/icons/1358278380_edit.png" alt="Content"';
						break;
					case 'business':
						icon = 'src="img/icons/1358278205_issue.png" alt="Business"';
						break;
					case 'sitebuilding':
						icon = 'src="img/icons/1358278301_networking.png" alt="Sitebuilding"';
						break;
					default:
						icon = 'src="img/icons/1358278152_customers.png" alt="Community"';
						break;
				}
				var weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
							
				// Deviders
				if (list == '#feedList') {
					if ((app.sort == 'track') && (sessionTrackRaw != devider)) {
						$(list).append('<li data-role="list-divider">' + sessionTrackRaw + '</li>');
						devider = sessionTrackRaw;
					}
					else 
					if ((app.sort == 'room') && (sessionRoom != devider)) {
						$(list).append('<li data-role="list-divider">' + sessionRoom + '</li>');
						devider = sessionRoom;
					}
				}
				else {
					$(list).append('<li data-role="list-divider">' + sessionName + '</li>');
				}
				
				// Actual item
				$(list).append('<li>' + //'<li data-theme="'+sessionFeat+'">'+
					((list == '#feedList')?('<a href="#sessionpage" data-transition="fade" class="btn-session" session="'+sessionId+'">'+'<img '+icon+' class="ui-li-icon">'):'<a href="#">') +
					((list == '#feedList')?('<p class="list-content list-title">'+sessionName+'</p>'):'') +
					//((list == '#sessiondatalist')?'<hr /><br />':'') +
					'<p class="list-content list-room">'+
					sessionExperience+'<br />'+
					((list == '#sessiondatalist')?'<u>Time</u>: <span class="list-time">':'') +
					''+sessionTime.getHours()	+':'+
					((sessionTime.getMinutes() >= 10)?sessionTime.getMinutes():"0"+sessionTime.getMinutes()) + ', ' + 
					weekday[sessionTime.getDay()]+
					((list == '#sessiondatalist')?'</span><br /><u>Room</u>: <span class="list-time">':'') +
					(((list != '#sessiondatalist') && (app.sort != 'room'))?'<br />':'')+
					((app.sort == 'room')?'':sessionRoom) +
					((list == '#sessiondatalist')?'</span><br /><u>Track</u>: <span class="list-time">'+sessionTrackRaw:'<br />') +
					((list == '#sessiondatalist')?'</span><br /><u>Speaker(s)</u>: <span class="list-time">'+sessionSpeaker+'</span>':'') +
					//'<p class="list-content list-track">'+sessionTrack+'</p>'+
					//'<p class="list-content list-time">'+sessionTime+'</p>'+
					//'<p class="list-content list-time">'+weekday[sessionTime.getDay()]+'</p>'+
					//((list == '#feedList')?'</a>':'') +
					'</p></a>'+
					'<a href="#" data-rel="popup" data-position-to="window" data-icon="star" data-theme="'+sessionFav+
					'" id="fav-'+sessionId+'" class="btn-favourite">Add to favourites</a>'+
					'</li>'+
					((list == '#sessiondatalist')?('<li><strong>Summary</strong><hr /><br /><p class="list-content list-room">'+sessionDesc+'</p></li>'):''));
			}
			
			// Click handler on favourite
			$('.btn-favourite').click(function() {
				
				var idElem = $(this).attr('id');
				var theme = $(this).attr('data-theme');
				//alert(theme);
				
				var elemFav = jQuery('#' + idElem + ' span.ui-btn-icon-notext');
				if (elemFav.attr('data-theme') == "b") {
					elemFav.removeClass('ui-btn-up-b').addClass('ui-btn-up-c');
					elemFav.attr('data-theme', "c");
				}
				else {
					elemFav.removeClass('ui-btn-up-c').addClass('ui-btn-up-b');
					elemFav.attr('data-theme', "c");
				}
				
				//jQuery('#'+idElem).attr();
				app.updateFavItem(idElem.split('-')[1]);
			});
			
			// Click handler on session button
			$('.btn-session').click(function() {
				 $('#sessionpage').attr('session', $(this).attr('session'));
				 $.mobile.loading( 'show', {
					text: 'thinking...',
					textVisible: true,
					theme: 'a',
					html: ""
				}); 
				$('#sessiondatalist').fadeOut(0);
				//$('#feedList').fadeOut(0);
			});
			
			$('.li-delete').remove();
			$(list).listview('refresh');
			
			$(list).fadeIn('slow');
			$.mobile.loading( 'hide' );
		}
	},
	// Database error handler
	databaseError: function(error) {
		//if (app.debug) {
			alert("SQL Error: " + error.code);
		//}
	},
	// Insert a record into the database
	insertItem: function(insertValue) {
		if (app.debug) {
			alert("111 insertItem:\n" + 'INSERT INTO SESSIONS  ' +
			   '(eventId, sessionTitle, sessionDesc, sessionRoom, sessionSpeaker, ' + 
			   'tag1, tag2, tag3, favourite, ' +
			   'startDay, startMonth, startYear, startHour, startMinute, ' +
			   'endDay, endMonth, endYear, endHour, endMinute) VALUES ' + 
			   insertValue);
		}
		this.getDatabase().transaction(function(tx) {
			//alert("insertItem");
			tx.executeSql('INSERT INTO SESSIONS  ' +
			   '(eventId, sessionTitle, sessionDesc, sessionRoom, sessionSpeaker, ' + 
			   'tag1, tag2, tag3, favourite, ' +
			   'startDay, startMonth, startYear, startHour, startMinute, ' +
			   'endDay, endMonth, endYear, endHour, endMinute) VALUES ' + 
			   insertValue);
		}, this.databaseError, this.getItems);
		// Clear the value from the input box
		//document.getElementById('list_action').value = '';
	},
	insertPage: function(insertValue) {
		if (app.debug) {
			alert("insertPage");
		}
		this.getDatabase().transaction(function(tx) {
			//alert("insertPage");
			tx.executeSql('INSERT INTO PAGES  ' +
			   '(dId, pageTitle, pageBody) VALUES ' + 
			   insertValue);
			//alert(insertValue);
		}, app.databaseError, app.getPages);
		// Clear the value from the input box
		//document.getElementById('list_action').value = '';
	},
	// Update favourite
	updateFavItem: function(idValue) {
		if (app.debug) {
			alert("updateFavItem");
		}
		this.getDatabase().transaction(function(tx) {
			//alert("insertItem");
			tx.executeSql('UPDATE SESSIONS SET ' +
			   'favourite=ABS(favourite-1) ' +
			   'WHERE id='+idValue);
		}, this.databaseError);
		// Clear the value from the input box
		//document.getElementById('list_action').value = '';
	},
    // Update DOM on a Received Event
    receivedEvent: function(id) {
		this.getDatabase();
		this.checkSchema();
    },
	displayFeeds: function() {
		if (app.debug) {
			alert("displayFeeds");
		}
		var feeds = getFeeds();
		if(feeds.length == 0) {
			//in case we had one form before...
			$("#feedList").html("");
			$("#introContentNoFeeds").show();
		} else {
			$("#introContentNoFeeds").hide();
			var s = "";
			for(var i=0; i<feeds.length; i++) {
				s+= '<li><a href="#sessionpage" data-transition="fade">'+feeds[i].name+"</a></li>";
			}
			$("#feedList").html(s);
			$("#feedList").listview("refresh");
		}
	},
	getFeeds: function() {
		if (app.debug) {
			alert("getFeeds");
		}
		if(localStorage["feeds"]) {
			return JSON.parse(localStorage["feeds"]);
		} else 
			return [];
	},
	displayFeed: function(url) {
		if (app.debug) {
			alert("displayFeed");
		}
		var entries = feedCache[url];
		var s = "<ul data-role='listview' data-inset='true' id='feedList'>";
		for(var i=0; i<entries.length; i++) {
			var entry = entries[i];
			s += "<li><p>"+ entry.name+"</p></li>";
		}
		s += "</ul>";
		$("#feedcontents").html(s);
		$("#entrylist").listview();
	}
};
