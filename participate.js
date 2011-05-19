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

Poll.parseNaddHook(function (name, userinput) {
	var authimage, fingerprint, signame;
	if (userinput.GPGsig) {
		// FIXME: check signature
		signame = "FIXME <fix.me@example.org>";
		fingerprint = "DEAD BEEF 0000 CAFE BABE  C00L D00D 0000 BAAD FEED";

		authimage = "<img";
		authimage += " style='float: left'";
		authimage += " class='GPGAuthSigned'";
		authimage += " alt='" + _("Signed Vote") + "'";
		authimage += " title='" + printf(_("e-mail: %1, fingerprint: %2"), [signame, fingerprint]) + "'";
		authimage += " src='" + GPGAuth.extDir + "/img/signed.png'";
		authimage += ">";
		$("#" + name + "_tr td[class='name']").prepend(authimage);
	}
});

GPGAuth.enabled = localStorage.GPGAuth_enable === "true";
GPGAuth.handleUserInput = function (participantInput, submitfunc) {
	if (GPGAuth.enabled) {
		GPGAuth.goahead = function () {
			if ($("#signText").val().match(/-----BEGIN PGP SIGNATURE-----/)) {
				participantInput.GPGsig = $("#signText").val();
			}
			Poll.exchangeAddParticipantRow();
			submitfunc(participantInput);
		};
		var innerTr = "<td colspan='2'>";
		innerTr += _("Please sign the following code:");
		innerTr += "</td><td colspan='"; 
		innerTr += Poll.columns.length;
		innerTr += "'><textarea id='signText'>" + JSON.stringify(participantInput) + "</textarea>";
		innerTr += "</td><td><input type='button' onClick='GPGAuth.goahead()' value='";
		innerTr += _("Save");
		innerTr += "' />";
		innerTr += "</td>";
		Poll.exchangeAddParticipantRow(innerTr);
	} else {
		submitfunc(participantInput);
	}
};

if (GPGAuth.enabled) {
	Poll.prepareParticipantInput(GPGAuth.handleUserInput, {
		before: function () {
			var label = {};
			label[GPGAuth.enabled] = _("Next");
			label[!GPGAuth.enabled] = $("#savebutton").val();
			$("#savebutton").val(label[GPGAuth.enabled]);
			$("#savebutton").after("<br /><input type='checkbox' id='useGPG' /><label for='useGPG'> " + _("Sign Vote") + "</label>");
			$("#useGPG").live("click", function () {
				GPGAuth.enabled = !GPGAuth.enabled;
				$("#savebutton").val(label[GPGAuth.enabled]);
				// use replaceWith instead of val() to make it resistant to form.reset
				$("#useGPG").replaceWith("<input type='checkbox' " + (GPGAuth.enabled ? "checked='checked' " : "") + "id='useGPG' />");
			});
			$("#useGPG").attr("checked", GPGAuth.enabled);
		}
	});
}
