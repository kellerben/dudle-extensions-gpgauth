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
			successfunc(openpgp.key.readArmored(pubKey));
		},
		error: function () {
			notfoundfunc();
		}
	});
};

GPGAuth.replaceName = function (userinput, sig, key) {
	var alt, img, title;
	userinput.before_name = userinput.before_name || "";
	if (key) {
		if (sig.verify(key.keys)[0].valid) {
			alt = _("Signed Vote");
			img = "signed";
		} else {
			alt = _("Broken Signature");
			img = "signed_broken";
			userinput.before_name = "<span class='warning' style='text-decoration: line-through' title='" + _("This vote was tampered!") + "'>" + userinput.before_name;
		}
		title = printf(_("%1, %2"), [key.keys[0].users[0].userId.userid, key.keys[0].primaryKey.fingerprint.toUpperCase().replace(/(....)/g,"$1 ").trim()]);
	} else {
		alt = _("Public Key was not found");
		img = "signed_unknown";
		title = printf(_("Unknown Signer (key not found: %1)"), [sig.getSigningKeyIds()[0].toHex().toUpperCase().replace(/(........)/g,"$1 ").trim()]);
	}
	userinput.before_name += "<img";
	userinput.before_name += " style='float: left'";
	userinput.before_name += " class='GPGAuthSigned'";
	userinput.before_name += " alt='" + alt + "'";
	userinput.before_name += " title='" + title + "'";
	userinput.before_name += " src='" + GPGAuth.extDir + "/img/" + img + ".png'";
	userinput.before_name += "/>";
	if (key && !sig.verify(key.keys)[0].valid) {
		userinput.after_name = userinput.after_name || "";
		userinput.after_name += "</span>";
		//userinput.id = gfHtmlID(escapeHtml(key.keys[0].users[0].userId.userid));
	}
};
Poll.parseNaddHook(function (userinput, returnfunc) {
	var authimage, sig;
	if (userinput.GPGsig) {
		try {
			sig = openpgp.cleartext.readArmored(userinput.GPGsig);
			GPGAuth.getPublicKey(sig.getSigningKeyIds()[0].toHex(), function (pubkey) {
				var sigmsg;
				try {
					sigmsg = JSON.parse(sig.text);
					sigmsg.name = escapeHtml(sigmsg.name);
					$.each(sigmsg, function (col, val) {
						userinput[col] = val;
					});
					GPGAuth.replaceName(userinput, sig, pubkey);
				} catch (err) {
					Poll.addParticipantTR(userinput.id,printf(_("Error while parsing the vote of %1."), [escapeHtml(userinput.name)]));
					//console.log("Could not parse: " + sig.text);
					//console.log(err);
				}
				returnfunc();
			}, function () { 
				GPGAuth.replaceName(userinput, sig);
				returnfunc();
			});
		} catch (err) {
			Poll.addParticipantTR(userinput.id,printf(_("Error while parsing the PGP signature of %1."), [escapeHtml(userinput.name)]));
			//console.log("Could not parse: " + userinput.GPGsig);
			//console.log(userinput);

			//console.log(err);
		}
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
		var innerTr, oldname;
		innerTr = "<td colspan='2'>";
		innerTr += _("Please sign the following code:");
		innerTr += "</td><td colspan='"; 
		innerTr += Poll.columns.length;
		oldname = participantInput.oldname;
		delete participantInput.oldname;
		innerTr += "'><textarea rows='5' cols='40' id='signText'>" + JSON.stringify(participantInput) + "</textarea>";
		participantInput.oldname = oldname;
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
			$("#useGPG").on("click", function () {
				GPGAuth.enabled = !GPGAuth.enabled;
				$("#savebutton").val(label[GPGAuth.enabled]);
				// use replaceWith instead of val() to make it resistant to form.reset
				$("#useGPG").replaceWith("<input type='checkbox' " + (GPGAuth.enabled ? "checked='checked' " : "") + "id='useGPG' />");
			});
			$("#polltable form").on("reset", function(){
				$("#useGPG").replaceWith("<input type='checkbox' " + (GPGAuth.enabled ? "checked='checked' " : "") + "id='useGPG' />");
			})
			$("#useGPG").attr("checked", GPGAuth.enabled);
		}
	});
}

