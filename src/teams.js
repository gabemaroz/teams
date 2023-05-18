let speech;
let backgroundColors = [
	"blue",
	"red",
	"green",
	"purple",
	"orange",
	"gray",
	"darkturquoise"
];

/* Add a function to arrays which returns a random element from the array */
Array.prototype.sample = function () {
	return this[Math.floor(Math.random() * this.length)];
};

/* Helper function to split an array into subArrays of equal parts */
function splitArray(arr, num) {
	const [k, m] = [Math.floor(arr.length / num), arr.length % num];
	const result = [];
	let start = 0;
	let end = 0;
	for (let i = 0; i < num; i++) {
		end += i < m ? k + 1 : k;
		result.push(arr.slice(start, end));
		start = end;
	}
	return result;
}

/* Make sure the DOM has loaded completely */
document.addEventListener('DOMContentLoaded', function () {

	/* Makes the teams sortable and draggable */
	$(function () {
		$(".container")
			.sortable({
				items: ".team:not(#queueTeam)",
				axis: "y",
				delay: 150
			})
			.disableSelection();
	});

	/* Makes the students sortable and draggable */
	$(function () {
		$(".list")
			.sortable({
				connectWith: "ol",
				placeholder: "placeholder",
				axis: "y",
				delay: 150,
				start: function (event, ui) {
					ui.item.css("list-style-type", "none");
					ui.item.detach();
				},
				stop: function (event, ui) {
					if (ui.item.parent().attr("id") != "queueList") {
						ui.item.find(".delete").remove();
						ui.item.css("padding-left", "1rem");
					} else if (!ui.item.find(".delete").length) {
						ui.item.prepend("<button class='fa fa-trash delete'></button>");
						ui.item.css("padding-left", "0rem");
					}
					ui.item.css("list-style-type", "inherit");
				},
				refresh: true
			})
			.disableSelection();
	});

	/* Add new students to the queue through single input */
	$("#addStudent").on("keypress", function (event) {
		if (event.key === 'Enter') {
			let newStudent =
				"<li draggable='true' class='student'><button class='fa fa-trash delete'></button>" +
				$(this).val() +
				"<div class='pointsControl'><button class='fa fa-xmark-circle xmark'></button><span class='points'>0</span><button class='fa fa-star star'</button></div></li>";
			$("#queueList").prepend(newStudent);
			$(this).val("");
		}
		window.electronAPI.setSize($(document).height());
	});

	/* Add new students to queue from paste */
	$("#addStudent").on("paste", function (event) {
		event.preventDefault();
		let pastedText = (event.originalEvent || event).clipboardData.getData(
			"text/plain"
		);
		let names = pastedText.split("\n");

		names.forEach(function (name) {
			// Ignore empty names
			if (name.trim() !== "") {
				let newStudent =
					"<li draggable='true' class='student'><button class='fa fa-trash delete'></button>" +
					name +
					"<div class='pointsControl'><button class='fa fa-xmark-circle xmark'></button><span class='points'>0</span><button class='fa fa-star star'</button></div></li>";
				$("#queueList").prepend(newStudent);
			}
		});

		$(this).val("");
		window.electronAPI.setSize($(document).height());
	});

	/* Send all elements from queue equally into teams */
	$(".controls").on("click", "#shuffleStudents", function () {
		let queueItems = $("#queueList li").sort(() => Math.random() - 0.5);
		const numLists = $(".list").length - 1;
		if (numLists < 1 || queueItems.length < 1) {
			return;
		}
		queueItems.each(function () {
			$(this).find(".delete").remove();
			$(this).css("padding-left", "1rem");
		});
		const splitItems = splitArray(queueItems, numLists);
		$(".list")
			.not("#queueList")
			.each(function (index) {
				const items = splitItems[index];
				$(this).fadeOut(100, function () {
					$(this).append(items).fadeIn(250);
				});
			});
	});

	/* Move all elements back into the queue */
	$(".controls").on("click", "#resetStudents", function () {
		let studentItems = $(".list li").not("#queueList li");
		studentItems.each(function () {
			$(this).prepend("<button class='fa fa-trash delete'></button>");
			$(this).css("padding-left", "0rem");
		});
		$(studentItems).fadeOut(100, function () {
			$(studentItems).appendTo($("#queueList")).fadeIn(250);
		});
	});

	/* Select a random element from the lists */
	$(".controls").on("click", "#randomStudent", function () {
		let allStudents = $(".student");

		if (allStudents.length === 0) {
			return;
		}
		if (allStudents.length === 1) {
			allStudents.addClass("selected");
			return;
		}

		let oldSelected = $(".selected");
		oldSelected.removeClass("selected");

		let potentialNewSelected = allStudents.not(oldSelected);
		let newSelected = potentialNewSelected.eq(
			Math.floor(Math.random() * potentialNewSelected.length)
		);

		if (!speech) {
			speech = new SpeechSynthesisUtterance();
		}
		speech.text = " " + newSelected.text().replace(/[0-9]/g, "");
		window.speechSynthesis.speak(speech);

		newSelected.addClass("selected");
	});

	/* Increment the points of all selected elements */
	$(".controls").on("click", "#starSelected", function () {
		$(".student.selected").each(function () {
			$(this)
				.find(".points")
				.text(function (i, text) {
					return parseInt(text) + 1;
				});
		});
	});

	/* Toggle selected on double-click */
	$(document).on("dblclick", ".student", function (event) {
		if (!$(event.target).is("button")) {
			if (!$(this).hasClass("selected")) {
				if (!speech) {
					speech = new SpeechSynthesisUtterance();
				}
				speech.text = " " + $(this).text().replace(/[0-9]/g, "");
				window.speechSynthesis.speak(speech);
			}
			$(this).toggleClass("selected");
		}
	});

	/* Remove element from queue */
	$("#queueList").on("click", ".delete", function () {
		$(this)
			.parent()
			.fadeOut(250, function () {
				$(this).remove();
				window.electronAPI.setSize($(".container").height()+50);
			});
	});

	/* Remove team from container */
	$(document).on("click", ".removeTeam", function () {
		const team = $(this).parent().parent();
		const teamId = team.attr("id");
		const color = teamId.replace("Team", "");
		backgroundColors.unshift(color);
		const studentItems = $("#" + teamId + " li");
		studentItems.each(function () {
			$(this).prepend("<button class='fa fa-trash delete'></button>");
			$(this).css("padding-left", "0rem");
		});
		$(studentItems).fadeOut(100, function () {
			$(studentItems).appendTo($("#queueList")).fadeIn(250);
		});
		window.electronAPI.setSize($(".container").height());
		team.fadeOut(250, function () {
			$(this).remove();
		});

	});

	/* Shuffles the order of elements within the team */
	$(document).on("click", ".shuffleTeam", function () {
		let teamList = $(this).parent().next("ol");
		let teamListItems = teamList.children("li");
		teamListItems.removeClass("selected");
		teamListItems.slideUp(100, function () {
			teamList.append(
				teamListItems.get().sort(function () {
					return Math.round(Math.random()) - 0.5;
				})
			);
		});
		teamListItems.slideDown();
	});

	/* Select all the elements within the team and announce the team name */
	$(document).on("click", ".selectTeam", function () {
		let team = $(this).parent().parent();
		let teamStudents = $(this).parent().next("ol").children("li");

		if (teamStudents.length === 0) {
			return;
		}

		let oldSelected = $(".selected");
		oldSelected.removeClass("selected");
		teamStudents.addClass("selected");

		if (!speech) {
			speech = new SpeechSynthesisUtterance();
		}
		speech.text = team.attr("id");
		window.speechSynthesis.speak(speech);
	});

	/* Increment the star of all the elements within the team */
	$(document).on("click", ".starTeam", function () {
		let teamStudents = $(this).parent().next("ol").children("li");

		teamStudents.each(function () {
			let pointsSpan = $(this).find(".points");
			let currentPoints = parseInt(pointsSpan.text());
			pointsSpan.text(currentPoints + 1);
		});
	});

	/* Increment the points of a single elements */
	$(document).on("click", ".star", function () {
		let pointsSpan = $(this).siblings(".points");
		let currentPoints = parseInt(pointsSpan.text());
		pointsSpan.text(currentPoints + 1);
	});

	/* Decrement the points of a single elements */
	$(document).on("click", ".xmark", function () {
		let pointsSpan = $(this).siblings(".points");
		let currentPoints = parseInt(pointsSpan.text());
		pointsSpan.text(currentPoints - 1);
	});

	/* Add a new team */
	$(document).on("click", "#addTeam", function () {
		const newBackgroundColor = backgroundColors.shift();

		if (!newBackgroundColor) {
			return;
		}

		const newTeam = $("<div>", { class: "team", id: newBackgroundColor + "Team" });

		const teamControls = $("<div>", { class: "teamcontrols" });
		teamControls
			.append($("<button>", { class: "fa fa-trash-can whiteText removeTeam" }))
			.append($("<button>", { class: "fa fa-recycle whiteText shuffleTeam" }))
			.append($("<button>", { class: "fa fa-rectangle-list whiteText selectTeam" }))
			.append($("<button>", { class: "fa fa-star whiteText starTeam" }));

		const newList = $("<ol>", { class: "list" });

		newTeam.append(teamControls);
		newTeam.append(newList);

		newTeam.css("background-color", newBackgroundColor);

		$(".team").last().after(newTeam.hide().fadeIn(250));

		window.electronAPI.setSize($(document).height());

		//Update the sortable functionality
		$(".list")
			.sortable({
				connectWith: "ol",
				placeholder: "placeholder",
				axis: "y",
				delay: 150,
				start: function (event, ui) {
					ui.item.css("list-style-type", "none");
					ui.item.detach();
				},
				stop: function (event, ui) {
					if (ui.item.parent().attr("id") != "queueList") {
						ui.item.find(".delete").remove();
						ui.item.css("padding-left", "1rem");
					} else if (!ui.item.find(".delete").length) {
						ui.item.prepend("<button class='fa fa-trash delete'></button>");
						ui.item.css("padding-left", "0rem");
					}
					ui.item.css("list-style-type", "inherit");
				},
				refresh: true
			})
			.disableSelection();

	});

});


