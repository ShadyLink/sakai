var DTMN = DTMN || {};

DTMN.toolList = [ "assignments", "assessments", "signup", "gradebook", "resources", "calendar", "forums", "announcements", "lessons" ];
DTMN.collapseElements = [ ];
DTMN.nextIndex = -1;

DTMN.initDatePicker = function(updates, notModified)
{
	// use an event listener to populate the date pickers on demand instead of populating everything on page load
	for (let i = 0; i < DTMN.toolList.length; i++)
	{
		const collapseId = "#collapse-" + DTMN.toolList[i];
		const collapseElement = document.querySelector(collapseId);
		if (collapseElement !== null)
		{
			DTMN.collapseElements.push(collapseElement);
		}
		const link = document.querySelector("a[href='" + collapseId + "']");
		if (link !== null)
		{
			const selector = collapseId + " .datepicker:not(.hasDatepicker)";
			const target = document.querySelector(collapseId);
			$(target).on("show.bs.collapse", function()
			{
				const spinner = link.querySelector(".allocatedSpinPlaceholder");
				spinner.classList.add("spinPlaceholder");
				window.setTimeout(function()
				{
					DTMN.attachDatePicker(selector, updates, notModified);
					spinner.classList.remove("spinPlaceholder");
				}, 25); // delay 25ms to give browser time to render the spinner
		    });
		}
	}

	document.getElementById("shiftAllDates").addEventListener("click", function()
	{
		DTMN.handleButtonClick(this, DTMN.collapseElements, updates, notModified);
	}, false);

	document.getElementById("shiftVisibleDates").addEventListener("click", function()
	{
        const visibleCollapseElements = DTMN.collapseElements.filter(function (e) { return e.getAttribute("aria-expanded") === "true"; });
		DTMN.handleButtonClick(this, visibleCollapseElements, updates, notModified);
	}, false);
};

DTMN.handleButtonClick = function(button, collapseElements, updates, notModified)
{
	button.disabled = true;
	button.classList.add("spinButton");
	window.setTimeout(function()
	{
		for (let i = 0; i < collapseElements.length; i++)
		{
			// use setTimeout() to space out the function calls so the browser doesn't report the page as unresponsive
			// the last function will remove the spinner and re-enable the button
			window.setTimeout(function() { DTMN.shiftDates(updates, notModified, collapseElements[i].id, button, i === collapseElements.length - 1); }, 10);
		}
	}, 25);
};

DTMN.enableButton = function(button)
{
	button.classList.remove("spinButton");
	button.disabled = false;
};

DTMN.attachDatePicker = function(selector, updates, notModified)
{
	$(selector).each(function (idx, elt) {
		DTMN.nextIndex = DTMN.nextIndex + 1;
		var $td = $(elt).closest('td');
		var $hidden = $td.find('input[type=hidden]');

		var dataTool = $hidden.data('tool');
		var dataField = $hidden.data('field');
		var dataIdx = $hidden.data('idx');
		$td.attr('id', 'cell_' + dataTool + '_' + dataField + '_' + dataIdx);

		$hidden.on('change', function () {
			var idx = $(this).data('idx');
			var field = $(this).data('field');
			var tool = $(this).data('tool');

			updates[tool][idx][field] = $(this).val().split('+')[0];
			updates[tool][idx][field + '_label'] = $(this).siblings('input.datepicker').val();
			// Show day of the week in case there is a date selected
			if ($(this).parent().find('.datepicker').val() !== '') {
				updates[tool][idx][field + '_day_of_week'] = moment(updates[tool][idx][field]).locale(sakai.locale.userLocale).format('dddd');
				$(this).parent().find('.day-of-week').text(updates[tool][idx][field + '_day_of_week']);
			}

			if (notModified.includes(tool + idx + field)) {
				updates[tool][idx].idx = idx;
				updates[tool + 'Upd'][idx] = updates[tool][idx];
				$('#submit-form-button').prop('disabled', false);
			}
			notModified.push(tool + idx + field);
		});

		$hidden.attr('id', 'hidden_datepicker_' + DTMN.nextIndex);
		var dateFormat = 'YYYY-MM-DD HH:mm:ss';
		var toolTime = 1;
		if(dataTool === 'gradebookItems') {
			dateFormat = 'YYYY-MM-DD';
			toolTime = 0;
		}
		var datepickerOpts = {
			input: elt,
			useTime: toolTime,
			parseFormat: dateFormat,
			allowEmptyDate: false,
			ashidden: {
				iso8601: 'hidden_datepicker_' + DTMN.nextIndex,
			}
		};
		if ($hidden.val() !== '') datepickerOpts.val = $hidden.val();
		localDatePicker(datepickerOpts);

		// Disable accept_until date input if no late submissions (assessments) allowed
		if (dataTool === 'assessments' && dataField === 'accept_until') {
			var disabled = !updates[dataTool][dataIdx].late_handling;
			$(elt).prop('disabled', disabled);
			$td.find('.ui-datepicker-trigger').prop('disabled', disabled);
		}
		if (dataTool === 'forums' && (dataField === 'open_date' || dataField === 'due_date')) {
			var disabled = !updates[dataTool][dataIdx].restricted;
			$(elt).prop('disabled', disabled);
			$td.find('.ui-datepicker-trigger').prop('disabled', disabled);
		}
	});
};

DTMN.shiftDates = function(updates, notModified, rootElementId, button, enableButton)
{
	// validate input
	const errorBanner = document.getElementById("dateShifterError");
	const days = parseInt(document.getElementById("dateShifterDays").value);
	if (!Number.isInteger(days) || days > 9999 || days < -9999)
	{
		errorBanner.classList.remove("hidden");
		return;
	}
	else
	{
		errorBanner.classList.add("hidden");
	}

	// attach any missing datepickers
	const rootElement = "#" + rootElementId;
	DTMN.attachDatePicker(rootElement + " .datepicker:not(.hasDatepicker)", updates, notModified);

	$(rootElement + " .datepicker.hasDatepicker").each(function()
	{
		const pickerDate = $(this).datepicker("getDate");
		if (pickerDate !== null)
		{
			const newDate = new Date(Number(pickerDate));
			newDate.setDate(newDate.getDate() + days);
			$(this).datepicker("setDate", newDate);

			// setDate doesn't cause the hidden field that stores the date to update, so we have to do it ourselves
			// find the associated hidden field, set it, trigger the onchange event manually
			const $td = $(this).closest('td');
			const $hidden = $td.find('input[type=hidden]');
			$hidden.val(moment(newDate).format());
			$hidden.change();
		}
	});

	if (enableButton)
	{
		DTMN.enableButton(button);
	}
};


