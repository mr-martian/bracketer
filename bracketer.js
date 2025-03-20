ARCS = [];

function maybe_update(dict, key) {
    if (dict.hasOwnProperty(key)) {
	return dict[key];
    } else {
	return key;
    }
}

function arc_len(arc) {
    return arc.end - arc.start;
}

function arc_compare(a, b) {
    if (arc_len(a) == arc_len(b)) {
	return a.start - b.start;
    } else {
	return arc_len(a) - arc_len(b);
    }
}

function redraw_tree() {
    let text = [];
    let num_update = {};
    $('.text').each(function(index) {
	let t = '';
	if ($(this).has('input').length > 0) {
	    text.push($(this).children('input').val());
	} else if ($(this).has('.editable').length > 0) {
	    text.push($(this).children('.editable').text());
	} else {
	    text.push('');
	}
	let i = parseInt($(this).data('index'));
	if (!isNaN(i)) {
	    num_update[i] = index;
	}
    });
    for (let arc of ARCS) {
	arc.start = maybe_update(num_update, arc.start);
	arc.end = maybe_update(num_update, arc.end);
	arc.height = 0;
    }
    ARCS.sort(arc_compare);
    let heights = text.map((x) => 0);
    let last = text.map((x) => -1);
    for (let i = 0; i < ARCS.length; i++) {
	let arc = ARCS[i];
	arc.height = 1 + Math.max(...heights.slice(arc.start, arc.end+1));
	arc.child1 = last[arc.start];
	arc.child2 = last[arc.end];
	for (let j = arc.start; j <= arc.end; j++) {
	    heights[j] = arc.height;
	    last[j] = i;
	}
	arc.c1 = (arc.child1 == -1 ? 4*arc.start : ARCS[arc.child1].center);
	arc.c2 = (arc.child2 == -1 ? 4*arc.end : ARCS[arc.child2].center);
	arc.h1 = (arc.child1 == -1 ? 0 : ARCS[arc.child1].height);
	arc.h2 = (arc.child2 == -1 ? 0 : ARCS[arc.child2].height);
	arc.center = Math.floor((arc.c1 + arc.c2)/2);
    }
    let rows = [];
    let num_cols = 2 * Math.max(...heights);
    for (let i = 0; i < text.length; i++) {
	let row = [];
	for (let j = 0; j < num_cols; j++) {
	    row.push($('<td></td>'));
	}
	let last = $('<td class="text"></td>').data('idx', i).data('field', 'text');
	make_span(text[i]).appendTo(last);
	row.push(last);
	rows.push(row);
	rows.push(row.map((x) => $('<td></td>')));
	rows.push(row.map((x) => $('<td></td>')));
	rows.push(row.map((x) => $('<td></td>')));
    }
    for (let idx = 0; idx < ARCS.length; idx++) {
	let arc = ARCS[idx];
	for (let i = arc.c1; i <= arc.c2; i++) {
	    let cell = rows[i][num_cols - (2*arc.height)];
	    if (i == arc.c1) {
		cell.data('field', 'start').data('idx', idx);
		$('<span class="editable"></span>')
		    .text(arc.start_label || '_')
		    .appendTo(cell);
	    } else if (i == arc.center) {
		cell.data('field', 'center').data('idx', idx);
		$('<span class="editable"></span>')
		    .text(arc.center_label || '_')
		    .appendTo(cell);
		cell.addClass('center');
	    } else if (i == arc.c2) {
		cell.data('field', 'end').data('idx', idx);
		$('<span class="editable"></span>')
		    .text(arc.end_label || '_')
		    .appendTo(cell);
	    } else {
		$('<div class="vertical"></div>').appendTo(cell);
	    }
	}
	for (let i = (num_cols - (2*arc.height)) + 1; i < (num_cols - (2 * arc.h1)); i++) {
	    $('<div class="horizontal"></div>').appendTo(rows[arc.c1][i]);
	}
	for (let i = (num_cols - (2*arc.height)) + 1; i < (num_cols - (2 * arc.h2)); i++) {
	    $('<div class="horizontal"></div>').appendTo(rows[arc.c2][i]);
	}
    }
    $('#doc').empty();
    rows.forEach(function(row) {
	let tr = $('<tr></tr>');
	row.forEach((td) => td.appendTo(tr));
	tr.appendTo($('#doc'));
    });
}

function make_span(text) {
    let ret = $('<span class="editable"></span>');
    let first = true;
    for (let word of text.split(' ')) {
	if (!first) {
	    $('<span class="space"> </span>').appendTo(ret);
	}
	first = false;
	$('<span class="center"></span>').text(word).appendTo(ret);
    }
    return ret;
}

$(function() {
    $('#doc').on('dblclick', '.editable', function(e) {
	let node = $(e.target);
	if (!node.hasClass('editable')) {
	    node = node.parents('.editable');
	}
	let text = node.text();
	let p = node.parent();
	p.empty();
	$('<input type="text"></input>').val(text).appendTo(p);
    }).on('focusout', 'input', function(e) {
	let text = $(e.target).val();
	let p = $(e.target).parent();
	let space = ($(e.target).closest('.text').length > 0);
	p.empty();
	if (space) {
	    make_span(text).appendTo(p);
	} else {
	    $('<span class="editable"></span>').text(text).appendTo(p);
	    let td = $(e.target).parents('td');
	    ARCS[td.data('idx')][td.data('field')+'_label'] = text;
	}
    }).on('click', '.space', function(e) {
	let td = $(e.target).parents('td');
	let left = $(e.target).prevAll().text();
	let right = $(e.target).nextAll().text();
	td.empty();
	$('<span class="editable"></span>').text(left).appendTo(td);
	let td2 = $('<td class="text"></td>');
	$('<span class="editable"></span>').text(right).appendTo(td2);
	td2.insertAfter(td);
	redraw_tree();
    }).on('click', '.center', function(e) {
	let td = $(e.target).parents('td');
	if (td.hasClass('highlighted')) {
	    td.removeClass('highlighted');
	} else if ($('.highlighted').length == 0) {
	    td.addClass('highlighted');
	} else {
	    let i1 = parseInt($('.highlighted').data('idx'));
	    let f1 = $('.highlighted').data('field');
	    let i2 = parseInt(td.data('idx'));
	    let f2 = td.data('field');
	    if (i1 == i2 && f1 == f2) {
		$('.highlighted').removeClass('highlighted');
		td.addClass('highlighted');
		return
	    } else if (i2 < i1) {
		ARCS.push({
		    start: (f2 == 'text' ? i2 : ARCS[i2].start),
		    end: (f1 == 'text' ? i1 : ARCS[i1].end),
		    start_label: '_',
		    center_label: '_',
		    end_label: '_',
		});
	    } else {
		ARCS.push({
		    start: (f1 == 'text' ? i1 : ARCS[i1].start),
		    end: (f2 == 'text' ? i2 : ARCS[i2].end),
		    start_label: '_',
		    center_label: '_',
		    end_label: '_',
		});
	    }
	    // TODO: delete conflicting arcs
	    redraw_tree();
	}
    });
    $('#addrow').on('click', function() {
	$('<tr><td class="text"><span class="editable">Enter text</span></td></tr>').appendTo($('#doc'));
	redraw_tree();
    });
    $('#delarc').on('click', function() {
	let td = $('.highlighted');
	if (td.length == 1 && td.data('field') == 'center') {
	    ARCS.splice(parseInt(td.data('idx')), 1);
	    redraw_tree();
	}
    });
    redraw_tree();
});
