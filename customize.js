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

var usegpg = "<tr>";
usegpg += "<td><label for='useGPG'>" + _("Sign votes using PGP/GPG:") + "</label></td>";
usegpg += "<td class='settingstable'><input type='checkbox' id='useGPG' /></td>";
usegpg += "</tr>";
$("#usernamesetting").before(usegpg);
$("#useGPG").click(function () {
	localStorage.GPGAuth_enable = $("#useGPG").attr("checked");
});
$("#useGPG").attr("checked", localStorage.GPGAuth_enable === "true");


