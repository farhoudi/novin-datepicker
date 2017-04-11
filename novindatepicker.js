
var NovinDatePicker = function () {};

/*
 Converts a Gregorian date to Jalaali.
 */
NovinDatePicker.toJalaali = function(gy, gm, gd) {
    if (Object.prototype.toString.call(gy) === '[object Date]') {
        gd = gy.getDate();
        gm = gy.getMonth() + 1;
        gy = gy.getFullYear();
    }
    return NovinDatePicker.d2j(NovinDatePicker.g2d(gy, gm, gd));
};

/*
 Converts a Jalaali date to Gregorian.
 */
NovinDatePicker.toGregorian = function(jy, jm, jd) {
    return NovinDatePicker.d2g(NovinDatePicker.j2d(jy, jm, jd));
};

/*
 Checks whether a Jalaali date is valid or not.
 */
NovinDatePicker.isValidJalaaliDate = function(jy, jm, jd) {
    return  jy >= -61 && jy <= 3177 &&
        jm >= 1 && jm <= 12 &&
        jd >= 1 && jd <= NovinDatePicker.jalaaliMonthLength(jy, jm);
};

/*
 Is this a leap year or not?
 */
NovinDatePicker.isLeapJalaaliYear = function(jy) {
    return NovinDatePicker.jalCal(jy).leap === 0;
};

/*
 Number of days in a given month in a Jalaali year.
 */
NovinDatePicker.jalaaliMonthLength = function(jy, jm) {
    if (jm <= 6) return 31;
    if (jm <= 11) return 30;
    if (NovinDatePicker.isLeapJalaaliYear(jy)) return 30;
    return 29;
};

/*
 This function determines if the Jalaali (Persian) year is
 leap (366-day long) or is the common year (365 days), and
 finds the day in March (Gregorian calendar) of the first
 day of the Jalaali year (jy).

 @param jy Jalaali calendar year (-61 to 3177)
 @return
 leap: number of years since the last leap year (0 to 4)
 gy: Gregorian year of the beginning of Jalaali year
 march: the March day of Farvardin the 1st (1st day of jy)
 @see: http://www.astro.uni.torun.pl/~kb/Papers/EMP/PersianC-EMP.htm
 @see: http://www.fourmilab.ch/documents/calendar/
 */
NovinDatePicker.jalCal = function(jy) {
    // Jalaali years starting the 33-year rule.
    var breaks =  [ -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210
        , 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178
    ]
        , bl = breaks.length
        , gy = jy + 621
        , leapJ = -14
        , jp = breaks[0]
        , jm
        , jump
        , leap
        , leapG
        , march
        , n
        , i;

    if (jy < jp || jy >= breaks[bl - 1])
        throw new Error('Invalid Jalaali year ' + jy);

    // Find the limiting years for the Jalaali year jy.
    for (i = 1; i < bl; i += 1) {
        jm = breaks[i];
        jump = jm - jp;
        if (jy < jm)
            break;
        leapJ = leapJ + NovinDatePicker.div(jump, 33) * 8 + NovinDatePicker.div(NovinDatePicker.mod(jump, 33), 4);
        jp = jm;
    }
    n = jy - jp;

    // Find the number of leap years from AD 621 to the beginning
    // of the current Jalaali year in the Persian calendar.
    leapJ = leapJ + NovinDatePicker.div(n, 33) * 8 + NovinDatePicker.div(NovinDatePicker.mod(n, 33) + 3, 4);
    if (NovinDatePicker.mod(jump, 33) === 4 && jump - n === 4)
        leapJ += 1;

    // And the same in the Gregorian calendar (until the year gy).
    leapG = NovinDatePicker.div(gy, 4) - NovinDatePicker.div((NovinDatePicker.div(gy, 100) + 1) * 3, 4) - 150;

    // Determine the Gregorian date of Farvardin the 1st.
    march = 20 + leapJ - leapG;

    // Find how many years have passed since the last leap year.
    if (jump - n < 6)
        n = n - jump + NovinDatePicker.div(jump + 4, 33) * 33;
    leap = NovinDatePicker.mod(NovinDatePicker.mod(n + 1, 33) - 1, 4);
    if (leap === -1) {
        leap = 4;
    }

    return  { leap: leap
        , gy: gy
        , march: march
    };
};

/*
 Converts a date of the Jalaali calendar to the Julian Day number.

 @param jy Jalaali year (1 to 3100)
 @param jm Jalaali month (1 to 12)
 @param jd Jalaali day (1 to 29/31)
 @return Julian Day number
 */
NovinDatePicker.j2d = function(jy, jm, jd) {
    var r = NovinDatePicker.jalCal(jy);
    return NovinDatePicker.g2d(r.gy, 3, r.march) + (jm - 1) * 31 - NovinDatePicker.div(jm, 7) * (jm - 7) + jd - 1;
};

/*
 Converts the Julian Day number to a date in the Jalaali calendar.

 @param jdn Julian Day number
 @return
 jy: Jalaali year (1 to 3100)
 jm: Jalaali month (1 to 12)
 jd: Jalaali day (1 to 29/31)
 */
NovinDatePicker.d2j = function(jdn) {
    var gy = NovinDatePicker.d2g(jdn).gy // Calculate Gregorian year (gy).
        , jy = gy - 621
        , r = NovinDatePicker.jalCal(jy)
        , jdn1f = NovinDatePicker.g2d(gy, 3, r.march)
        , jd
        , jm
        , k;

    // Find number of days that passed since 1 Farvardin.
    k = jdn - jdn1f;
    if (k >= 0) {
        if (k <= 185) {
            // The first 6 months.
            jm = 1 + NovinDatePicker.div(k, 31);
            jd = NovinDatePicker.mod(k, 31) + 1;
            return  { jy: jy
                , jm: jm
                , jd: jd
            };
        } else {
            // The remaining months.
            k -= 186;
        }
    } else {
        // Previous Jalaali year.
        jy -= 1;
        k += 179;
        if (r.leap === 1)
            k += 1;
    }
    jm = 7 + NovinDatePicker.div(k, 30);
    jd = NovinDatePicker.mod(k, 30) + 1;
    return  { jy: jy
        , jm: jm
        , jd: jd
    };
};

/*
 Calculates the Julian Day number from Gregorian or Julian
 calendar dates. This integer number corresponds to the noon of
 the date (i.e. 12 hours of Universal Time).
 The procedure was tested to be good since 1 March, -100100 (of both
 calendars) up to a few million years into the future.

 @param gy Calendar year (years BC numbered 0, -1, -2, ...)
 @param gm Calendar month (1 to 12)
 @param gd Calendar day of the month (1 to 28/29/30/31)
 @return Julian Day number
 */
NovinDatePicker.g2d = function(gy, gm, gd) {
    var d = NovinDatePicker.div((gy + NovinDatePicker.div(gm - 8, 6) + 100100) * 1461, 4)
        + NovinDatePicker.div(153 * NovinDatePicker.mod(gm + 9, 12) + 2, 5)
        + gd - 34840408;
    d = d - NovinDatePicker.div(NovinDatePicker.div(gy + 100100 + NovinDatePicker.div(gm - 8, 6), 100) * 3, 4) + 752;
    return d;
};

/*
 Calculates Gregorian and Julian calendar dates from the Julian Day number
 (jdn) for the period since jdn=-34839655 (i.e. the year -100100 of both
 calendars) to some millions years ahead of the present.

 @param jdn Julian Day number
 @return
 gy: Calendar year (years BC numbered 0, -1, -2, ...)
 gm: Calendar month (1 to 12)
 gd: Calendar day of the month M (1 to 28/29/30/31)
 */
NovinDatePicker.d2g = function(jdn) {
    var j
        , i
        , gd
        , gm
        , gy;
    j = 4 * jdn + 139361631;
    j = j + NovinDatePicker.div(NovinDatePicker.div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
    i = NovinDatePicker.div(NovinDatePicker.mod(j, 1461), 4) * 5 + 308;
    gd = NovinDatePicker.div(NovinDatePicker.mod(i, 153), 5) + 1;
    gm = NovinDatePicker.mod(NovinDatePicker.div(i, 153), 12) + 1;
    gy = NovinDatePicker.div(j, 1461) - 100100 + NovinDatePicker.div(8 - gm, 6);
    return  { gy: gy
        , gm: gm
        , gd: gd
    };
};

/*
 Utility helper functions.
 */
NovinDatePicker.div = function(a, b) {
    return ~~(a / b);
};
NovinDatePicker.mod = function(a, b) {
    return a - ~~(a / b) * b;
};



NovinDatePicker.now = new Date();
NovinDatePicker.nowJ = NovinDatePicker.toJalaali(NovinDatePicker.now.getFullYear(), NovinDatePicker.now.getMonth() + 1, NovinDatePicker.now.getDate());

NovinDatePicker.getDateRangeDays = function (currentDate, endDate) {
    var between = [];
    while (currentDate <= endDate) {
        var gregorian = new Date(currentDate);
        gregorian = {
            gy: gregorian.getFullYear(),
            gm: gregorian.getMonth() + 1,
            gd: gregorian.getDate()
        };
        between.push({
            gregorian: gregorian,
            jalali: NovinDatePicker.toJalaali(gregorian.gy, gregorian.gm, gregorian.gd),
            weekDay: ((new Date(currentDate)).getDay() + 1) % 7
        });
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(0, 0, 0, 0);
    }

    var rows = '';
    var i = 0;
    while (i < between.length) {
        // createBox();
        rows += '<tr>';
        for (var j = 0; j < 7; j++) {
            // fillBox();
            // i++;
            if (typeof between[i] != typeof undefined && j == between[i].weekDay) {
                var thisYear = between[i].jalali.jy,
                    thisMonth = (between[i].jalali.jm >= 10) ? between[i].jalali.jm : '0' + between[i].jalali.jm,
                    thisDay = (between[i].jalali.jd >= 10) ? between[i].jalali.jd : '0' + between[i].jalali.jd;
                rows +=
                    '<td>' +
                    '<span class="novin-date-picker-box novin-date-picker-box-default btn-info" data-year="'+thisYear+'" data-month="'+thisMonth+'" data-day="'+thisDay+'">' +
                    between[i].jalali.jd +
                    '</span>' +
                    '</td>';
                i++;
            } else {
                rows += NovinDatePicker.templates.emptyBox;
            }
        }
        rows += '</tr>';
    }
    return rows;
};

NovinDatePicker.dateByMonthDiff = function (monthDiff) {
    var year = NovinDatePicker.nowJ.jy,
        month = NovinDatePicker.nowJ.jm,
        day = NovinDatePicker.nowJ.jd;

    var yearDiff = parseInt(monthDiff / 12);
    monthDiff %= 12;

    year += yearDiff;
    month += monthDiff;

    if (month < 1) {
        year -= 1;
        month += 12;
    } else if (month > 12) {
        year += 1;
        month -= 12;
    }

    return {
        jy: year,
        jm: month,
        jd: day
    };
};

NovinDatePicker.templates = {
    calendar: '<div class="novin-date-picker-header">'+
    '<span class="pull-left novin-date-picker-next glyphicon glyphicon-circle-arrow-right text-info" id="novin-date-picker-next" title="بعد"></span>'+
    '<span class="pull-right novin-date-picker-prev glyphicon glyphicon-circle-arrow-left text-info" id="novin-date-picker-prev" title="قبل"></span>'+
    '<div class="novin-date-picker-title text-info">'+
    '<span class="novin-date-picker-month">TARGET_MONTH_NAME</span>&nbsp;<span class="novin-date-picker-year">TARGET_YEAR</span>'+
    '</div>'+
    '</div>'+
    '<table class="novin-date-picker-calendar">'+
    '<thead>'+
    '<tr>'+
    '<th><span title="شنبه">ش</span></th>'+
    '<th><span title="يکشنبه">ي</span></th>'+
    '<th><span title="دوشنبه">د</span></th>'+
    '<th><span title="سه شنبه">س</span></th>'+
    '<th><span title="چهارشنبه">چ</span></th>'+
    '<th><span title="پنجشنبه">پ</span></th>'+
    '<th><span title="جمعه">ج</span></th>'+
    '</tr>'+
    '</thead>'+
    '<tbody>'+
    'MONTH_DAYS'+
    '</tbody>'+
    '</table>',
    box: '<td>'+
    '<span class="novin-date-picker-box novin-date-picker-box-default btn-info" href="#">DAY_NUMBER</span>'+
    '</td>',
    emptyBox : '<td>&nbsp;</td>'
};

NovinDatePicker.currentInput = null;

NovinDatePicker.createDatePickerElement = function () {
    var datepickerElement = document.createElement('div');
    datepickerElement.className = 'novin-date-picker novin-date-picker-rtl';
    datepickerElement.id = 'novin-date-picker-element';
    return datepickerElement;
    //document.body.appendChild(datepickerElement);
};
//NovinDatePicker.createDatePickerElement();
NovinDatePicker.getDatePickerElement = function () {
    return document.getElementById('novin-date-picker-element');
};

NovinDatePicker.calendarBymonthDiff = function (diff) {
    var calendarTemplate = NovinDatePicker.templates.calendar;


    var jDate = NovinDatePicker.dateByMonthDiff(diff);

    var monthLength = NovinDatePicker.jalaaliMonthLength(jDate.jy, jDate.jm);
    var firstDayOfMonth = NovinDatePicker.toGregorian(jDate.jy, jDate.jm, 1);
    var lastDayOfMonth = NovinDatePicker.toGregorian(jDate.jy, jDate.jm, monthLength);

    var currentDate = new Date(firstDayOfMonth.gy, firstDayOfMonth.gm - 1, firstDayOfMonth.gd);
    var endDate = new Date(lastDayOfMonth.gy, lastDayOfMonth.gm - 1, lastDayOfMonth.gd);


    var monthDays = NovinDatePicker.getDateRangeDays(currentDate, endDate);
    var calendar = calendarTemplate.replace('MONTH_DAYS', monthDays);
    calendar = calendar.replace('TARGET_YEAR', jDate.jy);
    calendar = calendar.replace('TARGET_MONTH_NAME', NovinDatePicker.getMonthNameByNumber(jDate.jm));
    return calendar;
};

NovinDatePicker.dismissDatePicker = function () {
    var elem = NovinDatePicker.getDatePickerElement();
    if (elem !== null) {
        elem.parentNode.removeChild(elem);
        NovinDatePicker.currentInput.classList.remove('novin-date-picker-target');
        NovinDatePicker.isOpen = false;
    }
};

NovinDatePicker.setButtons = function () {
    var boxes = NovinDatePicker.getDatePickerElement().querySelectorAll('.novin-date-picker-box');
    for (var i = 0; i < boxes.length; i++) {
        boxes[i].addEventListener('click', function () {
            NovinDatePicker.currentInput.value = this.getAttribute('data-year') + '-' +
                this.getAttribute('data-month') + '-' +
                this.getAttribute('data-day');
            NovinDatePicker.dismissDatePicker();
            //datePickerElement.style.display = 'none';
        });
    }
};

NovinDatePicker.setChangeMonthButtons = function () {
    var nextMonth = document.getElementById('novin-date-picker-next');
    var prevMonth = document.getElementById('novin-date-picker-prev');
    nextMonth.addEventListener('click', function (evt) {
        NovinDatePicker.changeMonth(1);
    });
    prevMonth.addEventListener('click', function (evt) {
        NovinDatePicker.changeMonth(-1);
    });
};

NovinDatePicker.changeMonth = function (diff) {
    var currentDif = NovinDatePicker.currentInput.getAttribute('diff');
    diff = parseInt(currentDif) + diff;
    NovinDatePicker.currentInput.setAttribute('diff', diff);

    var calendar = NovinDatePicker.calendarBymonthDiff(diff);

    var tempCalendar = document.createElement('div');
    tempCalendar.innerHTML = calendar;
    var newTable = tempCalendar.getElementsByTagName('table')[0].innerHTML;
    var newMonthName = tempCalendar.getElementsByClassName('novin-date-picker-month')[0].innerHTML;
    var newYearName = tempCalendar.getElementsByClassName('novin-date-picker-year')[0].innerHTML;

    var calendarBox = NovinDatePicker.getDatePickerElement();
    calendarBox.getElementsByTagName('table')[0].innerHTML = newTable;
    calendarBox.getElementsByClassName('novin-date-picker-month')[0].innerHTML = newMonthName;
    calendarBox.getElementsByClassName('novin-date-picker-year')[0].innerHTML = newYearName;

    NovinDatePicker.setButtons();
};

NovinDatePicker.getMonthNameByNumber = function (monthNumber) {
    var monthName = '-';
    switch (monthNumber) {
        case 1: {
            monthName = 'فروردین';
            break
        }
        case 2: {
            monthName = 'اردیبهشت';
            break
        }
        case 3: {
            monthName = 'خرداد';
            break
        }
        case 4: {
            monthName = 'تیر';
            break
        }
        case 5: {
            monthName = 'مرداد';
            break
        }
        case 6: {
            monthName = 'شهریور';
            break
        }
        case 7: {
            monthName = 'مهر';
            break
        }
        case 8: {
            monthName = 'آبان';
            break
        }
        case 9: {
            monthName = 'آذر';
            break
        }
        case 10: {
            monthName = 'دی';
            break
        }
        case 11: {
            monthName = 'بهمن';
            break
        }
        case 12: {
            monthName = 'اسفند';
            break
        }
    }
    return monthName;
};

NovinDatePicker.isOpen = false;

NovinDatePicker.showCalendar = function () {
    NovinDatePicker.dismissDatePicker();

    var diff = '0';
    if (NovinDatePicker.currentInput.hasAttribute('diff')) {
        diff = NovinDatePicker.currentInput.getAttribute('diff');
    } else {
        NovinDatePicker.currentInput.setAttribute('diff', diff);
    }

    var calendar = NovinDatePicker.calendarBymonthDiff(diff);

    var calendarBox = NovinDatePicker.createDatePickerElement();
    calendarBox.innerHTML = calendar;
    NovinDatePicker.currentInput.parentNode.appendChild(calendarBox);

    //var height = NovinDatePicker.currentInput.offsetHeight + calendarBox.offsetHeight;
    //calendarBox.style.transform = 'translateY(-'+height+'px)';

    var leftPadding = NovinDatePicker.currentInput.offsetLeft;
    calendarBox.style.left = leftPadding + 'px';

    NovinDatePicker.setButtons();
    NovinDatePicker.setChangeMonthButtons();
    //var datePickerBox = NovinDatePicker.getDatePickerElement();
    //datePickerElement.innerHTML = calendar;
    //calendarBox.style.display = 'block';
    NovinDatePicker.isOpen = true;
};

Element.prototype.novinDatePicker = function () {
    //var datepicker = this;
    //var parent = this.parentNode;
    //var diff = 0;
    //datepickerElement.setAttribute('diff', diff);
    //parent.appendChild(datepickerElement);
    this.addEventListener('focus', function (evt) {
        evt.preventDefault();
        NovinDatePicker.currentInput = this;
        NovinDatePicker.currentInput.classList.add('novin-date-picker-target');
        NovinDatePicker.showCalendar();
        //var datePickerElement = document.getElementById('novin-date-picker-element');
        //this.parent.appendChild(datePickerElement);
        //datePickerElement.style.display = 'block';
        //datepickerElement.style.display = 'block';
    });
    // this.addEventListener('blur', function (evt) {
    //     evt.preventDefault();
    //     //NovinDatePicker.dismissDatePicker();
    //     //datepickerElement.style.display = 'none';
    // });
};

NodeList.prototype.novinDatePicker = function() {
    for (var i = 0; i < this.length; i++) {
        this[i].novinDatePicker();
    }
};

if (window.jQuery) {
    // jQuery is loaded
    jQuery.fn.extend({
        novinDatePicker: function() {
            return this.each(function() {
                this.novinDatePicker();
            });
        }
    });
}

document.addEventListener('click', function(event) {
    var elem = NovinDatePicker.getDatePickerElement();
    if (elem === null || NovinDatePicker.isOpen !== true) {
        return;
    }
    var isClickInside = elem.contains(event.target) || NovinDatePicker.currentInput.contains(event.target);

    if (!isClickInside) {
        NovinDatePicker.dismissDatePicker();
    }
});