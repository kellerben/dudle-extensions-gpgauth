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

GPGAuth.getPublicKey = function (keyID, successfunc, notfoundfunc) {
	$.ajax({
		url: GPGAuth.extDir + '/keyserver.cgi',
		data: {
			service: 'getPublicKey',
			keyid: keyID
		},
		method: "get",
		success: function (pubKey) {
			successfunc(new PublicKey(pubKey)); // FIXME: adopt this
		},
		error: function () {
			notfoundfunc();
		}
	});
};

GPGAuth.replaceName = function (name, userinput, sig, key) {
	var pname = $("<p>" + userinput.name + "</p>"),
	 newname = "", alt, img;
	if (key) {
		if (sig.correct) {
			alt = _("Signed Vote");
			img = "signed";
		} else {
			alt = _("Broken Signature");
			img = "signed_broken";
			newname += "<span class='warning' style='text-decoration: line-through' title='" + _("This vote was tampered!") + "'>";
		}
	} else {
		alt = _("Public Key was not found");
		img = "signed_unknown";
		key = {name: "unknown", mail: "unknown", fingerprint: "unknown"};
	}
	newname += "<img";
	newname += " style='float: left'";
	newname += " class='GPGAuthSigned'";
	newname += " alt='" + alt + "'";
	newname += " title='" + escapeHtml(key.name) + " " + printf(_("e-mail: %1, fingerprint: %2"), [key.mail, key.fingerprint]) + "'";
	newname += " src='" + GPGAuth.extDir + "/img/" + img + ".png'";
	newname += "/>";
	newname += "<span id='" + gfHtmlID(escapeHtml(name)) + "'>" + name + "</span>";
	if (!sig.correct) {
		newname += "</span>";
	}
	pname.find("#" + gfHtmlID(escapeHtml(name))).replaceWith(newname);
	userinput.name = pname.html();
};

Poll.parseNaddHook(function (name, userinput, returnfunc) {
	var authimage, sig;
	if (userinput.GPGsig) {
		sig = new SignedMessage(userinput.GPGsig); // FIXME: adopt this
		GPGAuth.getPublicKey(sig.keyid, function (pubkey) {
			sig.check(pubkey); //FIXME: adopt this
			$.each(JSON.parse(sig.message), function (col, val) {
				userinput[col] = val;
			});
			GPGAuth.replaceName(name, userinput, sig, pubkey);

			returnfunc();
		}, function () { 
			GPGAuth.replaceName(name, userinput, sig);
			returnfunc();
		});
	} else {
		returnfunc();
	}
});

GPGAuth.enabled = (gfGetLocal("GPGAuth_enable") === "true");
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
			$("#polltable form").live("reset", function(){
				$("#useGPG").replaceWith("<input type='checkbox' " + (GPGAuth.enabled ? "checked='checked' " : "") + "id='useGPG' />");
			})
			$("#useGPG").attr("checked", GPGAuth.enabled);
		}
	});
}

//if (!Poll.submitIsBound) {
//  Poll.submitHook(function (userinput) {
//    alert(e);
//  });
//}
