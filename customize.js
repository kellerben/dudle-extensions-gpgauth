/****************************************************************************
 * Copyright 2010,2011 Benjamin Kellermann                                  *
 *                                                                          *
 * This file is part of dudle.                                              *
 *                                                                          *
 * Dudle is free software: you can redistribute it and/or modify it under   *
 * the terms of the GNU Affero General Public License as published by       *
 * the Free Software Foundation, either version 3 of the License, or        *
 * (at your option) any later version.                                      *
 *                                                                          *
 * Dudle is distributed in the hope that it will be useful, but WITHOUT ANY *
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or        *
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public     *
 * License for more details.                                                *
 *                                                                          *
 * You should have received a copy of the GNU Affero General Public License *
 * along with dudle.  If not, see <http://www.gnu.org/licenses/>.           *
 ***************************************************************************/

"use strict";

var usegpg = "<div id='config_gpg'>";
usegpg += "<h3>" + _("Security") + "</h3>";
usegpg += "<label for='useGPG'>" + _("Sign votes using PGP/GPG:") + "</label>";
usegpg += "<input type='checkbox' id='useGPG' />";
usegpg += "</div";
$("#config_user").after(usegpg);

$("#useGPG").click(function () {
	$("#config_gpg .error").remove();
	if (gfHasLocalStorage()) {
		localStorage.GPGAuth_enable = $("#useGPG").attr("checked");
	} else {
		$("#config_gpg").append("<div class='error'>" + _("You need a browser, which supports DOM-Storage.") + "</div>");
		$("#useGPG").removeAttr("checked");
	}
});

if (gfHasLocalStorage()) {
	$("#useGPG").attr("checked", localStorage.GPGAuth_enable === "true");
}

